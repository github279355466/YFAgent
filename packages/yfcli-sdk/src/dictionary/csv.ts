/**
 * CSV 解析 —— RFC 4180 子集。
 *
 * 为什么不用 `split(',')`：`field-index.csv` 的 `column_cn` 列含中文，
 * 且部分值含逗号（如「录入者,修改者」这类描述）—— 直接 split 会错位。
 * 实测踩坑：`table_cn` 与 `column_cn` 均可能含逗号。
 *
 * 本实现只支持双引号包裹 + 双引号转义（`""`），足够覆盖当前产物。
 * 不追求完整 RFC 4180（不处理换行内嵌），但遇到时会显式报错而非静默错位。
 */

/** 单条CSV 记录。 */
export type CsvRow = readonly string[];

/**
 * 解析 CSV 文本为二维数组。
 *
 * @throws 当引号未闭合时抛错 —— 宁可失败也不产出错位数据。
 */
export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldStarted = false;

  const pushField = () => {
    row.push(field);
    field = '';
    fieldStarted = false;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
      continue;
    }
    if (ch === ',') {
      pushField();
      continue;
    }
    if (ch === '\r') {
      continue;
    }
    if (ch === '\n') {
      pushRow();
      continue;
    }
    field += ch;
    fieldStarted = true;
  }

  if (inQuotes) {
    throw new Error('CSV 解析失败：引号未闭合。产物格式异常，请重新生成 field-index.csv');
  }
  // 文件末尾无换行时补上最后一行
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // 去掉全空的尾行
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last !== undefined && last.every((c) => c === '')) rows.pop();
    else break;
  }
  return rows;
}

/** 把首行作表头转为 Record。 */
export function toRecords(rows: readonly CsvRow[]): readonly Record<string, string>[] {
  const first = rows[0];
  if (first === undefined) return [];
  const header = first;
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row === undefined) continue;
    const rec: Record<string, string> = {};
    for (let c = 0; c < header.length; c += 1) {
      rec[header[c] ?? ''] = row[c] ?? '';
    }
    out.push(rec);
  }
  return out;
}