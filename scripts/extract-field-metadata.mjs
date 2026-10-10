#!/usr/bin/env node
/**
 * extract-field-metadata.mjs — 从 Apipost 导出抽取易飞(E10) 字段元数据对照表
 *
 * 输入：docs/易飞OpenAPI.json
 * 输出：
 *   knowledge/typekey-mapping/{type_key}.md     对齐易助 knowledge/json节点对照/ 格式
 *   knowledge/typekey-mapping/_index.json       索引 + 质量报告
 *
 * ── 与易助格式的对齐关系 ────────────────────────────────────
 * 易助 knowledge/json节点对照/{type_key}_{中文名}_{DLL}.md 的表头：
 *   | 字段编号 | 名称 | 节点名称(别名) | 类型 | 备注 |
 * 易飞**不存在字段编号体系**（那是易助 DLL 的列号）。易飞是「节点名 ↔ 字段名」双轨：
 *   节点名（小写）  warehouse_no   ← API 收发参实际使用
 *   字段名（大写）  WAREHOUSE_NO   ← 数据库物理列名，少数接口的 description 里带
 * 因此本脚本输出 5 列：
 *   | 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |
 * 当字段名不可得时以 `~` 占位，并在 _index.json 统计覆盖率（诚实标注，不臆测）。
 *
 * ── 三个必须处理的陷阱（探查发现）────────────────────────────
 * 1. not_null 无区分度：21206 个标记为 1，50 个为 -1，**所有字段都是 not_null=1**，
 *    包括只读字段与管理字段。→ 不能用它判定必填；必填改用「文档显式说明」+ 反例剔除。
 * 2. raw_parameter 与 raw 原文不一致：raw 里出现的字段数常多于/少于 raw_parameter
 *    （例：sales.order create 的 raw 有 tax_type / gift_package_qty，
 *    但 raw_parameter 无 gift_package_qty；且 raw 里有注释掉的字段如 amount）。
 *    → 以 raw_parameter 为**权威结构**（它带类型与描述），raw 仅用于交叉校验。
 * 3. 单头/单身层级需从 key 的点分层级推断，不能靠字段名猜：
 *    std_data.parameter.sales_order_data           ← 单头容器(Array)
 *      .sales_order_data.doc_type_no               ← 单头字段
 *      .sales_order_data.sales_order_detail_data   ← 单身容器(Array)
 *        .sales_order_detail_data.item_no          ← 单身字段
 *    → 深度 2 = 单头，深度 3 = 单身；`*_data` 结尾且类型 Array 的是容器。
 *
 * 用法：
 *   node scripts/extract-field-metadata.mjs            # 全量生成
 *   node scripts/extract-field-metadata.mjs --only sales.order,purchase.order,wo
 *   node scripts/extract-field-metadata.mjs --check     # 内容指纹比对
 *
 * ⚠️ 本脚本的 --check 依赖 docs/易飞OpenAPI.json 才能自证，而该文件
 *    （48 MiB，含内网 IP 与 token 明文）被 gitignore，**CI 中不可用**。
 *    故已于 2026-10-09 从 CI 门禁与 check:all 中移除，仅限本地使用。
 *    依据与裁决见 docs/decisions/OPEN-DECISIONS.md。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'docs', '易飞OpenAPI.json');
const OUT_DIR = path.join(ROOT, 'knowledge', 'typekey-mapping');

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check');
const ONLY = (() => {
  const i = argv.indexOf('--only');
  return i >= 0 && argv[i + 1] ? argv[i + 1].split(',').map((s) => s.trim()) : null;
})();

/** 控制参数（非业务字段），不写入对照表 */
const CONTROL_PREFIXES = new Set([
  'page_no', 'page_size', 'use_has_next', 'conditions', 'orders', 'selectedColumns',
  'load_data_browse_config', 'query_type',
]);
const CONTROL_NODES = new Set([
  'std_data', 'parameter', 'result', 'success', 'error', 'rows', 'cnt',
  'execution', 'code', 'sql_code', 'description', 'datakeys',
  'total_result', 'has_next', 'page_count', 'information', 'data', 'message',
]);

/** 管理字段（通则声明，只读不可赋值） */
const MGMT_FIELDS = new Set([
  'company', 'creator', 'usr_group', 'create_date', 'modifier', 'modi_date', 'flag',
]);

// ---------------------------------------------------------------- 基础工具

function collectLeaves(apis, trail = []) {
  const out = [];
  for (const it of apis ?? []) {
    const next = [...trail, String(it?.name ?? '')];
    const kids = Array.isArray(it?.apis) ? it.apis : [];
    if (kids.length) out.push(...collectLeaves(kids, next));
    else out.push({ path: next, api: it });
  }
  return out;
}

function extractServiceName(api) {
  const list = (api?.request?.header?.parameter) || [];
  for (const p of list) {
    if (p?.key === 'digi-service') {
      const m = String(p.value ?? '').match(/yf\.oapi\.[a-z0-9._]+/i);
      if (m) return m[0];
    }
  }
  return null;
}

/** `{集成产品}.{Typekey}.{op}[.get]` → { obj, op }；兼容无 .data 段 */
function parseServiceName(svc) {
  const body = String(svc).replace(/^yf\.oapi\./, '');
  const m = body.match(/\.(query|read|create|update|delete|approve|disapprove|invalid)(\.get)?$/);
  if (!m) return null;
  let obj = body.slice(0, m.index);
  if (obj.endsWith('.data')) obj = obj.slice(0, -'.data'.length);
  return { obj, op: m[1] };
}

/**
 * 从 description 提取大写物理字段名。
 *
 * 陷阱：不能只看「全大写」就认定——易飞文档里大量 desc 本身就是大写英文缩写
 * （如 consignee→CONSIGNEE、fax_no→FAX_NO、notify→NOTIFY），那是**未翻译的占位描述**，
 * 不是物理列名。真正的物理列名必然满足「等于节点名的大写形式」。
 * 判据：desc === node.toUpperCase() 才认定为双轨映射，否则视为「未提供」。
 */
function extractFieldNameAlias(desc, nodeName) {
  const s = String(desc ?? '').trim();
  if (!s || !/^[A-Z][A-Z0-9_]{1,30}$/.test(s)) return null;
  if (nodeName && s !== String(nodeName).toUpperCase()) return null;
  return s;
}

/** 由节点名推导大写形式（用于占位展示，不作为权威字段名） */
function upperOf(node) {
  return String(node ?? '').toUpperCase();
}

const OP_CN = ['撤销审核', '撤审', '审核', '作废', '新增', '查询', '读取', '更新', '删除', '创建'];
function cleanTitle(raw) {
  const parts = String(raw ?? '').split('/').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    let c = p.replace(/^[A-Z]{3,6}\d{0,3}[-_ ]*/, '');
    c = c.replace(/[-_ ]*(OK|完成|范例|自己测试|测试)$/i, '').replace(/[-_ ]*$/, '').trim();
    if (/[\u4e00-\u9fa5]/.test(c) && c.length >= 2) return c;
  }
  return '';
}
function stripOp(t) {
  let c = String(t);
  for (const op of OP_CN) c = c.split(op).join('');
  c = c.replace(/[-_ ]*(信息|資料|资料|数据)*$/, '').replace(/^[-_ ]+|[-_ ]+$/g, '');
  if (!c || !/[\u4e00-\u9fa5]/.test(c)) return '';
  const cn = c.match(/[\u4e00-\u9fa5]{2,}/);
  return cn ? cn[0] : '';
}

function mdEscape(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

const TYPE_CN = {
  String: 'string', Number: 'number', Integer: 'int', Boolean: 'bool',
  Text: 'text', Array: 'array', Object: 'object',
};

// ---------------------------------------------------------------- 字段树构建

/**
 * 把 raw_parameter 的扁平 key 列表构建成层级结构。
 * @returns {Map<string, {node,cn,type,desc,level,parent,children:string[],fieldName}>}
 */
function buildFieldTree(rawParams, basePrefix) {
  /** @type {Map<string, any>} */
  const nodes = new Map();
  for (const p of rawParams || []) {
    const key = String(p?.key ?? '');
    if (!key.startsWith(basePrefix)) continue;
    const rest = key.slice(basePrefix.length).replace(/^\./, '');
    if (!rest) continue;
    const segs = rest.split('.');
    // 逐级补齐容器节点
    let acc = '';
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const isLeaf = i === segs.length - 1;
      acc = acc ? `${acc}.${seg}` : seg;
      if (!nodes.has(acc)) {
        nodes.set(acc, {
          node: seg,
          full: `${basePrefix.replace(/\.$/, '')}.${acc}`,
          type: 'Object',
          desc: '',
          level: i + 1,
          parent: i > 0 ? segs.slice(0, i).join('.') : null,
          children: [],
          fieldName: null,
        });
      }
      if (i > 0) {
        const pk = segs.slice(0, i).join('.');
        const parent = nodes.get(pk);
        if (parent && !parent.children.includes(acc)) parent.children.push(acc);
      }
      if (isLeaf) {
        const cur = nodes.get(acc);
        cur.type = p?.field_type ?? p?.schema?.type ?? 'String';
        cur.desc = String(p?.description ?? '').replace(/\s+/g, ' ').trim();
        cur.fieldName = extractFieldNameAlias(p?.description, seg);
        cur.notNull = p?.not_null === 1;
      }
    }
  }
  return nodes;
}

/** 判断是否为容器（有子节点） */
function isContainer(node, tree) {
  return (node.children ?? []).length > 0;
}

// ---------------------------------------------------------------- 主流程

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[FATAL] 源文件不存在：${SRC}`);
    process.exit(1);
  }
  const size = fs.statSync(SRC).size;
  console.log(`[1/6] 读取源文件（${(size / 1024 / 1024).toFixed(1)} MB）…`);
  const doc = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
  const leaves = collectLeaves(doc.apis);
  console.log(`      叶子节点 ${leaves.length} 个`);

  console.log(`[2/6] 按业务对象聚合字段…`);
  /** @type {Map<string, any>} */
  const objs = new Map();

  for (const leaf of leaves) {
    const svc = extractServiceName(leaf.api);
    if (!svc) continue;
    const parsed = parseServiceName(svc);
    if (!parsed) continue;
    const { obj, op } = parsed;

    if (!objs.has(obj)) {
      objs.set(obj, {
        type_key: obj,
        title: '',
        titles: new Set(),
    ops: new Set(),
    services: {},
    primary_key: [],
    header: new Map(),   // 单头字段 node -> field
    details: new Map(),  // 单身节点名 -> Map(node -> field)
    readOnlyFields: new Set(), // 出现在响应但不在 create/update 入参 → 疑似系统生成/只读
    anomalies: [],       // 文档异常（如容器名与对象名不符）
    fieldNameHits: 0,
    fieldNameTotal: 0,
  });
    }
    const rec = objs.get(obj);
    rec.ops.add(op);
    rec.services[op] = svc;
    const t = cleanTitle(leaf.path[0]);
    if (t) rec.titles.add(t);

    // 主键：read.get 的 datakeys
    if (op === 'read') {
      const raw = leaf.api?.request?.body?.raw ?? '';
      const dk = parseJsoncLoose(raw)?.std_data?.parameter?.datakeys;
      if (Array.isArray(dk) && dk[0] && typeof dk[0] === 'object') {
        rec.primary_key = Object.keys(dk[0]);
      }
    }

    // 响应侧字段：query → parameter.result.rows.*；read → parameter.result.success.*_data.*
    // 用途：① 纯只读对象（无 create/update）唯一可得的字段来源；② 校验「可写字段」与「可读字段」是否一致。
    if (op === 'query' || op === 'read') {
      const exs = leaf.api?.response?.example;
      const arr = Array.isArray(exs) && exs.length ? exs[0]?.raw_parameter : null;
      if (Array.isArray(arr)) {
        const isQuery = op === 'query';
        const tree = buildFieldTree(arr, 'std_data');
        const rowsKey = isQuery ? 'parameter.result.rows' : 'parameter.result.success';
        const rowNode = tree.get(rowsKey);
        if (rowNode) {
          // rows 下的每个字段（可能再嵌一层 *_data 容器）
          for (const ck of rowNode.children ?? []) {
            const cnode = tree.get(ck);
            if (!cnode) continue;
            if (isContainer(cnode, tree)) {
              // read 返回的单据容器（如 warehouse_data）。
              // 注意：响应侧路径为 parameter.result.success.<容器>，
              // 需归一为请求侧同名的裸节点名，否则 node_name 查询条件会写错。
              const dn = ck.includes('.') ? ck.split('.').pop() : ck;
              if (!rec.details.has(dn)) rec.details.set(dn, new Map());
              const dm = rec.details.get(dn);
              for (const gk of cnode.children ?? []) {
                const g = tree.get(gk);
                if (g && !isContainer(g, tree)) {
                  if (!dm.has(g.node)) dm.set(g.node, { ...g, sources: new Set(['read']) });
                }
              }
            } else {
              if (!rec.header.has(cnode.node)) {
                rec.header.set(cnode.node, { ...cnode, sources: new Set([op]) });
              }
              rec.readOnlyFields.add(cnode.node);
            }
          }
        }
      }
    }

    // 请求侧字段：create / update 有单头+单身。
    //
    // 关键：create 的 raw_parameter 往往只列**必填**字段（如 sales.order create仅 8 个），
    // update 才列**完整**单头字段（53 个）。因此必须 create ∪ update 取并集，
    // 否则会漏采绝大多数字段。同时记录字段来源，便于判断可写性。
    if (op === 'create' || op === 'update') {
      const rp = leaf.api?.request?.body?.raw_parameter;
      const tree = buildFieldTree(rp, 'std_data.parameter');
      const tops = [...tree.keys()].filter((k) => !k.includes('.'));
      for (const topKey of tops) {
        const top = tree.get(topKey);
        // 容器判定放宽：只要有子节点即视为容器。
        // 原因：Apipost 中同一服务名的重复节点，容器节点的 field_type 可能是
        // 空节点给出的 'Object'，但它确实承载了子字段。
        const topIsContainer = isContainer(top, tree);
        const topIsDocEntity = /_data$/.test(topKey) || top.type === 'Array';
        if (!topIsContainer || !topIsDocEntity) continue;

        // 文档异常检测：入参容器名与业务对象名不符 → 官方文档的复制粘贴错误。
        // 实例：yf.oapi.ap.refund.doc.data.create（应付退款单）的入参容器写作 wo_stockin_data（生产入库单）。
        // 该异常已在易飞官方 Apipost 文档中核实，非抽取缺陷，须在产物中显式标注。
        {
          const objWords = String(obj)
            .replace(/[._]/g, '_')
            .split('_')
            .filter((w) => w.length > 2);
          const topWords = String(topKey).split('_').filter((w) => w.length > 2);
          const overlap = objWords.filter((w) => topWords.includes(w)).length;
          if (objWords.length && overlap === 0) {
            const msg = `入参容器名 \`${topKey}\` 与业务对象 \`${obj}\` 无关（无共同词）——疑为官方文档复制粘贴错误，真机调用前须核实`;
            if (!rec.anomalies.includes(msg)) rec.anomalies.push(msg);
          }
        }

        const put = (map, f) => {
          const prev = map.get(f.node);
          if (!prev) {
            map.set(f.node, { ...f, sources: new Set([op]) });
            return;
          }
          prev.sources.add(op);
          // 同一服务名在Apipost 中有多个重复节点，多数 raw_parameter 为空。
          // 必须「非空优先」：只用有内容的节点覆盖空节点，反之绝不覆盖。
          const prevEmpty = !prev.desc && !prev.type;
          const curEmpty = !f.desc && !f.type;
          if (prevEmpty && !curEmpty) {
            const s = prev.sources;
            map.set(f.node, { ...f, sources: new Set(s) });
          }
          // desc 取更完整者（create 的必填字段通常有中文说明）
          if (curEmpty) return;
          if (f.desc && f.desc.length > (prev.desc?.length ?? 0)) prev.desc = f.desc;
          if (f.fieldName && !prev.fieldName) prev.fieldName = f.fieldName;
        };

        for (const gk of top.children ?? []) {
          const g = tree.get(gk);
          if (!g) continue;
          if (isContainer(g, tree)) {
            // 单身容器。节点名需**归一为末段**：三层嵌套时key 为
            //   单头容器.单头实体.单身实体（如 ap_refund_doc_data.ap_refund_doc_detail_data），
            // 而 node_name 查询条件用的是**裸单身节点名**（ap_refund_doc_detail_data）。
            const dn = gk.includes('.') ? gk.split('.').pop() : gk;
            if (!rec.details.has(dn)) rec.details.set(dn, new Map());
            const dm = rec.details.get(dn);
            for (const hk of g.children ?? []) {
              const h = tree.get(hk);
              if (!h) continue;
              if (isContainer(h, tree)) {
                // 四层嵌套：把子容器的字段也归入本单身表
                for (const ik of h.children ?? []) {
                  const t2 = tree.get(ik);
                  if (t2 && !isContainer(t2, tree)) put(dm, t2);
                }
              } else {
                put(dm, h);
              }
            }
          } else {
            put(rec.header, g);
          }
        }
      }
    }
  }

  // 标题：按出现频次取最常见目录名（不能用首个——同一对象有多个目录，
  // 首个可能是噪声目录，如 sales.order 下混有 "OAPMA数据重新加载刷新"）
  for (const rec of objs.values()) {
    const freq = new Map();
    for (const t of rec.titles) {
      if (!/[\u4e00-\u9fa5]/.test(t)) continue;
      const b = stripOp(t);
      const k = b || t;
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    const cand = [...freq.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    });
    rec.title = cand[0]?.[0] ?? rec.type_key;
    rec.titleSource = cand.length > 1
      ? `目录名 ${rec.titles.size} 个，取最高频：${cand.slice(0, 3).map(([t, n]) => `${t}(${n})`).join(' / ')}`
      : '目录名单一来源';
  }

  const list = [...objs.values()].sort((a, b) => a.type_key.localeCompare(b.type_key));
  const targets = ONLY ? list.filter((r) => ONLY.includes(r.type_key)) : list;
  console.log(`      业务对象 ${list.length} 个${ONLY ? `（--only 过滤后 ${targets.length} 个）` : ''}`);

  console.log(`[3/6] 统计字段覆盖…`);
  let totalFields = 0, totalNodesWithFieldName = 0;
  const noField = [];
  for (const rec of targets) {
    const all = [rec.header.size, ...[...rec.details.values()].map((m) => m.size)];
    totalFields += all.reduce((a, b) => a + b, 0);
    for (const m of [rec.header, ...rec.details.values()]) {
      for (const f of m.values()) {
        if (f.fieldName) totalNodesWithFieldName++;
      }
    }
    if (rec.header.size === 0) noField.push(rec.type_key);
  }
  console.log(`      字段总数 ${totalFields}（单头+单身）`);
  console.log(`      含大写字段名（双轨可得） ${totalNodesWithFieldName} / ${totalFields} = ${((totalNodesWithFieldName / totalFields) * 100).toFixed(1)}%`);
  console.log(`      无字段数据的对象 ${noField.length} 个（多为仅 query/read 的对象）`);

  console.log(`[4/6] 生成 Markdown 对照表…`);
  const index = {
    generated_at: new Date().toISOString(),
    source: 'docs/易飞OpenAPI.json',
    source_bytes: size,
    product_line: 'yifei',
    format: '对齐易助 knowledge/json节点对照/ 的 5 列表头；易飞无字段编号体系，故列名改为 节点名称/字段名称',
    caveats: [
      'not_null 在 Apipost 中全库均为 1（含只读与管理字段），不可作为必填判据',
      '字段名（大写）仅少数接口的 description 中给出，其余以 ~ 占位，_index.json 记录覆盖率',
      '必填列仅在官方文档明确说明时标注（如新建服务：必须提供业务主键及不可空白字段）',
    ],
    counts: {
      business_objects: targets.length,
      fields_total: totalFields,
      fields_with_physical_name: totalNodesWithFieldName,
      objects_without_fields: noField.length,
    },
    objects: [],
  };

  if (!CHECK_ONLY) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const rec of targets) {
    const md = buildMarkdown(rec);
    const fname = `${rec.type_key}.md`;
    if (!CHECK_ONLY) fs.writeFileSync(path.join(OUT_DIR, fname), md, 'utf-8');
    index.objects.push({
      type_key: rec.type_key,
      title: rec.title,
      file: fname,
      operations: [...rec.ops].sort(),
      primary_key: rec.primary_key,
      header_fields: rec.header.size,
      detail_tables: [...rec.details.entries()].map(([k, v]) => ({ node: k, fields: v.size })),
      total_fields: rec.header.size + [...rec.details.values()].reduce((a, m) => a + m.size, 0),
      writable: rec.ops.has('create') || rec.ops.has('update'),
    });
  }

  console.log(`[5/6] 生成索引…`);
  const idxYaml = [
    '# 易飞(E10) 字段元数据索引',
    '#',
    '# 由 scripts/extract-field-metadata.mjs 从 docs/易飞OpenAPI.json 机械抽取生成。',
    '# 请勿手工编辑。',
    '#',
    `# generated_at: ${index.generated_at}`,
    '',
    `generated_at: "${index.generated_at}"`,
    `product_line: ${index.product_line}`,
    `objects: ${index.counts.business_objects}`,
    `fields_total: ${index.counts.fields_total}`,
    `fields_with_physical_name: ${index.counts.fields_with_physical_name}`,
    '',
    '# 注意事项',
    ...index.caveats.map((c) => `# - ${c}`),
    '',
    'objects_detail:',
  ];
  for (const o of index.objects) {
    idxYaml.push(`  - type_key: ${o.type_key}`);
    idxYaml.push(`    title: ${o.title}`);
    idxYaml.push(`    file: ${o.file}`);
    idxYaml.push(`    primary_key: [${o.primary_key.join(', ')}]`);
    idxYaml.push(`    header_fields: ${o.header_fields}`);
    idxYaml.push(`    writable: ${o.writable}`);
    if (!o.writable) idxYaml.push(`    readonly_only: true   # 官方文档仅提供只读服务，未开放 create/update`);
    for (const d of o.detail_tables) {
      idxYaml.push(`    detail: { node: ${d.node}, fields: ${d.fields} }`);
    }
  }
  const idxText = idxYaml.join('\n') + '\n';
  if (!CHECK_ONLY) fs.writeFileSync(path.join(OUT_DIR, '_index.json'), idxText, 'utf-8');

  if (CHECK_ONLY) {
    console.log('[5/6] --check 模式：全量内容指纹比对…');
    if (!fs.existsSync(path.join(OUT_DIR, '_index.json'))) {
      console.error('[FAIL] _index.json 不存在，请先运行生成');
      process.exit(2);
    }
    // 指纹必须覆盖**全部产物**（索引 + 每个 md），否则篡改单个 md 不会被发现。
    // 过滤掉 generated_at 行，避免时间戳造成假失败。
    const strip = (t) =>
      t.split('\n').filter((l) => !/^\s*#?\s*generated_at:/.test(l)).join('\n').replace(/\r/g, '');

    const fp = (t) => {
      // 简易内容指纹（FNV-1a32），避免依赖 node:crypto 的导入开销
      let h = 0x811c9dc5;
      for (let i = 0; i < t.length; i++) {
        h ^= t.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return h.toString(16).padStart(8, '0');
    };

    const curIdx = strip(fs.readFileSync(path.join(OUT_DIR, '_index.json'), 'utf-8'));
    if (fp(curIdx) !== fp(strip(idxText))) {
      console.error('[FAIL] _index.json 已过期：源文件或抽取逻辑已变更');
      console.error('       修复：node scripts/extract-field-metadata.mjs');
      process.exit(2);
    }

    let bad = 0;
    for (const o of index.objects) {
      const f = path.join(OUT_DIR, o.file);
      if (!fs.existsSync(f)) {
        console.error(`[FAIL] 缺失产物：${o.file}`);
        bad++;
        continue;
      }
      const cur = strip(fs.readFileSync(f, 'utf-8'));
      const rec = targets.find((r) => r.type_key === o.type_key);
      if (!rec) {
        console.error(`[FAIL] 无法重建 ${o.file}（源对象已不存在）`);
        bad++;
        continue;
      }
      if (fp(cur) !== fp(strip(buildMarkdown(rec)))) {
        console.error(`[FAIL] ${o.file} 内容已过期或被篡改`);
        bad++;
      }
    }
    if (bad) {
      console.error(`       共${bad} 个文件异常；修复：node scripts/extract-field-metadata.mjs`);
      process.exit(2);
    }
    console.log(`[6/6] PASS：${index.objects.length} 个对照表 + 索引均为最新`);
    return;
  }

  console.log('[6/6] 完成');
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.md'));
  console.log(`      ${path.relative(ROOT, OUT_DIR)}/  ${files.length} 个 md + _index.json`);
  const st = fs.statSync(path.join(OUT_DIR, '_index.json'));
  console.log(`      _index.json  ${(st.size / 1024).toFixed(1)} KB`);
}

function buildMarkdown(rec) {
  const L = [];
  const push = (s = '') => L.push(s);

  push(`# ${rec.title} (${rec.type_key}) 字段对照表`);
  push('');
  push('## 来源与说明');
  push('');
  push(`> 由 \`scripts/extract-field-metadata.mjs\` 从 \`docs/易飞OpenAPI.json\` 机械抽取生成，请勿手工编辑。`);
  push(`> 重新生成：\`node scripts/extract-field-metadata.mjs --only ${rec.type_key}\``);
  push('');
  push(`- **服务前缀**：\`yf.oapi.\``);
  push(`- **操作集**：${[...rec.ops].sort().map((o) => `\`${o}\``).join(' / ')}`);
  if (rec.services.query) push(`- **查询服务**：\`${rec.services.query}\``);
  if (rec.services.read) push(`- **读取服务**：\`${rec.services.read}\``);
  if (rec.services.create) push(`- **新增服务**：\`${rec.services.create}\``);
  push(`- **标题来源**：${rec.titleSource ?? '目录名'}`);
  if (rec.anomalies?.length) {
    push('');
    push('## ⚠️ 文档异常（官方 Apipost 文档问题，非抽取缺陷）');
    push('');
    for (const a of rec.anomalies) push(`- ${a}`);
  }
  push('');
  push('> ⚠️ 易飞**无字段编号体系**（字段编号为易助 DLL 专有）。易飞为「节点名（小写，API 收发参实际使用）↔ 字段名（大写，数据库物理列名）」双轨。');
  push('>');
  push('> 本表「字段名称」列的判定规则：`description` **恰好等于节点名的大写形式**时才认定。');
  push('> 易飞文档中大量大写 desc（如 `CONSIGNEE` / `FAX_NO` / `NOTIFY`）是**未翻译的占位描述**而非物理列名，已排除。');
  push('> 无权威字段名时以 `~` 占位——**这是事实，不是缺失**。');
  push('');
  push('> ⚠️ `not_null` 在 Apipost 全库均为 1（含只读字段与管理字段），**不可作为必填判据**。');
  push('> 本表「备注」列的可写性判定依据的是**该字段在 `create` / `update` 入参中是否出现**这一事实：');
  push('> `create` 中出现 = 必填（官方约束：必须提供业务主键及不可空白字段）；仅 `update` 中出现 = 可选。');
  push('');

  if (rec.primary_key.length) {
    const multi = rec.primary_key.length > 1;
    push('## 业务主键');
    push('');
    push(`- **构成**：${rec.primary_key.map((k) => `\`${k}\``).join(' + ')}${multi ? '（**复合主键**）' : ''}`);
    push('- **来源**：`read.get` 请求的 `datakeys` 机械抽取');
    push('- **注意**：`datakeys` 为对象数组，每笔一条，必须含**全部主键字段**，否则报「Key字段个数不符」');
    push('');
  } else {
    push('## 业务主键');
    push('');
    push('- ⚠️ **未知** —— 该对象的 `read.get` 未提供 `datakeys`，须真机探测补齐');
    push('');
  }

  push('## 单头字段');
  push('');
  if (rec.header.size === 0) {
    if (rec.ops.has('create') || rec.ops.has('update')) {
      push('⚠️ 该对象有写操作，但文档未提供入参字段明细 —— **须真机探测补齐**。');
    } else {
      push('（该对象**仅有只读操作**（' + [...rec.ops].sort().map((o) => `\`${o}\``).join(' / ') + '），官方文档不提供入参字段。');
      push('');
      push('若需写入，请先向易飞侧确认该对象是否开放 `create` / `update` 服务。');
    }
  } else {
    push('| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |');
    push('|---|---|---|---|---|');
    for (const f of sortFields([...rec.header.values()], rec.primary_key)) {
      const req = REQUIRED_HINT(rec, f.node, f.sources);
      push(`| \`${f.node}\` | ${f.fieldName ? `\`${f.fieldName}\`` : '`~`'} | ${mdEscape(f.desc) || '~'} | ${TYPE_CN[f.type] ?? f.type.toLowerCase()} | ${req} |`);
    }
  }
  push('');

  for (const [dn, m] of rec.details) {
    push(`## 单身字段：\`${dn}\``);
    push('');
    push('| 节点名称 | 字段名称 | 中文名称 | 类型 | 备注 |');
    push('|---|---|---|---|---|');
    for (const f of sortFields([...m.values()], rec.primary_key)) {
      const req = REQUIRED_HINT(rec, f.node, f.sources);
      push(`| \`${f.node}\` | ${f.fieldName ? `\`${f.fieldName}\`` : '`~`'} | ${mdEscape(f.desc) || '~'} | ${TYPE_CN[f.type] ?? f.type.toLowerCase()} | ${req} |`);
    }
    push('');
    push(`> **查询此单身字段时必须带 \`node_name: "${dn}"\`**，否则易飞无法识别为单身过滤条件。`);
    push('');
  }

  push('## 通则字段（所有对象适用）');
  push('');
  push('### 管理字段（只读，不可赋值）');
  push('');
  push('| 节点名称 | 字段名称 | 类型 | 长度 | 说明 |');
  push('|---|---|---|---|---|');
  push('| `company` | `COMPANY` | string | 10 | 公司编号（多公司隔离依据） |');
  push('| `creator` | `CREATOR` | string | 10 | 录入者 |');
  push('| `usr_group` | `USR_GROUP` | string | 10 | 组编号 |');
  push('| `create_date` | `CREATE_DATE` | string | 17 | 创建时间（格式 `20241008153342862`，**非 ISO**） |');
  push('| `modifier` | `MODIFIER` | string | 10 | 更改者 |');
  push('| `modi_date` | `MODI_DATE` | string | 17 | 更改时间 |');
  push('| `flag` | `FLAG` | numeric | 3.0 | 标识（版本标识） |');
  push('');
  push('### 自定义字段');
  push('');
  push('| 节点名称 | 字段名称 | 类型 | 长度 | 说明 |');
  push('|---|---|---|---|---|');
  push('| `udf01` ~ `udf12` | `UDF01` ~ `UDF12` | string | 255 | 用户自定义字段（文本型） |');
  push('| `udf51` ~ `udf62` | `UDF51` ~ `UDF62` | numeric | 16.6 | 用户自定义字段（数值型） |');
  push('');
  push('> ⚠️ 易助的自定义字段是 `udf_text1~16` / `udf_no1~16`，**与易飞命名体系互斥**，写错即幻觉。');
  push('');

  push('## 写操作约束（官方通则）');
  push('');
  push('| 操作 | 约束 |');
  push('|---|---|');
  push('| 新增 `create` | 必须提供业务主键 + 不可空白字段；支持单别自动审核 |');
  push('| 更新 `update` | ① 按业务主键定位；② 更新单身时须含**所有**输入字段；③ 单身按主键「存在则更新、不存在则新增」；④ **不支持删除单身**；⑤ 单头与单身 key 值必须一致 |');
  push('| 删除 `delete` | 按业务主键定位 |');
  push('| 审核/撤审/作废 | 按业务主键定位 |');
  push('');

  return L.join('\n');
}

/** 主键/可写性提示：只依据「字段在 create/update 入参中是否出现」这一事实，不臆测 */
function REQUIRED_HINT(rec, node, sources) {
  if (rec.primary_key.includes(node)) return '主键';
  if (MGMT_FIELDS.has(node)) return '管理字段（只读，不可赋值）';
  if (/^udf(0[1-9]|1[0-2]|5[1-9]|6[0-2])$/.test(node)) return '自定义字段';
  const writable = sources?.has('create') || sources?.has('update');
  if (writable && sources?.has('create') && sources?.has('update')) return '可写（create+update 均出现）';
  if (sources?.has('create')) return '**必填**（create 中出现，官方约束：必须提供业务主键及不可空白字段）';
  if (sources?.has('update')) return '可选（仅 update 中出现）';
  if (rec.readOnlyFields?.has(node)) return '**只读**（仅见于 query/read 回参，create/update 入参无 → 疑似系统生成）';
  return '~';
}

function sortFields(fields, primaryKey) {
  return fields.sort((a, b) => {
    const ai = primaryKey.indexOf(a.node);
    const bi = primaryKey.indexOf(b.node);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.node.localeCompare(b.node);
  });
}

/** JSONC 宽松解析（剥注释） */
function parseJsoncLoose(raw) {
  if (!raw || !String(raw).trim()) return null;
  let s = String(raw);
  s = s.replace(/(:\s*)"([^"]*?)"\s*\/\/[^\n]*/g, '$1"$2"');
  s = s.replace(/^\s*\/\/[^\n]*/gm, '');
  try { return JSON.parse(s); } catch { return null; }
}

main();
