// 冻结判据回归校验 —— 直接跑真实 field-index.csv，数字对不上就失败
// 用途：OPEN-F7 判据冻结后，任何偏移都必须在此显式失败，而非静默通过
import { readFileSync } from 'node:fs';
import { FieldDictionary } from '../src/dictionary/field-dictionary.ts';
import {
  classifyColumn,
  prefixMatches,
  prefixCandidates,
  prefixApplicable,
  OPEN_F4_EXCLUDED_TABLES,
} from '../src/dictionary/column-shapes.ts';

const csvPath = new URL('../../../knowledge/data-dictionary/field-index.csv', import.meta.url);
const text = readFileSync(csvPath, 'utf8');
const dict = FieldDictionary.fromCsv(text);

let pass = 0;
const fails = [];
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass += 1;
    console.log(`[PASS] ${name}`);
  } else {
    fails.push(name);
    console.log(`[FAIL] ${name}\n期望 ${e}\n实际 ${a}`);
  }
};

console.log('='.repeat(70));
console.log('OPEN-F7 冻结判据回归校验');
console.log('='.repeat(70));

// ---- 1. 前缀并集判据：team-lead给的 5 张关键表
const keyTables = [
  ['ACTMS205', 0, 8, 8],
  ['ACTTI205', 0, 12, 12],
  ['ACTTH205', 0, 13, 13],
  ['DSCINTMA', 5, 0, 5],
  ['WARRANT', 6, 0, 6],
];
for (const [table, expectLast2, expectMid, expectUnion] of keyTables) {
  const fields = dict.listFields(table, { includeExcluded: true });
  const std = fields.filter((f) => /^[A-Z]{2}\d{3}$/.test(f.column));
  const hitLast2 = std.filter((f) => f.column.slice(0, 2) === table.slice(-2)).length;
  const hitMid = std.filter((f) => f.column.slice(0, 2) === table.slice(3, 5)).length;
  const hitUnion = std.filter((f) => prefixMatches(f.column, table)).length;
  check(
    `${table} 并集命中 ${expectUnion}（单侧 ${expectLast2}/${expectMid}）`,
    [hitUnion, hitLast2, hitMid],
    [expectUnion, expectLast2, expectMid],
  );
}

// ---- 2. 全库形态分布：711 口径
const stats = dict.shapeStats();
const totalNonStd =
  (stats['table-full'] ?? 0) +
  (stats['table-prefix'] ?? 0) +
  (stats['alpha-only'] ?? 0) +
  (stats['std-prefix-mismatch'] ?? 0) +
  (stats['chinese'] ?? 0) +
  (stats['len-anomaly'] ?? 0) +
  (stats['numeric-degenerate'] ?? 0);
console.log('');
console.log('全库形态分布:', JSON.stringify(stats, null, 0));
console.log('非标准合计:', totalNonStd);
check('非标准列名总数 = 711', totalNonStd, 711);
check('7位完整表名式 = 338', stats['table-full'] ?? 0, 338);
check('表别名前缀式 = 257', stats['table-prefix'] ?? 0, 257);
check('纯字母 = 65', stats['alpha-only'] ?? 0, 65);
check('形态标准但前缀不符 = 27', stats['std-prefix-mismatch'] ?? 0, 27);
check('含中文 = 20', stats['chinese'] ?? 0, 20);
check('长度异常 = 2', stats['len-anomaly'] ?? 0, 2);
check('纯数字退化 = 2', stats['numeric-degenerate'] ?? 0, 2);
check('UDF = 28008', stats['udf'] ?? 0, 28008);

// ---- 3. 真异常恒为 22
check('真异常 = 22', dict.listAnomalies().length, 22);

// ---- 4. 7 张排除表默认拒绝、显式放行
console.log('');
for (const t of OPEN_F4_EXCLUDED_TABLES) {
  let blocked = false;
  try {
    dict.listFields(t);
  } catch {
    blocked = true;
  }
  const has = dict.hasTable(t);
  let allowed = 0;
  if (has) allowed = dict.listFields(t, { includeExcluded: true }).length;
  check(
    `${t} 默认排除=${blocked} 可显式查询(字段数=${allowed})`,
    [blocked, has],
    [true, true],
  );
}

// ---- 5. 短表名/下划线表名：前缀判据不适用
console.log('');
for (const [table, applicable] of [
  ['GHXA', false],
  ['DXL', false],
  ['V_QIXUBING', false],
  ['PURTC', true],
  ['ACTMS205', true],
]) {
  check(`${table} 前缀判据适用=${applicable}`, prefixApplicable(table), applicable);
}
check('GHXA 前缀候选为空', prefixCandidates('GHXA').length, 0);

// ---- 6. 形态分类逐例
console.log('');
const shapeCases = [
  ['TC001', 'PURTC', 'standard'],
  ['MS001', 'ACTMS205', 'standard'],
  ['MA001', 'DSCINTMA', 'standard'],
  ['GHXA001', 'GHXA', 'table-full'],
  ['TAI01', 'ACRTA', 'table-prefix'],
  ['ID', 'GHXA', 'alpha-only'],
  ['ISShowST', 'RPTGRIDFMT', 'alpha-only'],
  ['EF001', 'EFJOBQUE', 'std-prefix-mismatch'],
  ['币种', 'YFMXB', 'chinese'],
  ['DXL001', 'DXL', 'len-anomaly'],
  ['01', 'PURTG2', 'numeric-degenerate'],
  ['UDF01', 'PURTC', 'udf'],
  ['creator', 'PURTC', 'gateway-injected'],
];
for (const [col, table, expected] of shapeCases) {
  check(`classify(${col} @ ${table}) = ${expected}`, classifyColumn(col, table), expected);
}

// ---- 7. 不存在的表应给出可理解报错
console.log('');
let errMsg = '';
try {
  dict.listFields('NOSUCHTABLE');
} catch (e) {
  errMsg = e.message;
}
check('不存在的表给出可理解提示', errMsg.includes('字段名 ≠ 表名'), true);

// ---- 8. listFields 能查到全部 7 种形态的字段（不能只按 XXnnn 解析）
console.log('');
const GHXA = dict.listFields('GHXA', { includeExcluded: true });
check(
  'GHXA 覆盖 table-full + alpha-only + udf 三种形态',
  [...new Set(GHXA.map((f) => f.shape))].sort(),
  ['alpha-only', 'table-full', 'udf'],
);
const PURTC = dict.listFields('PURTC');
check('PURTC 全部为 standard', [...new Set(PURTC.map((f) => f.shape))], ['standard']);

console.log('');
console.log('='.repeat(70));
console.log(`${pass}/${pass + fails.length} 通过`);
if (fails.length > 0) {
  console.log(`RESULT: FAIL（${fails.length} 项）`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('RESULT: PASS');