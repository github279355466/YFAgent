/**
 * 客户端编排 —— 串联配置、服务名查表、封包、传输、解析。
 *
 * 本文件只做编排，不含协议细节（细节在 conditions / response / transport 层）
 * 也不含业务规则（业务规则在上层调用方）。
 *
 * CRUD 五操作：query / read / create / update / delete。
 * approve / disapprove / invalid 走通用 action 方法。
 */

import type { ResolvedRuntimeConfig } from '../types/config.js';
import type {
  YfActionResult,
  YfEnumFieldSpec,
  YfOperation,
  YfQueryResult,
  YfServiceNameResolver,
} from '../types/domain.js';
import type { YfErrorContext } from '../types/errors.js';
import { YfError, emptyResultError } from '../types/errors.js';
import type { YfRequestEnvelope } from '../types/protocol.js';
import type {
  YfConditionField,
  YfDataKeysParameter,
  YfEntityParameter,
  YfQueryParameter,
} from '../types/conditions.js';
import type { YfTransport } from '../transport/http-transport.js';
import { FetchTransport, assertHttpOk } from '../transport/http-transport.js';
import {
  buildBusinessError,
  describeEmptyResultWarning,
  isSuccessCode,
  parseActionResult,
  parseEnvelope,
  parseQueryResult,
} from '../response/parser.js';
import { extractCode, looksLikeCodeText } from '../conditions/enum-guard.js';
import { redact } from '../logging/redact.js';

/** 可注入的日志出口，便于 CLI / MCP / 测试分别接管。 */
export interface YfLogger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
}

/** 丢弃全部日志的默认实现。 */
export const NOOP_LOGGER: YfLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

export interface YfClientOptions {
  readonly config: ResolvedRuntimeConfig;
  readonly catalog: YfServiceNameResolver;
  /** 可选：注入自定义传输（测试用）。默认 FetchTransport。 */
  readonly transport?: YfTransport;
  /** 可选：注入日志出口。默认 NOOP_LOGGER。 */
  readonly logger?: YfLogger;
  /** 可选：枚举字段规格表，用于 query 时自动清洗「编码.中文」形态。 */
  readonly enumSpecs?: Readonly<Record<string, YfEnumFieldSpec>>;
}

/**
 * 易飞 OpenAPI 客户端。
 *
 * 使用方必须先通过 config 层完成 fail-fast 校验再构造本类 ——
 * 构造函数不做配置校验（校验职责在 config 层，此处不重复）。
 */
export class YfClient {
  private readonly config: ResolvedRuntimeConfig;
  private readonly catalog: YfServiceNameResolver;
  private readonly transport: YfTransport;
  private readonly logger: YfLogger;
  private readonly enumSpecs: Readonly<Record<string, YfEnumFieldSpec>>;

  public constructor(options: YfClientOptions) {
    this.config = options.config;
    this.catalog = options.catalog;
    this.transport = options.transport ?? new FetchTransport();
    this.logger = options.logger ?? NOOP_LOGGER;
    this.enumSpecs = options.enumSpecs ?? {};
  }

  /**
   * 动态替换当前 token。
   *
   * 用于 MCP 场景：每个请求从 Bearer header 提取不同 token，
   * 通过此方法注入到 client 实例中，避免为每个请求重建 client。
   */
  public setAuthToken(token: string): void {
    // ResolvedRuntimeConfig 是 readonly，但 token 字段需要运行时更新
    (this.config as { token: string }).token = token;
  }

  // ================================================================ CRUD 五操作

  /**
   * 查询（query.get）——批量单头列表，不含明细/单身。
   *
   * ⚠️ 本方法不支持 node_name 参数查单身字段。
   * 需要查单身/明细数据请用 read() 方法（read.get）。
   * 用 query.get 传 node_name 会报 MA012未定義（2026-10-09 实测确认）。
   *
   * 数据通道：`parameter.result.rows` + `total_result` / `has_next` / `cnt`。
   * 注意易飞无 fastquery，每次调用重查数据库，页码大时代价线性增长。
   *
   * 枚举清洗：若 conditions.fields 中含已登记的 codedText 字段且值为「编码.中文」
   * 形态，自动修正为纯编码并输出 WARN。
   */
  public async query(
    typeKey: string,
    parameter: YfQueryParameter,
  ): Promise<YfQueryResult> {
    const serviceName = this.catalog.resolveServiceName(typeKey, 'query');

    // 枚举清洗：扫描 conditions.fields 中的 codedText 字段
    const cleanedParameter = this.cleanEnumConditions(parameter);

    const envelope = wrap(cleanedParameter);
    const context = this.contextFor(serviceName, typeKey, 'query');
    const raw = await this.send(serviceName, envelope, context);

    const envelopeParsed = parseEnvelope(decodeBody(raw.bodyText));
    this.assertBusinessOk(envelopeParsed, context);

    const result = parseQueryResult(envelopeParsed.std_data.parameter);
    this.logger.debug('query 完成', {
      serviceName,
      typeKey,
      returned: result.rows.length,
      totalResult: result.totalResult,
      elapsedMs: raw.elapsedMs,
    });

    // 查询类空结果不抛错：条件无匹配是合法情形。
    // 但 code=0 + 空集与「条件写错」无法区分，故按配置决定是否告警。
    if (result.rows.length === 0 && this.config.warnOnSilentError) {
      const entry = this.catalog.findEntry(typeKey);
      this.logger.warn(
        `${serviceName} 返回 0 行。若预期有数据，请排查条件是否写错` +
        '（易飞对错误条件常返回 code=0 + 空集，不报错）。',
        { serviceName, typeKey, elapsedMs: raw.elapsedMs, primaryKey: entry?.primaryKey ?? [] },
      );
    }
    return result;
  }

  /**
   * 主键读取（read）。
   *
   * 数据通道：`parameter.result.success[]`。
   * 复合主键极普遍，datakeys 必须含全部主键字段。
   * 主键全错时返回 code=0 + 空数组，触发空结果告警。
   */
  public async read(
    typeKey: string,
    parameter: YfDataKeysParameter,
  ): Promise<YfActionResult> {
    return this.action(typeKey, 'read', parameter);
  }

  /**
   * 创建实体（create）。
   *
   * 必须提供业务主键 + 不可空白字段。
   * 支持单别自动审核（由服务端控制，SDK 不做额外处理）。
   * 入参容器名即逻辑节点名，与对象名并非总是相关。
   */
  public async create(
    typeKey: string,
    parameter: YfEntityParameter,
  ): Promise<YfActionResult> {
    const serviceName = this.catalog.resolveServiceName(typeKey, 'create');
    const envelope = wrap(parameter);
    const context = this.contextFor(serviceName, typeKey, 'create');

    this.logger.debug('create 发起', {
      serviceName,
      typeKey,
      parameterPreview: redact(parameter),
    });

    const raw = await this.send(serviceName, envelope, context);
    const envelopeParsed = parseEnvelope(decodeBody(raw.bodyText));
    this.assertBusinessOk(envelopeParsed, context);

    const result = parseActionResult(envelopeParsed.std_data.parameter, serviceName, context);
    this.logger.info('create 完成', {
      serviceName,
      typeKey,
      itemCount: result.items.length,
      elapsedMs: raw.elapsedMs,
    });
    return result;
  }

  /**
   * 更新实体（update）。
   *
   * 约束（AGENTS.md §6）：
   * - 按主键定位（datakeys 须含全部主键字段）
   * - 单身须含所有输入字段
   * - 单身「存在则更新、不存在则新增」
   * - 不支持删除单身
   * - 单头与单身 key 必须一致
   */
  public async update(
    typeKey: string,
    parameter: YfEntityParameter,
  ): Promise<YfActionResult> {
    const serviceName = this.catalog.resolveServiceName(typeKey, 'update');
    const envelope = wrap(parameter);
    const context = this.contextFor(serviceName, typeKey, 'update');

    this.logger.debug('update 发起', {
      serviceName,
      typeKey,
      parameterPreview: redact(parameter),
    });

    const raw = await this.send(serviceName, envelope, context);
    const envelopeParsed = parseEnvelope(decodeBody(raw.bodyText));
    this.assertBusinessOk(envelopeParsed, context);

    const result = parseActionResult(envelopeParsed.std_data.parameter, serviceName, context);
    this.logger.info('update 完成', {
      serviceName,
      typeKey,
      itemCount: result.items.length,
      elapsedMs: raw.elapsedMs,
    });
    return result;
  }

  /**
   * 删除实体（delete）。
   *
   * 按主键定位，datakeys 须含全部主键字段。
   */
  public async delete(
    typeKey: string,
    parameter: YfDataKeysParameter,
  ): Promise<YfActionResult> {
    return this.action(typeKey, 'delete', parameter);
  }

  // ================================================================ 通用主键操作

  /**
   * 主键类操作（read / delete / approve / disapprove / invalid）。
   *
   * 数据通道：`parameter.result.success[]`。
   *
   * 复合主键极普遍，调用方必须把 `primary_key` 的**全部**字段放进 datakeys；
   * 缺一个服务端报「缺少[x]的鍵值參數」，全错则返回 code=0 + 空数组。
   */
  public async action(
    typeKey: string,
    operation: Exclude<YfOperation, 'query' | 'create' | 'update'>,
    parameter: YfDataKeysParameter,
  ): Promise<YfActionResult> {
    const serviceName = this.catalog.resolveServiceName(typeKey, operation);
    this.assertDataKeysCoverPrimary(typeKey, parameter);

    const envelope = wrap(parameter);
    const context = this.contextFor(serviceName, typeKey, operation);
    const raw = await this.send(serviceName, envelope, context);

    const envelopeParsed = parseEnvelope(decodeBody(raw.bodyText));
    this.assertBusinessOk(envelopeParsed, context);

    const result = parseActionResult(envelopeParsed.std_data.parameter, serviceName, context);
    if (result.empty && this.config.warnOnSilentError) {
      const entry = this.catalog.findEntry(typeKey);
      this.logger.warn(
        describeEmptyResultWarning(serviceName, entry?.primaryKey ?? []),
        { serviceName, typeKey, operation, elapsedMs: raw.elapsedMs },
      );
    }
    return result;
  }

  // ------------------------------------------------------------ 内部

  private async send(
    serviceName: string,
    envelope: YfRequestEnvelope,
    context: YfErrorContext,
  ) {
    const raw = await this.transport.post(this.config, serviceName, envelope, context);
    assertHttpOk(raw, context);
    return raw;
  }

  private assertBusinessOk(
    envelope: ReturnType<typeof parseEnvelope>,
    context: YfErrorContext,
  ): void {
    const { execution } = envelope.std_data;
    if (isSuccessCode(execution.code)) return;
    throw buildBusinessError(envelope, context);
  }

  /**
   * 校验 datakeys 覆盖了全部主键字段。
   *
   * 目的：把「缺少[x]的鍵值參數」这类可预防的服务端报错提前到本地，
   * 且给出明确指认哪个字段缺失。
   */
  private assertDataKeysCoverPrimary(
    typeKey: string,
    parameter: YfDataKeysParameter,
  ): void {
    const entry = this.catalog.findEntry(typeKey);
    if (entry === undefined || entry.primaryKey.length === 0) return;

    if (parameter.datakeys.length === 0) {
      throw emptyResultError(
        `${typeKey} 的 datakeys 为空。复合主键对象（${entry.primaryKey.join(' + ')}）` +
        '至少需要一个键值对象。',
      );
    }

    const first = parameter.datakeys[0];
    if (first === undefined) return;

    const missing = entry.primaryKey.filter(
      (pk) => first[pk] === undefined || first[pk] === null || first[pk] === '',
    );
    if (missing.length === 0) return;

    throw new YfError({
      layer: 'business',
      kind: 'primary_key_missing',
      message:
        `${typeKey} 的 datakeys 缺少主键字段：${missing.join(', ')}。` +
        `该对象主键为 ${entry.primaryKey.join(' + ')}，` +
        '复合主键须全部提供，缺一个服务端即报「缺少[x]的鍵值參數」。',
    });
  }

  /**
   * 清洗 query conditions 中的枚举字段值。
   *
   * 遍历 conditions.fields，对已登记为 codedText 的字段检测「编码.中文」形态，
   * 自动修正为纯编码并输出 WARN。未登记字段不做处理。
   *
   * 返回新的 parameter 对象（不可变），原对象不被修改。
   */
  private cleanEnumConditions(parameter: YfQueryParameter): YfQueryParameter {
    if (Object.keys(this.enumSpecs).length === 0) return parameter;

    const fields = parameter.conditions?.fields;
    if (!Array.isArray(fields) || fields.length === 0) return parameter;

    let hasCorrection = false;
    const cleanedFields = fields.map((f) => {
      if (!isConditionField(f)) return f;
      const spec = this.enumSpecs[f.field_name];
      if (spec === undefined || !spec.codedText) return f;
      if (!looksLikeCodeText(f.value)) return f;

      const corrected = extractCode(f.value);
      this.logger.warn(
        `枚举清洗：${f.field_name} 的值 "${f.value}" 含中文后缀，已自动修正为 "${corrected}"。` +
        '易飞文本型枚举作为查询条件只认纯编码，传完整串会返回 code=0 + 0 条。',
        { fieldName: f.field_name, originalValue: f.value, correctedValue: corrected },
      );
      hasCorrection = true;
      return { ...f, value: corrected };
    });

    if (!hasCorrection) return parameter;
    return {
      ...parameter,
      conditions: { ...parameter.conditions, fields: cleanedFields },
    };
  }

  private contextFor(
    serviceName: string,
    typeKey: string,
    operation: string,
  ): YfErrorContext {
    return { serviceName, typeKey, operation };
  }
}

// ------------------------------------------------------------------ 局部工具

/** 固定封包：`std_data` → `parameter`。 */
function wrap<TParameter>(parameter: TParameter): YfRequestEnvelope<TParameter> {
  return { std_data: { parameter } };
}

/**
 * 把响应文本解析为 JSON。
 *
 * 仅在 assertHttpOk 通过后调用 —— 非 200 时 body 可能是 HTML，解析必然失败。
 * 解析失败归为 protocol 层错误，与业务失败区分开。
 */
function decodeBody(bodyText: string): unknown {
  try {
    return JSON.parse(bodyText) as unknown;
  } catch (cause) {
    throw new YfError({
      layer: 'protocol',
      kind: 'malformed_response',
      message:
        `HTTP 200 但响应体不是合法 JSON：${cause instanceof Error ? cause.message : String(cause)}。` +
        '若易飞侧刚升级过网关，需重新核对响应契约。',
      rawData: bodyText.slice(0, 200),
    });
  }
}

/** 类型守卫：区分 YfConditionField 与嵌套 YfConditionGroup。 */
function isConditionField(
  item: YfConditionField | import('../types/conditions.js').YfConditionGroup,
): item is YfConditionField {
  return 'field_name' in item && 'operator' in item && 'value' in item;
}