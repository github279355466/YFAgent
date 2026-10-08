# -*- coding: utf-8 -*-
"""
gen-er-overview.py — 易飞(E10) 表间关联启发式推断（v2）

⚠️ 源数据无外键约束，本脚本产出**均为推断，非声明**，不可直接用作建库依据。

━━━ v2 相对 v1 的关键修正 ━━━
v1 产出 1625 万行/ 842 MB —— **笛卡尔积爆炸**。根因：
  「预留字段」这一个无语义中文名就出现在 5316 张表中，
  单它一项就产生 1412 万组合；「保留字段」「备注」等同理。

v2 修正策略：
  1. **停用词过滤** —— 排除「预留字段」「保留字段」等无语义/无区分度的中文名
  2. **表数上限** —— 同一中文名超过 MAX_TABLES 张表则不做两两配对
     （真正的关联键通常集中在少数几张表里）
  3. **输出分级限量** —— CSV 有行数上限，避免再次失控

━━━ 置信度定义 ━━━
  HIGH 同模块 + 中文名一致 + 字段序号前缀相同（典型单头/单身对）
  MID  同模块 + 中文名一致
  LOW  跨模块 + 中文名一致（误判率高，仅作线索）
"""

import collections
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# scripts/ -> 项目根
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOW = os.path.join(ROOT, 'knowledge')
OUT_DIR = os.path.join(KNOW, 'data-dictionary')
CR = chr(13)
LF = chr(10)

MGMT = {'COMPANY', 'CREATOR', 'USR_GROUP', 'CREATE_DATE', 'MODIFIER', 'MODI_DATE', 'FLAG'}

STOP_CN = {
    '预留字段', '保留字段', '备注', '说明', '注释', '備註',
    '建立日期', '建立人员', '修改日期', '修改人员',
}

MAX_TABLES = 40
CSV_LIMIT = 30000


def load_json(name):
    for p in (os.path.join(ROOT, '.workbuddy', 'tmp', 'dict', name),
              os.path.join(KNOW, name)):
        if os.path.exists(p):
            return json.load(open(p, 'r', encoding='utf-8'))
    raise FileNotFoundError(name)


def main():
    tables = load_json('tables.json')
    fields = load_json('fields.json')
    print('表 %d 张，字段 %d 个' % (len(tables), len(fields)))
    tmap = {t['table']: t for t in tables}

    by_cn = collections.defaultdict(list)
    for f in fields:
        if f['column'] in MGMT or f['is_udf'] or not f['column_cn']:
            continue
        if f['column_cn'] in STOP_CN:
            continue
        by_cn[f['column_cn']].append((f['table'], f['column'], f['column'][:2]))

    usable = {cn: it for cn, it in by_cn.items() if 2 <= len(it) <= MAX_TABLES}
    dropped = {cn: len(it) for cn, it in by_cn.items() if len(it) > MAX_TABLES}
    print('中文名总数 %d -> 可用于推断 %d（超上限丢弃 %d 个）'
          % (len(by_cn), len(usable), len(dropped)))

    high, mid, low = [], [], []
    seen = set()
    for cn, items in usable.items():
        n = len(items)
        for i in range(n):
            for j in range(i + 1, n):
                t1, c1, p1 = items[i]
                t2, c2, p2 = items[j]
                if t1 == t2:
                    continue
                key = tuple(sorted([(t1, c1), (t2, c2)]))
                if key in seen:
                    continue
                seen.add(key)
                m1 = tmap.get(t1, {}).get('module', '')
                m2 = tmap.get(t2, {}).get('module', '')
                rec = {'cn': cn, 't1': t1, 'c1': c1, 't2': t2, 'c2': c2, 'm1': m1, 'm2': m2}
                if m1 and m1 == m2 and p1 and p1 == p2:
                    rec['conf'] = 'HIGH'
                    high.append(rec)
                elif m1 and m1 == m2:
                    rec['conf'] = 'MID'
                    mid.append(rec)
                else:
                    rec['conf'] = 'LOW'
                    low.append(rec)

    print('推断关联：高 %d / 中 %d / 低 %d（合计 %d）'
          % (len(high), len(mid), len(low), len(high) + len(mid) + len(low)))

    # 单据族配对
    groups = collections.defaultdict(list)
    for t in tmap:
        if len(t) >= 5:
            groups[t[:4]].append(t)
    hdr_det = []
    for g, ts in groups.items():
        if len(ts) < 2:
            continue
        ts = sorted(ts)
        for i in range(len(ts)):
            for j in range(i + 1, len(ts)):
                a, b = ts[i], ts[j]
                if a[-1] != 'C' and b[-1] != 'C':
                    continue
                hdr_det.append({
                    'family': g,
                    'header': a if a[-1] == 'C' else b,
                    'detail': b if a[-1] == 'C' else a,
                    'cn_a': tmap.get(a, {}).get('table_cn', ''),
                    'cn_b': tmap.get(b, {}).get('table_cn', ''),
                    'module': tmap.get(a, {}).get('module', ''),
                })

    L = []
    p = L.append
    p('# 易飞(E10) 表间关联概览（ER 推断）')
    p('')
    p('> 生成脚本：`scripts/gen-er-overview.py`')
    p('> 数据来源：`ADMMC-表名信息.xml`（%d 表）+ `ADMMD-字段信息.xml`（%d 字段）' % (len(tables), len(fields)))
    p('> 节点名到物理表映射：`node-table-map.csv`（真机反推 31 条）')
    p('')
    p('## 警告：本文档全部内容均为推断，非数据库声明')
    p('')
    p('源数据（`ADMMC` / `ADMMD`）**不含外键约束、索引、默认值定义**。')
    p('下述关联由启发式规则推导，**不可直接用作建库依据**，仅供开发期参考与人工核验线索。')
    p('')
    p('| 置信度 | 依据 | 可信度 |')
    p('|---|---|---|')
    p('| HIGH | 同模块 + 中文名一致 + 字段序号前缀相同 | 较可信（典型单头/单身对） |')
    p('| MID | 同模块 + 中文名一致 | 需人工确认 |')
    p('| LOW | 跨模块 + 中文名一致 | 仅为线索，误判率高 |')
    p('')
    p('### 推断的已知局限')
    p('')
    p('1. **无语义中文名不参与推断** —— 「预留字段」等出现在 5000+ 张表中，无区分度，已排除')
    p('2. **表数上限 %d** —— 同一中文名若出现在超过 %d 张表中，不做两两配对（否则组合爆炸）' % (MAX_TABLES, MAX_TABLES))
    p('3. **同模块假设** —— MID/HIGH 依赖 `MC004` 模块划分，模块划分本身可能有误')
    p('4. **仅覆盖同名字段** —— 若关联字段中文名不同（如「客户」vs「客户编号」），本方法无法发现')
    p('')
    p('## 一、字段命名规律（推断基础）')
    p('')
    p('```')
    p('字段名 = 表名实体位+ 3 位序号')
    p('实体位 ∈ { table[-2:], table[3:5] }    <- 并集，两种位置都可能出现')
    p('例：PURTC -> TC001（实体位=t[-2:]）；ACTMS205 -> MS001（实体位=t[3:5]）；DSCINTMA -> MA001（实体位=t[-2:]）')
    p('```')
    p('')
    p('- 实测匹配率 **97.4%**（26087/26798，已排除 UDF 与 3 张元数据表）')
    p('- 不可只用单侧：仅 `table[-2:]` 会把 5 张 `*205` 子表的 50 个字段误判为非标准；'
      '仅 `table[3:5]` 会把 `DSCINTMA`/`WARRANT` 的 11 个字段误判为非标准')
    p('- 完整分析见 `docs/plans/yf-field-naming-convention.md`')
    p('')
    p('## 二、单据族单头/单身配对')
    p('')
    p('按「表名前 4 位相同 + 其一以 C 结尾（视为单头）」推断，共 **%d 对**。' % len(hdr_det))
    p('')
    p('| 族 | 单头表 | 单头中文名 | 单身表 | 单身中文名 | 模块 |')
    p('|---|---|---|---|---|---|')
    for h in sorted(hdr_det, key=lambda x: (x['family'], x['header'])):
        p('| %s | `%s` | %s | `%s` | %s | %s |' % (
            h['family'], h['header'], h['cn_a'] or '~', h['detail'], h['cn_b'] or '~', h['module']))

    for conf, name, items in [('HIGH', '高置信', high), ('MID', '中置信', mid)]:
        p('')
        p('## 三、%s关联（%d 组）' % (name, len(items)))
        p('')
        if not items:
            p('（无）')
            continue
        limit = min(len(items), 200)
        p('| 共享中文名 | 表 A | 字段 | 表 B | 字段 | 模块 |')
        p('|---|---|---|---|---|---|')
        for r in sorted(items, key=lambda x: (x['cn'], x['t1']))[:limit]:
            p('| %s | `%s` | `%s` | `%s` | `%s` | %s |' % (
                r['cn'], r['t1'], r['c1'], r['t2'], r['c2'], r['m1'] or r['m2']))
        if len(items) > limit:
            p('')
            p('> 仅显示前 %d 组（共 %d 组），全量见 `ER-relations.csv`' % (limit, len(items)))

    p('')
    p('## 四、低置信关联')
    p('')
    p('跨模块同中文名，共 **%d 组**。跨业务边界，**误判率高**，仅作线索。' % len(low))
    p('')
    if low:
        limit = min(len(low), 50)
        p('| 共享中文名 | 表 A | 表 B | 模块 A | 模块 B |')
        p('|---|---|---|---|---|')
        for r in sorted(low, key=lambda x: x['cn'])[:limit]:
            p('| %s | `%s` | `%s` | %s | %s |' % (r['cn'], r['t1'], r['t2'], r['m1'], r['m2']))
        if len(low) > limit:
            p('')
            p('> 仅显示前 %d 组（共 %d 组）' % (limit, len(low)))

    p('')
    p('## 五、因无区分度被排除的中文名（TOP 20）')
    p('')
    p('| 中文名 | 出现表数 |')
    p('|---|---|')
    for cn, n in sorted(dropped.items(), key=lambda x: -x[1])[:20]:
        p('| %s | %d |' % (cn, n))
    p('')
    p('> 这些中文名因出现在过多表中（>%d），两两配对会产生海量无意义组合，故排除。' % MAX_TABLES)
    p('')
    # 截断声明（必须在文档内显式说明，不能只写到 stdout）
    p('## 六、关联 CSV 的截断状态')
    p('')
    total_all = len(high) + len(mid) + len(low)
    BT = chr(96)  # 反引号，避免在源码里嵌套引号
    if total_all >= CSV_LIMIT:
        p('**本目录的 ' + BT + 'ER-relations.csv' + BT + ' 已截断，不是全量推断结果。**')
        p('')
        p('| 项 | 值 |')
        p('|---|---|')
        p('| 推断总组数 | %d |' % total_all)
        p('| 实际写出 | %d |' % CSV_LIMIT)
        p('| HIGH / MID / LOW | %d / %d / %d |' % (len(high), len(mid), len(low)))
        p('| 上限常量 | `CSV_LIMIT = %d`（`scripts/gen-er-overview.py`） |' % CSV_LIMIT)
        p('')
        p('> LOW 置信组数最多，被优先截断。若需完整 LOW 组，请调高 `CSV_LIMIT` 后重跑。')
    else:
        p('`ER-relations.csv` 为全量推断结果，共 %d 组，未截断。' % total_all)
    p('')
    p('## 七、信息缺失与存疑清单')
    p('')
    p('| # | 缺失项 | 影响 | 处理建议 |')
    p('|---|---|---|---|')
    p('| 1 | **外键约束** | 无法确定真实关联关系 | 本文档推断需人工核验；建议向易飞索取规格文档 |')
    p('| 2 | **主键/索引** | 无法确定唯一性约束 | 需从单据定义或真机行为推断 |')
    p('| 3 | **默认值** | 插入新记录时不知默认行为 | 需真机实验或规格文档 |')
    p('| 4 | **枚举码值** | 元数据**不含枚举定义**（`MD008` 实为格式掩码，非代码表） | 需真机采集（T-07） |')
    p('| 5 | **类型码 Z / I** | 23 个字段类型不明 | 标 `UNKNOWN`，待确认 |')
    p('| 6 | **字段长度** | `MD005` 仅单字母 | 已从 `s:datatype` 的 `maxLength` 补入字典 |')
    p('| 7 | **4 张孤儿表** | `INVLK` `INVLL` `YFMXB` `YSMXB` 在字段表存在但表清单无 | 可能已删表残留 |')
    p('| 8 | **1 张空字段表** | `PMSTA` 在表清单但无字段记录 | 需确认 |')
    p('')

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, 'ER-OVERVIEW.md'), 'wb') as f:
        f.write(LF.join(L).replace(LF, CR + LF).encode('utf-8'))

    lines = ['confidence,shared_cn,table_a,column_a,table_b,column_b,module_a,module_b']
    total = 0
    for conf, items in [('HIGH', high), ('MID', mid), ('LOW', low)]:
        for r in items:
            if total >= CSV_LIMIT:
                break
            lines.append('%s,"%s",%s,%s,%s,%s,%s,%s' % (
                conf, r['cn'], r['t1'], r['c1'], r['t2'], r['c2'], r['m1'], r['m2']))
            total += 1
    with open(os.path.join(OUT_DIR, 'ER-relations.csv'), 'wb') as f:
        f.write((CR + LF).join(lines).encode('utf-8'))

    # 截断状态另存JSON，供机器读取（QA B1）
    truncated = total >= CSV_LIMIT
    _rep = {
        'csv_rows_written': total,
        'csv_rows_total': len(high) + len(mid) + len(low),
        'csv_truncated': truncated,
        'csv_limit': CSV_LIMIT,
        'by_confidence': {'HIGH': len(high), 'MID': len(mid), 'LOW': len(low)},
        'note': ('已截断至 %d 行（共推断 %d 组）。LOW 优先被截断，需完整数据请调高 CSV_LIMIT。'
                 % (CSV_LIMIT, len(high) + len(mid) + len(low))) if truncated else 'CSV 为全量，未截断。',
    }
    with open(os.path.join(OUT_DIR, 'ER-relations._report.json'), 'wb') as f:
        f.write((CR + LF).join(json.dumps(_rep, ensure_ascii=False, indent=2)).encode('utf-8'))

    print('已产出：')
    print('  knowledge/data-dictionary/ER-OVERVIEW.md')
    print('  knowledge/data-dictionary/ER-relations.csv（%d 行%s）'
          % (total, '，已达上限截断' if truncated else ''))
    print('  knowledge/data-dictionary/ER-relations._report.json')


if __name__ == '__main__':
    main()
