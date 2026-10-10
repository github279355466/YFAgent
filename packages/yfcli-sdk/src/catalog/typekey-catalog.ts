/**
 * 服务名解析器 —— 从 `knowledge/typekey/typekey_map.yaml` 查表，禁止拼接。
 *
 * 拼接必错的真机反例（docs/plans/yf-live-probe-report.md §七）：
 * | type_key | 实际服务名 | 按 `{type_key}.data.query.get` 拼接的结果 |
 * |---|---|---|
 * | customer | yf.oapi.customer.data.query.get | 恰好正确（易误导） |
 * | supplier | yf.oapi.supplier.query.get（无 .data 段） | yf.oapi.supplier.data.query.get -> code=-1 |
 * | document.type.general | yf.oapi.document.type.general.query.get | 错 |
 * | item.inventory.qty | yf.oapi.item.inventory.qty.query.get | 错 |
 *
 * 已知 6 个无 .data 段的对象形态各异（bom / document.type.general /
 * function.category / item.customer.price / item.inventory.qty / item.supplier.price）。
 * 靠规律推导必错，故本模块只做查表与存在性校验。
 */

import type {
  YfOperation,
  YfServiceNameResolver,
  YfTypeKeyEntry,
} from '../types/domain.js';
import { YF_OPERATIONS } from '../types/domain.js';
import { YfAmbiguousServiceError, YfError } from '../types/errors.js';

/** YAML 文件的最小结构（与 extract-typekey-map.mjs 的输出一致）。 */
interface RawTypeKeyFile {
  readonly typekeys?: readonly RawTypeKeyItem[];
}

interface RawTypeKeyItem {
  readonly type_key?: unknown;
  readonly title?: unknown;
  readonly services?: unknown;
  readonly primary_key?: unknown;
  readonly detail_nodes?: unknown;
  readonly operation_extra_keys?: unknown;
  readonly unavailable?: unknown;
  readonly unavailable_reason?: unknown;
}

/**
 * 由已加载的 YAML 数据构造解析器。
 *
 * 入参用unknown 而非 any：YAML 解析结果在编译期不可知，
 * 必须经类型守卫收敛。
 */
export class TypeKeyCatalog implements YfServiceNameResolver {
  private readonly entries: ReadonlyMap<string, YfTypeKeyEntry>;

  public constructor(raw: unknown) {
    this.entries = buildIndex(raw);
  }

  public resolveServiceName(typeKey: string, operation: YfOperation): string {
    const entry = this.entries.get(typeKey);
    if (entry === undefined) {
      throw new YfError({
        layer: 'business',
        kind: 'service_not_registered',
        message:
          `type_key "${typeKey}" 不在 knowledge/typekey/typekey_map.yaml 中。` +
          `已知 ${this.entries.size} 个业务对象。请查表确认键名，勿按规律推导。`,
      });
    }

    if (entry.unavailable) {
      throw new YfError({
        layer: 'business',
        kind: 'service_not_registered',
        message:
          `type_key "${typeKey}" 已标记为不可用：${entry.unavailableReason ?? '未记录原因'}。` +
          '该状态下禁止发起调用。',
      });
    }

    // Check for service name conflicts (OPEN-F8)
    const conflictForOp = entry.conflictCandidates?.find((candidate) => candidate.op === operation);
    if (conflictForOp !== undefined) {
      throw new YfAmbiguousServiceError(
        typeKey,
        operation,
        [conflictForOp.kept, conflictForOp.dropped],
      );
    }

    const serviceName = entry.services[operation];
    if (serviceName === undefined) {
      const available = Object.keys(entry.services).join(', ');
      throw new YfError({
        layer: 'business',
        kind: 'service_not_registered',
        message:
          `type_key "${typeKey}" 无 ${operation} 服务。` +
          `该对象已登记的服务：${available || '（空）'}。` +
          '不同对象的操作集合不同，不可假设八种操作齐全。',
      });
    }
    return serviceName;
  }

  public findEntry(typeKey: string): YfTypeKeyEntry | undefined {
    return this.entries.get(typeKey);
  }

  public listTypeKeys(): readonly string[] {
    return [...this.entries.keys()].sort();
  }

  /** 统计已登记的服务名总数，用于与 YAML 头部 services_unique 交叉校验。 */
  /**
   * 返回该对象该操作所需的**全部**键值字段（业务主键 + 操作额外键）。
   *
   * 真机实测（2026-10-10）：sales.order 的 approve 需要 4 个键
   * （doc_type_no + doc_no + docdate + approvedate），而 `primaryKey` 只登记前 2 个。
   * 调用方构造 datakeys 时应使用本方法，而非直接用 primaryKey。
   *
   * @returns 主键优先、其后追加该操作的额外键（去重、保序）
   */
  public requiredDataKeys(typeKey: string, operation: YfOperation): readonly string[] {
    const entry = this.entries.get(typeKey);
    if (entry === undefined) return [];
    const extra = entry.operationExtraKeys?.[operation] ?? [];
    const seen = new Set<string>(entry.primaryKey);
    const out: string[] = [...entry.primaryKey];
    for (const key of extra) {
      if (!seen.has(key)) { seen.add(key); out.push(key); }
    }
    return out;
  }

  public countServices(): number {
    const set = new Set<string>();
    for (const entry of this.entries.values()) {
      for (const name of Object.values(entry.services)) {
        if (typeof name === 'string') set.add(name);
      }
    }
    return set.size;
  }
}

/** 建立 type_key → 条目的索引，并做结构性校验。 */
function buildIndex(raw: unknown): ReadonlyMap<string, YfTypeKeyEntry> {
  const file = asObject(raw, 'typekey_map.yaml');
  const rawItems = file['typekeys'];
  if (!Array.isArray(rawItems)) {
    throw new YfError({
      layer: 'business',
      kind: 'service_not_registered',
      message:
        'typekey_map.yaml 缺少 typekeys 数组。该文件应由 scripts/extract-typekey-map.mjs 生成，' +
        '手工编辑会导致 --check 门禁失败。',
    });
  }

  const index = new Map<string, YfTypeKeyEntry>();
  for (const rawItem of rawItems) {
    const entry = readEntry(rawItem);
    if (index.has(entry.typeKey)) {
      throw new YfError({
        layer: 'business',
        kind: 'service_not_registered',
        message: `typekey_map.yaml 中 type_key "${entry.typeKey}" 重复。抽取脚本产物不应有重复键。`,
      });
    }
    index.set(entry.typeKey, entry);
  }
  return index;
}

function readEntry(rawItem: unknown): YfTypeKeyEntry {
  const item = asObject(rawItem, 'typekeys 项');
  const typeKey = item['type_key'];
  if (typeof typeKey !== 'string' || typeKey.length === 0) {
    throw new YfError({
      layer: 'business',
      kind: 'service_not_registered',
      message: 'typekeys 项缺少合法的 type_key 字段',
    });
  }

  const unavailableRaw = item['unavailable'];
  const unavailable = unavailableRaw === true;
  const reasonRaw = item['unavailable_reason'];
  const conflictCandidates = readConflictCandidates(item['service_conflicts']);
  const base = {
    typeKey,
    title: readString(item['title']) ?? typeKey,
    services: readServices(item['services']),
    primaryKey: readStringArray(item['primary_key']),
    detailNodes: readStringArray(item['detail_nodes']),
    operationExtraKeys: readOperationExtraKeys(item['operation_extra_keys']),
    unavailable,
    conflictCandidates: conflictCandidates.length > 0 ? conflictCandidates : undefined,
  };
  return unavailable && typeof reasonRaw === 'string'
    ? { ...base, unavailableReason: reasonRaw }
    : base;
}

/**
 * 收敛 `operation_extra_keys`（审核类操作除主键外还需的键）。
 *
 * YAML 形态：`{ approve: [docdate, approvedate], disapprove: [...] }`。
 * 只接受 YfOperation 键且值为非空字符串数组；其余一律忽略（宁可少报也不误导）。
 */
function readOperationExtraKeys(
  raw: unknown,
): Readonly<Partial<Record<YfOperation, readonly string[]>>> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const out: Partial<Record<YfOperation, readonly string[]>> = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(YF_OPERATIONS as readonly string[]).includes(key)) continue;
    const keys = readStringArray(value);
    if (keys.length === 0) continue;
    out[key as YfOperation] = keys;
    count += 1;
  }
  return count > 0 ? out : undefined;
}

/** 收敛 services 字段，只接受 YfOperation 键且值非空字符串。 */
function readServices(raw: unknown): Partial<Record<YfOperation, string>> {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Partial<Record<YfOperation, string>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'string' || value.length === 0) continue;
    if (!(YF_OPERATIONS as readonly string[]).includes(key)) continue;
    out[key as YfOperation] = value;
  }
  return out;
}

/** Read service_conflicts array from YAML. */
interface ConflictCandidate {
  readonly op: string;
  readonly kept: string;
  readonly dropped: string;
}

function readConflictCandidates(raw: unknown): readonly ConflictCandidate[] {
  if (!Array.isArray(raw)) return [];
  const result: ConflictCandidate[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const rec = item as Record<string, unknown>;
    const op = rec['op'];
    const kept = rec['kept'];
    const dropped = rec['dropped'];
    if (typeof op === 'string' && typeof kept === 'string' && typeof dropped === 'string') {
      result.push({ op, kept, dropped });
    }
  }
  return result;
}

function readStringArray(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function readString(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new YfError({
      layer: 'business',
      kind: 'service_not_registered',
      message: `${label} 结构异常：期望对象，实际为 ${describeType(value)}`,
    });
  }
  return value as Record<string, unknown>;
}

function describeType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '数组';
  return typeof value;
}