/**
 * 客户端编排 —— 串联配置、服务名查表、封包、传输、解析。
 *
 * 本文件只做编排，不含协议细节（细节在 conditions / response / transport 层）
 * 也不含业务规则（业务规则在上层调用方）。
 */

import type { ResolvedRuntimeConfig } from '../types/config.js';
import type {
  YfActionResult,
  YfOperation,
  YfQueryResult,
  YfServiceNameResolver,
} from '../types/domain.js';
import type { YfErrorContext } from '../types/errors.js';
import { YfError, emptyResultError } from '../types/errors.js';
import type { YfRequestEnvelope } from '../types/protocol.js';
import type { YfQueryParameter, YfDataKeysParameter, YfEntityParameter } from '../types/conditions.js';
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

  public constructor(options: YfClientOptions) {
    this.config = options.config;
    this.catalog = options.catalog;
    this.transport = options.transport ?? new FetchTransport();
    this.logger = options.logger ?? NOOP_LOGGER;
  }

  /**
   * 查询（query 类服务）。
   *
   * 数据通道：`parameter.result.rows` + `total_result` / `has_next` / `cnt`。
   * 注意易飞无 fastquery，每次调用重查数据库，页码大时代价线性增长。
   */
  public async query(
    typeKey: string,
    parameter: YfQueryParameter,
  ): Promise<YfQueryResult> {
    const serviceName = this.catalog.resolveServiceName(typeKey, 'query');
    const envelope = wrap(parameter);
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

  /**
   * 写入类操作（create / update）。
   *
   * 未在本骨架中实现的原因：写操作真机未验证
   * （易飞侧缺陷 #12：本次探测仅做只读操作），
   * 且 update 有五条额外约束（单身须含所有输入字段、不支持删除单身、单头单身 key 必须一致等）。
   * 待真机验证后再开放，避免未验证的写路径被误用。
   */
  public async write(
    typeKey: string,
    operation: 'create' | 'update',
    parameter: YfEntityParameter,
  ): Promise<YfActionResult> {
    void typeKey;
    void operation;
    void parameter;
    throw new YfError({
      layer: 'business',
      kind: 'service_not_registered',
      message:
        '写操作（create / update）尚未开放。真机探测仅覆盖只读操作，' +
        '易飞 update 另有一条额外约束（单身须含所有输入字段、不支持删除单身、单头与单身 key 必须一致），' +
        '在完成真机验证前开放写路径风险过高。后续任务：T-14 真机验证写操作后开放。',
    });
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