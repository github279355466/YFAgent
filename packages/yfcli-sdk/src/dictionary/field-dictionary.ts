/**
 * 字典层 —— 按表查询字段元数据。
 *
 * 数据源：`knowledge/data-dictionary/field-index.csv`（54842 行 / 1173 张表）。
 * 该文件由 `scripts/gen_data_dictionary.py` 生成，**不可手工编辑**
 * （`npm run check:domain` 有 --check 门禁）。
 *
 * 列名形态判据见 `column-shapes.ts`（OPEN-F7 冻结口径）。
 */

import type { CsvRow } from './csv.js';
import { parseCsv, toRecords } from './csv.js';
import type { YfColumnShape } from './column-shapes.js';
import {
  ANOMALY_SHAPES,
  OPEN_F4_EXCLUDED_TABLES,
  TABLE_ANOMALY_NOTES,
  classifyColumn,
} from './column-shapes.js';

/** 单个字段的完整元数据。 */
export interface FieldInfo {
  /** 物理表名，如 `PURTC`。 */
  readonly table: string;
  /** 表中文名，如「采购订单」。 */
  readonly tableCn: string;
  /** 列名（物理列），如 `TC001`。 */
  readonly column: string;
  /** 中文名。孤儿表上会出现中文列名本身（如 `币种`）。 */
  readonly columnCn: string;
  /** 字段序号，如 `0001`。 */
  readonly seq: string;
  /** 所属模块前缀，如 `PUR`。 */
  readonly module: string;
  /** 规范化的类型，如 `char` / `numeric` / `int`。 */
  readonly typeNorm: string;
  /** 精度。 */
  readonly precision: string;
  /** 格式掩码（日期/数值格式串）。 */
  readonly formatMask: string;
  /** 是否为用户自定义字段（UDF）。 */
  readonly isUdf: boolean;
  /** 是否为网关注入的管理字段。 */
  readonly isMgmt: boolean;
  /** 该列名的形态分类（OPEN-F7）。 */
  readonly shape: YfColumnShape;
}

/** 表的元数据。 */
export interface TableInfo {
  readonly table: string;
  readonly tableCn: string;
  readonly module: string;
  readonly fieldCount: number;
  /** 形态分布计数：形态 → 条数。 */
  readonly shapeCounts: Readonly<Record<string, number>>;
  /** 命中 OPEN-F4 排除清单时为true。 */
  readonly excluded: boolean;
  /** 排除原因（仅 excluded 为 true 时有值）。 */
  readonly excludedReason?: string;
  /** 字段中文名去重后的列表（部分表含中文列名）。 */
  readonly fieldNames: readonly string[];
}

/** 查询选项。 */
export interface ListFieldsOptions {
  /**
   * 是否包含 OPEN-F4 排除清单中的 7 张孤儿表。
   * 默认 `false` —— 字典层默认排除，但可显式查。
   */
  readonly includeExcluded?: boolean;
  /** 仅返回该形态的字段。 */
  readonly shape?: YfColumnShape;
}

const EXCLUDED_SET: ReadonlySet<string> = new Set(OPEN_F4_EXCLUDED_TABLES);

/**
 * 字典索引。
 *
 * 构造时一次性建表索引，`listFields` 为 O(1) 查表+ 过滤。
 */
export class FieldDictionary {
  private readonly byTable: ReadonlyMap<string, readonly FieldInfo[]>;

  public constructor(rows: readonly Record<string, string>[]) {
    const acc = new Map<string, FieldInfo[]>();
    for (const row of rows) {
      const table = (row['table'] ?? '').trim();
      const column = (row['column'] ?? '').trim();
      if (table === '' || column === '') continue;
      const shape = classifyColumn(column, table);
      const info: FieldInfo = {
        table,
        tableCn: (row['table_cn'] ?? '').trim(),
        column,
        columnCn: (row['column_cn'] ?? '').trim(),
        seq: (row['seq'] ?? '').trim(),
        module: (row['module'] ?? '').trim(),
        typeNorm: (row['type_norm'] ?? '').trim(),
        precision: (row['precision'] ?? '').trim(),
        formatMask: (row['format_mask'] ?? '').trim(),
        isUdf: (row['is_udf'] ?? '0').trim() === '1' || shape === 'udf',
        isMgmt: (row['is_mgmt'] ?? '0').trim() === '1' || shape === 'gateway-injected',
        shape,
      };
      const list = acc.get(table);
      if (list === undefined) acc.set(table, [info]);
      else list.push(info);
    }
    this.byTable = acc;
  }

  /** 从 CSV 文本构造。 */
  public static fromCsv(text: string): FieldDictionary {
    const rows: CsvRow[] = parseCsv(text);
    return new FieldDictionary(toRecords(rows));
  }

  /**
   * 列出某表的全部字段。
   *
   * **必须支持 7 种列名形态** —— 若只按 `XXnnn` 解析，
   * 2.7% 的字段（711 条）将查不到，调用方会误判「该表无此字段」。
   */
  public listFields(table: string, options: ListFieldsOptions = {}): readonly FieldInfo[] {
    const key = table.trim().toUpperCase();
    const all = this.byTable.get(key);
    if (all === undefined) {
      throw new Error(
        `表 ${table} 不在 field-index.csv 中（共 ${this.byTable.size} 张表）。` +
        '注意：字段名 ≠ 表名，E10 的物理表名多为 5~8 字符大写（如 PURTC / ACTMS205）。' +
        '若确认该表存在，请检查 gen_data_dictionary.py 的抽取条件。',
      );
    }
    if (options.includeExcluded !== true && EXCLUDED_SET.has(key)) {
      throw new Error(
        `表 ${key} 属 OPEN-F4 排除清单（已知问题表），字典层默认不返回。` +
        `原因：${TABLE_ANOMALY_NOTES[key] ?? '未记录'}。` +
        '如确需查询，请传 { includeExcluded: true }。',
      );
    }
    if (options.shape === undefined) return all;
    return all.filter((f) => f.shape === options.shape);
  }

  /** 表是否存在（不触发排除清单检查）。 */
  public hasTable(table: string): boolean {
    return this.byTable.has(table.trim().toUpperCase());
  }

  /** 列出全部表名（已排序）。 */
  public listTables(): readonly string[] {
    return [...this.byTable.keys()].sort();
  }

  /**
   * 列出 OPEN-F4 排除清单的 7 张表及原因。
   *
   * 默认排除是破坏性决策的反面 —— 这些表在元数据里有完整字段定义，
   * 却不在 `tables.json` 中，来源需人工确认（见 plan 的 advisory）。
   */
  public listExcludedTables(): readonly TableInfo[] {
    return OPEN_F4_EXCLUDED_TABLES.filter((t) => this.byTable.has(t)).map((t) =>
      this.describeTable(t),
    );
  }

  /** 表的元数据 + 形态分布。 */
  public describeTable(table: string): TableInfo {
    const key = table.trim().toUpperCase();
    const fields = this.byTable.get(key);
    if (fields === undefined) {
      throw new Error(`表 ${table} 不在 field-index.csv 中（共 ${this.byTable.size} 张表）`);
    }
    const counts: Record<string, number> = {};
    for (const f of fields) counts[f.shape] = (counts[f.shape] ?? 0) + 1;

    const first = fields[0];
    const excluded = EXCLUDED_SET.has(key);
    const base = {
      table: key,
      tableCn: first?.tableCn ?? '',
      module: first?.module ?? '',
      fieldCount: fields.length,
      shapeCounts: counts,
      excluded,
      fieldNames: fields.map((f) => f.columnCn).filter((n) => n !== ''),
    };
    if (excluded) {
      const reason = TABLE_ANOMALY_NOTES[key];
      return reason === undefined ? base : { ...base, excludedReason: reason };
    }
    return base;
  }

  /**
   * 统计全库的形态分布。
   *
   * 用于回归校验 —— 冻结判据下该分布应恒定，
   * 变了说明产物或判据发生了变化。
   */
  public shapeStats(): Readonly<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const fields of this.byTable.values()) {
      for (const f of fields) counts[f.shape] = (counts[f.shape] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * 列出「真异常」字段。
   *
   * 实测恒为 22 条（`YFMXB` 9 + `YSMXB` 11 + `PURTG2` 2）。
   * 判定方式：形态属 `ANOMALY_SHAPES` 且所在表在排除清单内。
   */
  public listAnomalies(): readonly FieldInfo[] {
    const out: FieldInfo[] = [];
    for (const table of OPEN_F4_EXCLUDED_TABLES) {
      const fields = this.byTable.get(table);
      if (fields === undefined) continue;
      for (const f of fields) {
        if (ANOMALY_SHAPES.includes(f.shape)) out.push(f);
      }
    }
    return out;
  }
}