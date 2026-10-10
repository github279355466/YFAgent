#!/usr/bin/env node
/**
 * gen-domain-map.mjs — 从 typekey_map.yaml 生成业务域归属草案
 *
 * 用途：T-06（业务域菜单树）的**中间产物** —— 先用可机械判定的部分占位，
 *      把「需人工/实施确认」的部分显式标出来，避免闭门造车。
 *
 * 输入：knowledge/typekey/typekey_map.yaml
 * 输出：knowledge/official/menus/domain-map-draft.{md,csv}
 *      + _report.json（标注哪些是推断、哪些待确认）
 *
 * 域归属判定优先级（高→低）：
 *   1. type_key 首段显式映射（如 purchase → 采购）= **高置信**
 *   2. 关键字匹配（如 *.voucher → 财务）= **中置信**
 *   3. 无法判定 → **待人工确认**（显式列出，不猜）
 *
 * 用法：
 *   node scripts/gen-domain-map.mjs
 *   node scripts/gen-domain-map.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'knowledge', 'typekey', 'typekey_map.yaml');
const OUT_DIR = path.join(ROOT, 'knowledge', 'official', 'menus');
const CHECK_ONLY = process.argv.includes('--check');

/**
 * 业务域定义。
 * `byPrefix` 高置信（首段精确匹配）；`byKeyword` 中置信（子串匹配，需人工复核）
 */
const DOMAINS = [
  {
    code: 'purchase', name: '采购管理',
    byPrefix: ['purchase', 'inquiry', 'approve'],
    byKeyword: ['purchase', 'inquiry', 'supplier'],
    note: '采购单/请购单/核价单/询价单/进货单/到货单/验收/采购发票',
  },
  {
    code: 'outsourcing', name: '委外管理',
    byPrefix: ['outsourcing'],
    byKeyword: ['outsourcing'],
    note: '委外进货/退货/价格/核价/到货/验收',
  },
  {
    code: 'sales', name: '销售管理',
    byPrefix: ['sales', 'shipping', 'quotation'],
    byKeyword: ['sales', 'shipping', 'quotation', 'forecast', 'customer'],
    note: '报价/预测/订单/订单变更/出货/销货/销退/发票/客户品号',
  },
  {
    code: 'inventory', name: '存货管理',
    byPrefix: ['inventory', 'transfer', 'scrap', 'destroy', 'borrow', 'picking'],
    byKeyword: ['inventory', 'transfer', 'scrap', 'destroy', 'borrow', 'picking', 'lot'],
    note: '库存交易/调拨/报废/销毁/借出/拣货/批号',
  },
  {
    code: 'production', name: '生产管理',
    byPrefix: ['wo', 'work', 'op'],
    byKeyword: ['wo', 'work', 'report', 'operation', 'stockin'],
    note: '工单/工单变更/拆分/投产/领料/报工/入库',
  },
  {
    code: 'engineering', name: '产品结构与工艺',
    byPrefix: ['bom', 'ebom', 'ecn', 'product', 'replace', 'engineering'],
    byKeyword: ['bom', 'ecn', 'product', 'replace', 'engineering', 'routing'],
    note: 'BOM/EBOM/ECN/工艺路线/工程品号/取替代料',
  },
  {
    code: 'quality', name: '质量管理',
    byPrefix: ['quality', 'inspection', 'sampling', 'computation', 'bad'],
    byKeyword: ['quality', 'inspection', 'sampling', 'computation', 'bad'],
    note: '品管类别/检验项目/抽查基础/不良原因/各类检验单',
  },
  {
    code: 'base', name: '基础资料',
    byPrefix: [
      'plant', 'warehouse', 'department', 'employee', 'team', 'currency', 'unit',
      'customer', 'supplier', 'item', 'project', 'calendar', 'company', 'document',
      'function', 'receive', 'category', 'monthly', 'financial', 'workstation',
    ],
    byKeyword: ['plant', 'warehouse', 'department', 'employee', 'currency', 'unit', 'project', 'workstation'],
    note: '工厂/仓库/部门/员工/币种/单位/客户/供应商/品号/项目/假日/公司/金融机构/工作中心',
  },
  {
    code: 'finance', name: '会计总账',
    byPrefix: ['accounting', 'account', 'expense'],
    byKeyword: ['accounting', 'account', 'voucher', 'financial', 'expense'],
    note: '会计凭证/会计科目/费用发票',
  },
  {
    code: 'ar', name: '应收管理',
    byPrefix: ['ar', 'precollection', 'collection', 'other'],
    byKeyword: ['receivable', 'precollection', 'collection', 'refund', 'sale'],
    note: '应收退款/预收款/收款单/其他应收/销售发票',
  },
  {
    code: 'ap', name: '应付管理',
    byPrefix: ['ap', 'payable', 'prepayment'],
    byKeyword: ['payable', 'prepayment', 'payment', 'expense'],
    note: '应付退款/付款单/预付款/其他应付/费用发票',
  },
];

/** 极简 YAML 解析：只取 type_key / title / operations（避免引入 yaml 依赖） */
/**
 * 读取一个 YAML 键的值，**同时兼容流式与块状两种写法**。
 *
 *   流式：  operations: [query, read]
 *   块状：  operations:
 *             - query
 *             - read
 *
 * 之所以要兼容两种：上游 typekey_map.yaml 是**机械产物**，其排版风格随
 * extract-typekey-map.mjs 的版本而变（历史上切换过）。解析器若只认其中一种，
 * 一旦上游换风格就会静默解析出 0 个对象 —— 门禁会以「产物已过期」的形式误报，
 * 而真实原因是「解析器读不懂」。故此处按语义取值，不绑定排版。
 *
 * @param {string} block 单个 type_key 块（不含前导的 `- type_key:` 行）
 * @param {string} key   键名，如 operations / primary_key
 * @returns {string[]} 值列表；键不存在时返回 []
 */
export function readYamlList(block, key) {
  // 流式：[a, b, c]
  const flow = block.match(new RegExp(`^\\s*${key}:\\s*\\[([\\s\\S]*?)\\]\\s*$`, 'm'));
  if (flow) {
    return flow[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  // 块状：键独占一行，后续若干行以 `- ` 开头（缩进需深于键本身）
  const blockRe = new RegExp(`^(\\s*)${key}:\\s*$`, 'm');
  const m = blockRe.exec(block);
  if (!m) return [];
  const indent = m[1].length;
  const rest = block.slice(m.index + m[0].length).split('\n').slice(1);
  const items = [];
  for (const line of rest) {
    const item = line.match(/^(\s*)-\s+(.*)$/);
    if (!item) {
      if (line.trim() === '') continue;
      break;
    }
    if (item[1].length <= indent) break;
    items.push(item[2].trim());
  }
  return items;
}

/**
 * 读取 YAML 标量键（如 title）。
 * @param {string} block 单个 type_key 块
 * @param {string} key
 * @returns {string|null}
 */
export function readYamlScalar(block, key) {
  const m = block.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

export function parseTypekeyMap(text) {
  const out = [];
  // 容忍任意缩进：入库产物可能是顶格（`- type_key: x`）或 2 空格缩进（`  - type_key: x`）
  const blocks = text.split(/^\s*- type_key:\s*/m).slice(1);
  for (const b of blocks) {
    const tk = b.split('\n')[0].trim().replace(/^["']|["']$/g, '');
    if (!tk) continue;
    const title = readYamlScalar(b, 'title') ?? tk;
    const operations = readYamlList(b, 'operations');
    const primaryKey = readYamlList(b, 'primary_key');
    const detail = [...b.matchAll(/^\s*detail: \{ node: (\S+?), fields: (\d+) \}$/gm)].map(
      (m) => ({ node: m[1], fields: Number(m[2]) }),
    );
    out.push({
      type_key: tk,
      title,
      operations,
      primary_key: primaryKey.join(', '),
      detail_tables: detail,
    });
  }
  return out;
}
/** 判定业务域：返回 { code, name, confidence, reason } */
export function classify(tk) {
  const first = tk.split('.')[0];
  // 1) 首段精确匹配（高置信）
  for (const d of DOMAINS) {
    if (d.byPrefix.includes(first)) {
      return { code: d.code, name: d.name, confidence: 'high', reason: `首段 \`${first}\` 精确匹配` };
    }
  }
  // 2) 子串匹配（中置信，需人工复核）
  for (const d of DOMAINS) {
    const hit = d.byKeyword.find((k) => tk.includes(k));
    if (hit) {
      return { code: d.code, name: d.name, confidence: 'medium', reason: `子串 \`${hit}\` 匹配` };
    }
  }
  // 3) 无法判定 —— 显式标待确认，不猜
  return { code: 'UNASSIGNED', name: '待人工确认', confidence: 'none', reason: '无规则命中，需实施顾问确认' };
}

export function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[FATAL] 源文件不存在：${path.relative(ROOT, SRC)}`);
    console.error('请先运行：node scripts/extract-typekey-map.mjs');
    process.exit(1);
  }

  console.log('[1/4] 读取 typekey_map.yaml …');
  const text = fs.readFileSync(SRC, 'utf-8');
  const items = parseTypekeyMap(text);
  console.log(`      解析 ${items.length} 个业务对象`);

  console.log('[2/4] 判定业务域归属 …');
  const rows = items.map((it) => ({ ...it, ...classify(it.type_key) }));
  const byDomain = new Map();
  for (const r of rows) {
    if (!byDomain.has(r.code)) byDomain.set(r.code, []);
    byDomain.get(r.code).push(r);
  }
  const dist = {};
  for (const [code, list] of byDomain) dist[code] = list.length;
  console.log('      域分布:', dist);

  const needConfirm = rows.filter((r) => r.confidence === 'none');
  const medium = rows.filter((r) => r.confidence === 'medium');
  console.log(`      高置信 ${rows.length - needConfirm.length - medium.length} / 中置信 ${medium.length} / 待确认 ${needConfirm.length}`);

  console.log('[3/4] 生成草案 …');
  const L = [];
  const push = (s = '') => L.push(s);

  push('# 易飞业务域归属草案（T-06 中间产物）');
  push('');
  push('>由 `scripts/gen-domain-map.mjs` 从 `knowledge/typekey/typekey_map.yaml` 机械生成。');
  push('> **本文件是草案，不是最终结论。**');
  push('>');
  push('> 高置信 = type_key 首段精确匹配，可直接采用；');
  push('> 中置信 = 子串匹配，**需实施顾问复核**；');
  push('> 待确认 = 无规则命中，**必须人工判定，不得默认归入某域**。');
  push('');
  push('>正式版需补充：**系统菜单树**（Apipost 目录 ≠ 系统菜单）、各域中文业务名、业务术语。');
  push('> 交付目标见 `docs/plans/yf-materials-tasks.md` 任务 T-06。');
  push('');

  push('## 一、域分布统计');
  push('');
  push('| 域编码 | 域名称 | 对象数 | 置信度 |');
  push('|---|---|---|---|');
  for (const d of DOMAINS) {
    const list = byDomain.get(d.code) ?? [];
    if (!list.length) continue;
    const conf = list.every((r) => r.confidence === 'high')
      ? '高'
      : list.some((r) => r.confidence === 'none')
        ? '含待确认'
        : '中';
    push(`| \`${d.code}\` | ${d.name} | ${list.length} | ${conf} |`);
  }
  if (needConfirm.length) {
    push(`| \`UNASSIGNED\` | ⚠️ 待人工确认 | ${needConfirm.length} | 无 |`);
  }
  push('');
  push('**域说明**：');
  push('');
  for (const d of DOMAINS) {
    const list = byDomain.get(d.code) ?? [];
    if (list.length) push(`- **${d.name}**（${list.length}）：${d.note}`);
  }
  push('');

  push('## 二、按域列出的业务对象');
  push('');
  for (const d of DOMAINS) {
    const list = byDomain.get(d.code) ?? [];
    if (!list.length) continue;
    push(`### ${d.name}（\`${d.code}\`，${list.length} 个）`);
    push('');
    push('| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |');
    push('|---|---|---|---|---|---|');
    for (const r of list.sort((a, b) => a.type_key.localeCompare(b.type_key))) {
      const conf =
        r.confidence === 'high' ? '高' : r.confidence === 'medium' ? '⚠️ 中' : '❓ 待确认';
      push(
        `| \`${r.type_key}\` | ${r.title} | ${r.operations.length} | ${r.primary_key ? '是' : '—'} | ${r.detail_tables.length} | ${conf} |`,
      );
    }
    push('');
  }

  if (needConfirm.length) {
    push('## 三、⚠️ 待人工确认的对象（禁止默认归域）');
    push('');
    push('| type_key | 中文名 | 操作数 | 建议确认人 |');
    push('|---|---|---|---|');
    for (const r of needConfirm) {
      push(`| \`${r.type_key}\` | ${r.title} | ${r.operations.length} | 实施顾问 |`);
    }
    push('');
  }

  if (medium.length) {
    push('## 四、⚠️ 中置信对象（建议复核域归属）');
    push('');
    push('| type_key | 现判域 | 判定依据 |');
    push('|---|---|---|');
    for (const r of medium) {
      push(`| \`${r.type_key}\` | ${r.name} | ${r.reason} |`);
    }
    push('');
  }

  push('## 五、下一步');
  push('');
  push('1. 实施顾问复核「待确认」与「中置信」两组，确认域归属');
  push('2. 补充**系统菜单树**（本草案只覆盖 TypeKey 视角，不含菜单层级）');
  push('3. 补充各域的中文业务名与业务术语（用于助手触发词设计）');
  push('4. 产出正式版 `menu-tree.md` + `menu-tree.csv`，替代本草案');
  push('');

  const md = L.join('\n');
  const csv = [
    'type_key,title,domain_code,domain_name,confidence,operations_count,composite_pk,detail_tables',
    ...rows.map((r) =>
      [
        r.type_key,
        `"${r.title}"`,
        r.code,
        `"${r.name}"`,
        r.confidence,
        r.operations.length,
        r.primary_key ? 'Y' : 'N',
        r.detail_tables.length,
      ].join(','),
    ),
  ].join('\n') + '\n';

  const report = {
    generated_at: new Date().toISOString(),
    source: 'knowledge/typekey/typekey_map.yaml',
    domain_definitions: DOMAINS.map((d) => ({ code: d.code, name: d.name, note: d.note })),
    distribution: dist,
    confidence: {
      high: rows.filter((r) => r.confidence === 'high').length,
      medium: medium.length,
      none: needConfirm.length,
    },
    need_confirm: needConfirm.map((r) => r.type_key),
    medium_confidence: medium.map((r) => ({ type_key: r.type_key, domain: r.name, reason: r.reason })),
  };
  const reportText = JSON.stringify(report, null, 2) + '\n';

  if (CHECK_ONLY) {
    console.log('[4/4] --check 模式：比对内容指纹…');
    const f = path.join(OUT_DIR, 'domain-map-draft.md');
    if (!fs.existsSync(f)) {
      console.error('[FAIL] domain-map-draft.md 不存在，请先运行生成');
      process.exit(2);
    }
    const strip = (t) => t.split('\n').filter((l) => !/^\s*#?\s*generated_at:/.test(l)).join('\n').replace(/\r/g, '');
    if (strip(fs.readFileSync(f, 'utf-8')) !== strip(md)) {
      console.error('[FAIL] domain-map-draft.md 已过期：typekey_map 或域规则已变更');
      console.error('       修复：node scripts/gen-domain-map.mjs');
      process.exit(2);
    }
    console.log('[4/4] PASS：产物为最新');
    return;
  }

  console.log('[4/4] 写出产物…');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // 统一 CRLF（项目规范： UTF-8 无 BOM + CRLF，不混用行尾）
  const CRLF = (t) => String(t).split(/\r\n|\r|\n/).join('\r\n');
  fs.writeFileSync(path.join(OUT_DIR, 'domain-map-draft.md'), CRLF(md), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'domain-map-draft.csv'), CRLF(csv), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, '_domain-report.json'), CRLF(reportText), 'utf-8');
  console.log(`      ${path.relative(ROOT, OUT_DIR)}/domain-map-draft.md`);
  console.log(`      ${path.relative(ROOT, OUT_DIR)}/domain-map-draft.csv`);
  console.log(`      ${path.relative(ROOT, OUT_DIR)}/_domain-report.json`);
  if (needConfirm.length) {
    console.log('');
    console.log(`提醒：${needConfirm.length} 个对象待人工确认域归属，见草案第三节。`);
  }
}

// 仅在作为脚本直接执行时运行 main；
// 被 __tests__ 以 import 方式加载时只暴露纯函数，不产生副作用。
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}