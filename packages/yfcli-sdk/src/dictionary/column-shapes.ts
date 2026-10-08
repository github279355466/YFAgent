/**
 * 列名形态判据 —— OPEN-F7 冻结口径。
 *
 * **冻结含义**：本文件的判据是唯一基准，改动会触发 PM 侧
 * `gen_data_dictionary.py` 的断言失败。若发现新的命名变体，
 * **作为独立类别登记**，不得改动基础判据。
 *
 * 依据：`docs/decisions/OPEN-DECISIONS.md` OPEN-F7（五轮复盘定稿），
 * 数据源 `knowledge/data-dictionary/field-index.csv`（54842 行）。
 */

/** 形态标准：两字母 + 三位序号，如 `TC001`。 */
export const COLUMN_SHAPE_STANDARD = /^[A-Z]{2}\d{3}$/;

/** 用户自定义字段（大写形态，源数据如此）。24 个/表。 */
export const UDF_COLUMN_PATTERN = /^UDF\d{2}$/;

/**
 * 7 种列名形态分类器。
 *
 * 数值口径（对齐 OPEN-F7，合计 711 条，占54842 的 1.3%）：
 * | 类别 | 数量 | 样本 |
 * |---|---|---|
 * | standard-std | 大头 | `TC001` |
 * | table-full（7 位完整表名式） | 338 | `GHXA001` |
 * | table-prefix（表别名前缀式） | 257 | `TAI01` |
 * | alpha-only（纯字母） | 65 | `GHXA.ID` / `ISShowST` |
 * | std-prefix-mismatch（形态标准但前缀不符） | 27 | `EFJOBQUE.EF001` |
 * | chinese（含中文） | 20 | `YFMXB.币种` |
 * | len-anomaly（长度异常） | 2 | `DXL.DXL001` |
 * | numeric-degenerate（纯数字退化） | 2 | `PURTG2.01` |
 */
export type YfColumnShape =
  /** 形态标准且前缀命中（占绝大多数） */
  | 'standard'
  /** 7 位完整表名式：`GHXA001` */
  | 'table-full'
  /** 表别名前缀式：`TAI01` */
  | 'table-prefix'
  /** 纯字母（含大小写混合）：`GHXA.ID` / `ISShowST` */
  | 'alpha-only'
  /** 形态标准但并集前缀皆不符：`EFJOBQUE.EF001` */
  | 'std-prefix-mismatch'
  /** 含中文：`YFMXB.币种` */
  | 'chinese'
  /** 长度异常：`DXL.DXL001`（3 字母 + 3 序号） */
  | 'len-anomaly'
  /** 纯数字退化：`PURTG2.01` */
  | 'numeric-degenerate'
  /** UDF（大小写敏感，源数据为大写 UDF） */
  | 'udf'
  /** 网关注入的管理字段 */
  | 'gateway-injected';

/**
 * 前缀判据 —— **并集，必须两侧都查**。
 *
 * ```
 * 前缀匹配 := column[:2] in (table[-2:], table[3:5])
 * ```
 *
 * 单侧判据必然误判，实测数据（复算自 field-index.csv）：
 * | 表 | n | `t[-2:]` | `t[3:5]` | 并集 |
 * |---|---|---|---|---|
 * | ACTMS205 | 32 | 0 | 8 | 8 |
 * | ACTTI205 | 36 | 0 | 12 | 12 |
 * | ACTTH205 | 37 | 0 | 13 | 13 |
 * | DSCINTMA | 29 | 5 | 0 | 5 |
 * | WARRANT | 30 | 6 | 0 | 6 |
 *
 * 原因：E10 表名的实体位有**两种位置**：
 * ```
 * 模块3 + 实体2 PURTC-> TC001   实体位 = t[-2:]
 * 模块3 + 实体2 + 版本后缀 ACTMS205 -> MS001   实体位 = t[3:5:]（末2位是 "05"）
 * 模块3 + 长实体名 DSCINTMA -> MA001   实体位 = t[-2:]（中段是 "IN"）
 * ```
 *
 * 单侧代价（实测）：只用 `t[-2:]` 多判50 条非标准；
 * 只用 `t[3:5]` 多判 11 条。合并后为 27 条（真异常，不可再降）。
 */
export function prefixCandidates(table: string): readonly string[] {
  const out: string[] = [];
  const tail = table.slice(-2);
  if (tail.length === 2) out.push(tail);
  const mid = table.slice(3, 5);
  // `t[3:5]` 需至少 5 字符才有意义；不足时说明表名太短，不适用本判据
  if (table.length >= 5 && mid.length === 2 && !out.includes(mid)) out.push(mid);
  return out;
}

/** 前缀判据（并集）。仅对形态标准的列名有意义。 */
export function prefixMatches(column: string, table: string): boolean {
  const pre = column.slice(0, 2);
  return prefixCandidates(table).includes(pre);
}

/**
 * 判定列名是否适用于前缀判据。
 *
 * 短表名与含下划线的表名不适用（实体位无法定位）：
 * `GHXA`（4 字符）、`DXL`（3 字符）、`IWCTRANSQUEUE`（含下划线的变体）
 * 这类表的列名走7 位式 / 纯字母分支，强行套前缀会误判。
 */
export function prefixApplicable(table: string): boolean {
  if (table.includes('_')) return false;
  if (table.length < 5) return false;
  // 候选位必须互不相同，否则说明实体位无法定位（如 DSCINTMA 之外的退化形态）
  return prefixCandidates(table).length > 0;
}

/**
 * 列名形态分类。
 *
 * @param column 列名（源数据形态，如 `TC001` / `GHXA001` / `UDF01` / `币种`）
 * @param table所属表名，用于前缀判据
 */
export function classifyColumn(column: string, table: string): YfColumnShape {
  if (GATEWAY_INJECTED_NAMES.has(column)) return 'gateway-injected';
  if (UDF_COLUMN_PATTERN.test(column)) return 'udf';

  const isStd = COLUMN_SHAPE_STANDARD.test(column);
  if (isStd) {
    return prefixMatches(column, table) ? 'standard' : 'std-prefix-mismatch';
  }

  // 含中文优先于其他非标准形态
  if (/[\u4e00-\u9fa5]/.test(column)) return 'chinese';
  // 长度异常：3 字母 + 3 序号（DXL001）
  if (/^[A-Z]{3}\d{3}$/.test(column)) return 'len-anomaly';
  // 纯数字退化（可能带小数点）
  if (/^\d+(\.\d+)?$/.test(column)) return 'numeric-degenerate';
  // 7 位完整表名式：4~6 字母 + 3 序号
  if (/^[A-Z]{4,6}\d{3}$/.test(column)) return 'table-full';
  // 表别名前缀式：2~3 字母 + 2 序号
  if (/^[A-Z]{2,3}\d{2}$/.test(column)) return 'table-prefix';
  // 纯字母，**大小写不敏感** —— 实测含 RPTGRIDFMT.ISShowST 这类混合大小写
  if (/^[A-Za-z.]+$/.test(column)) return 'alpha-only';

  return 'alpha-only';
}

/** 是否为「形态标准且前缀命中」的列 —— 即占绝大多数的正常列。 */
export function isStandardColumn(column: string, table: string): boolean {
  return classifyColumn(column, table) === 'standard';
}

/**
 * 判为「真异常」的形态。
 *
 * 实测恒为 22 条（`YFMXB` 9 + `YSMXB` 11 + `PURTG2` 2），五轮复盘从未变过。
 * 注意 `chinese` / `numeric-degenerate` 本身不等于异常 ——
 * 它们只出现在这 3 张孤儿表上，故按表+ 形态双条件判定。
 */
export const ANOMALY_SHAPES: readonly YfColumnShape[] = [
  'chinese',
  'numeric-degenerate',
];

/** 7 张已知问题表（OPEN-F4 排除清单）。字典层默认排除，但可查。 */
export const OPEN_F4_EXCLUDED_TABLES: readonly string[] = [
  'YFMXB',
  'YSMXB',
  'INVLK',
  'INVLL',
  'DXL',
  'PURTG2',
  'V_QIXUBING',
];

/** 7 张表各自的问题说明，用于查询时给出可理解的提示。 */
export const TABLE_ANOMALY_NOTES: Readonly<Record<string, string>> = {
  YFMXB: '应付临时表（孤儿表）：38 字段中 24 为 UDF、9 个中文列名、5 个标准列，无 query 服务且真机探测触发服务端 DLL 崩溃',
  YSMXB: '应收临时表（孤儿表）：38 字段中 24 为 UDF、11 个中文列名、3 个标准列，结构同 YFMXB',
  INVLK: '库存锁定类孤儿表：30 字段全部形态标准，但表清单中缺失，来源待查',
  INVLL: '库存锁明细孤儿表：14 字段全部形态标准，同样在表清单中缺失',
  DXL: '定型料号长度异常：仅 2 字段且名为 DXL001/DXL002，形态为「3 字母+3 序号」',
  PURTG2: '采购 transient 表：列名退化为纯数字 01/02，是真机探测确认的服务端缺陷对象',
  V_QIXUBING: '含下划线的长表名：2 字段（MV001/MV002）形态标准，但前缀判据不适用',
};

/** 网关注入的 7 个管理字段（不出现在物理表元数据中，OPEN-F2）。 */
const GATEWAY_INJECTED_NAMES: ReadonlySet<string> = new Set([
  'company',
  'creator',
  'usr_group',
  'create_date',
  'modifier',
  'modi_date',
  'flag',
]);