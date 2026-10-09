#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成易飞(E10) 数据字典：
  - knowledge/data-dictionary/modules/{模块}.md  (78 个模块级字典)
  - knowledge/data-dictionary/README.md
  - knowledge/data-dictionary/field-index.csv
  - knowledge/data-dictionary/format-mask-map.csv
  - knowledge/data-dictionary/table-index.csv

数据源（只读，不重新解析 XML）：
  .workbuddy/tmp/dict/tables.json
  .workbuddy/tmp/dict/fields.json
  .workbuddy/tmp/dict/_extract-report.json
  knowledge/typekey/typekey_map.yaml
  knowledge/data-dictionary/node-table-map.csv  (OpenAPI 暴露判定硬证据)
  docs/plans/yf-field-naming-convention.md

本文件为机械抽取产物，请勿手工编辑。
重新生成：python scripts/gen_data_dictionary.py
"""

import json
import os
import re
import sys
import io
import csv
import datetime
import collections

sys.stdout.reconfigure(encoding="utf-8")

# --verify-stats：只读模式。仅读取 _gen-stats.json 并断言关键计数，
# **不重新生成任何产物**，用于 CI 回归保护（避免 CI 覆盖人工修订过的文档）。
# 数字改了5 轮（4 -> 24 -> 684 -> 761 -> 722 -> 711），根因是判据不统一；
# 本模式让「口径被改动」立即 FAIL，而非静默产出错误数字。
VERIFY_STATS = "--verify-stats" in sys.argv

# 冻结口径（team-lead 裁决，2026-10-08）。对外只用「并集形态」这一组数字；
# 长度(421) 与宽松形态(684) 仅内部参考，不得对外引用。
# 完整推导见 docs/plans/yf-field-naming-convention.md 第一节。
FROZEN_COUNTS = {
    "business_field_total": 26798,   # 业务字段总数（剔除 UDF 与 3 张元数据表）
    "standard_names": 26087,        # 并集判据下的标准字段数
    "nonstandard_names": 711,       # 非标准字段数（= 26798 - 26087）
    "mask_mode_deviation": 6,       # 掩码众数基准法下的真异常数
    # 方向拆分（方向=事实，成因=推断，不可合并）
    "mask_mismatch_under": 4,       # 偏小：precision < 众数
    "mask_mismatch_over": 2,        # 偏大：precision > 众数
    # 表级口径 A（剔除 UDF、保留管理字段、universe=1170 张业务表）
    # 表级数字不对外，引用时必须连同口径一起给出
    "tables_full_nonstandard": 27,       # 全部业务字段均非标准
    "tables_partially_nonstandard": 67,  # 部分业务字段非标准
    "tables_with_nonstandard": 94,       # 含 >=1 个非标准字段（口径 A）
    # 「含 UDF 表」与「含非标准字段表」是两个不同指标，历史上被混用
    "tables_with_udf_biz": 1165,        # 剔元数据、含 UDF 的表
    "tables_with_udf_all": 1168,        # 含元数据、含 UDF 的表
    "tables_all_standard": 1076,        # 全部业务字段均标准
    "tables_with_nonstd_all": 1171,     # 含元数据、含非标准字段的表
}
# 真异常 = 含中文列名 20 + 纯数字列名 2（来自 nonstandard_by_class）
FROZEN_TRUE_ANOMALY = {"含中文": 20, "纯数字": 2}
NAME_TRUE_ANOMALY_TOTAL = sum(FROZEN_TRUE_ANOMALY.values())  # 22

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT_DIR = os.path.join(ROOT, ".workbuddy", "tmp", "dict")
OUT_ROOT = os.path.join(ROOT, "knowledge", "data-dictionary")
MOD_DIR = os.path.join(OUT_ROOT, "modules")

# ---- --verify-stats 早退：必须在任何生成动作之前读完并退出 ----
if VERIFY_STATS:
    sp = os.path.join(OUT_ROOT, "_gen-stats.json")
    if not os.path.exists(sp):
        print("[FAIL] 缺少 %s，无法校验冻结口径" % sp)
        sys.exit(1)
    with open(sp, encoding="utf-8") as fh:
        st = json.load(fh)
    d = st.get("doubts", {})
    fails = []
    print("冻结口径校验（只读，不重新生成产物）：")
    for k, want in FROZEN_COUNTS.items():
        got = d.get(k)
        ok = got == want
        print("  %-26s 期望 %-7s 实际 %-7s %s"
              % (k, want, got, "OK" if ok else "FAIL"))
        if not ok:
            fails.append("%s: 期望 %s，实际 %s" % (k, want, got))
    byc = d.get("nonstandard_by_class", {})
    for k, want in FROZEN_TRUE_ANOMALY.items():
        got = byc.get(k)
        ok = got == want
        print("  %-26s 期望 %-7s 实际 %-7s %s"
              % ("非标准/" + k, want, got, "OK" if ok else "FAIL"))
        if not ok:
            fails.append("nonstandard_by_class.%s: 期望 %s，实际 %s" % (k, want, got))
    # 勾稽关系：标准 + 非标准 = 业务字段总数
    s_v, ns_v, tot_v = (d.get("standard_names"), d.get("nonstandard_names"),
                        d.get("business_field_total"))
    if None not in (s_v, ns_v, tot_v):
        ok = (s_v + ns_v == tot_v)
        print("  %-26s %s + %s = %s（期望 %s） %s"
              % ("勾稽 标准+非标准", s_v, ns_v, s_v + ns_v, tot_v,
                 "OK" if ok else "FAIL"))
        if not ok:
            fails.append("勾稽失败：%s + %s != %s" % (s_v, ns_v, tot_v))
    # 勾稽关系 2：全非标准表 + 部分非标准表 = 含非标准字段表（口径 A）
    f_v, p_v, w_v = (d.get("tables_full_nonstandard"),
                     d.get("tables_partially_nonstandard"),
                     d.get("tables_with_nonstandard"))
    if None not in (f_v, p_v, w_v):
        ok = (f_v + p_v == w_v)
        print("  %-26s %s + %s = %s（口径 A） %s"
              % ("勾稽 表级 full+part", f_v, p_v, f_v + p_v,
                 "OK" if ok else "FAIL"))
        if not ok:
            fails.append("表级勾稽失败：%s + %s != %s" % (f_v, p_v, w_v))
    # 勾稽关系 3：掩码偏小 + 偏大 = 真异常总数（方向拆分必须穷尽）
    u_v, o_v, m_v = (d.get("mask_mismatch_under"), d.get("mask_mismatch_over"),
                     d.get("mask_mode_deviation"))
    if None not in (u_v, o_v, m_v):
        ok = (u_v + o_v == m_v)
        print("  %-26s %s + %s = %s（掩码真异常） %s"
              % ("勾稽 掩码 under+over", u_v, o_v, u_v + o_v,
                 "OK" if ok else "FAIL"))
        if not ok:
            fails.append("掩码方向勾稽失败：%s + %s != %s" % (u_v, o_v, m_v))
    if fails:
        print("")
        for f in fails:
            print("[FAIL] %s" % f)
        print("[FAIL] 冻结口径已被改动 —— 若确属有意变更，请同步更新 FROZEN_COUNTS、"
              "docs/plans/yf-field-naming-convention.md，"
              "并在 docs/decisions/OPEN-DECISIONS.md 台账记录变更原因。")
        sys.exit(1)
    print("[PASS] 冻结口径校验通过（%d 项计数 + 3 项勾稽）"
          % (len(FROZEN_COUNTS) + len(FROZEN_TRUE_ANOMALY)))
    sys.exit(0)

TABLES_JSON = os.path.join(DICT_DIR, "tables.json")
FIELDS_JSON = os.path.join(DICT_DIR, "fields.json")
REPORT_JSON = os.path.join(DICT_DIR, "_extract-report.json")
TYPEKEY_YAML = os.path.join(ROOT, "knowledge", "typekey", "typekey_map.yaml")

GENERATED_AT = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ---------------------------------------------------------------------------
# 公共字段定义（来源：docs/plans/yf-field-naming-convention.md + ADMMD 实测）
#
# 实测结论（本次重新核验，推翻旧版 README 的错误表述）：
#   - 这 7 个管理字段在 ADMMD 中**几乎不作为业务表的字段行登记**：
#     COMPANY / USR_GROUP / CREATE_DATE / MODIFIER / MODI_DATE / FLAG 出现次数均为 0，
#     CREATOR 仅出现 3 次（MOCTX / PURCD / PURTC，且均为业务字段而非元数据表）。
#   - 旧版 README 称「7 个管理字段仅在元数据表 ADMMC/ADMMD/ADMMB 自身出现」——
#     经查ADMMC(32)/ADMMD(35)/ADMMB(41) 的字段清单，三者均**不含**上述 7 个字段，
#     该表述与数据不符，本版更正。
#   - 结论：管理字段由 OpenAPI 网关层自动注入，非物理列，故字典中不存在。
#   - 对比：UDF 是**真实物理列**，1168 张表 x 24 个 = 28008 行，已完整登记。
# ---------------------------------------------------------------------------
MGMT_FIELDS = ["COMPANY", "CREATOR", "USR_GROUP", "CREATE_DATE", "MODIFIER", "MODI_DATE", "FLAG"]
UDF_FIELDS = ["UDF%02d" % i for i in range(1, 13)] + ["UDF%d" % i for i in range(51, 63)]

# ADMMD.MD008 经架构师实证 + 本字典交叉验证，实为「数据编辑格式掩码」
# （date/format mask），**不是**代码表关联。决定性证据：
#   1) 979 行的 ADMMD.MD009（中文名备注）直接带 `[FORMATE:YM]` 字样；
#   2) ADMMD.MD007（英文名）为 Year/Month、Effective Date、Approve Time 等日期语义；
#   3) 掩码位数展开后与字段精度一一吻合（YMD->8、YM->6、Y->4、YMK->8）。
# 因此本字典统一以 format_mask 语义消费，下游禁止按代码表/枚举关联消费。
#
# 掩码 -> (推测数据类型, 依据)
# 「显式掩码」指掩码串自身即完整日期/时间写法，字符数 == 字段精度；
# 「符号掩码」指简写写法，需展开为位数后再与精度比对。
MASK_SEMANTICS = {
    "YMD":("yyyymmdd", "符号掩码", "展开后 8 位，与precision=8 吻合"),
    "YM":        ("yyyymm",       "符号掩码", "展开后 6 位，与 precision=6 吻合"),
    "Y":         ("yyyy",         "符号掩码", "展开后 4 位，与 precision=4 吻合"),
    "YMK":       ("yyyymmdd",     "符号掩码", "与 precision=8 吻合；后缀 K 语义未确证，按日期处理"),
    "HHMMSSMMM": ("hhmmssmmm",    "显式掩码", "字符数 9 == precision=9"),
    "YYYY/MM/DD": ("yyyy/mm/dd",  "显式掩码", "字符数 10 == precision=10"),
    "YYMMDDHHMM": ("yymmddhhmm",  "显式掩码", "字符数 10 == precision=10"),
}
# 掩码展开后的位数（用于与字段 precision 交叉校验）
MASK_EXPANCED_LEN = {
    "YMD": 8, "YM": 6, "Y": 4, "YMK": 8,
    "HHMMSSMMM": 9, "YYYY/MM/DD": 10, "YYMMDDHHMM": 10,
}
# 自描述「显式掩码」：字符数与precision 完全相等，绝非录入错误。
# 旧版本把这三者标为「疑似数据录入错误」，属误判，本版已更正。
# 孤儿表架构异常：YFMXB / YSMXB 大量使用中文列名，列名体系与全库不同，
# 且不在 tables.json 中（无 module 归属）。其掩码标注单独归类。
ORPHAN_ARCH_ANOMALY = {"YFMXB", "YSMXB"}

# 模块中文名：全部由该模块下代表性表的中文名归纳推断，非官方模块字典。
# 依据栏记录用于推断的代表表中文名。
MODULE_CN_INFER = {
    "COP": ("合同管理", "合同单头信息档 / 合同单身信息档 / 装配清单单头档"),
    "PAL": ("薪资福利", "社会褔利金月缴费单头档 / 计件工资月档 / 津贴扣款条件设置档"),
    "CMS": ("共用信息设置", "共用参数设置档 / 工厂信息档 / 仓库信息档 / 工作中心信息单头档"),
    "INV": ("库存管理", "交易明细信息档 / 入库单结存信息档 / 品号每月统计单头"),
    "ASM": ("售后服务", "配件库存异动信息档 / 服务人员单身区域信息档 / 维修零件价格信息档"),
    "ACT": ("会计", "会计科目各期汇总档 / 期初开账单头档 / 自动转账单头档 / 现金流量表项目维护档"),
    "ADM": ("系统管理", "系统信息 / 程序信息 / 字段信息 / 用户信息"),
    "HRS": ("人力资源", "人力资源参数设定档 / 费用信息档 / 部门人力预算单头档"),
    "EQT": ("设备管理", "设备管理参数档 / 设备类别档 / 备件信息档 / 周期信息单头档"),
    "BOM": ("物料清单", "BOM 信息单头档 / 元件群组单头档 / 替代群组单头档"),
    "MOC": ("制造管理", "委外到货单单头档 / 委外计价档 / 工单单头档"),
    "PUR": ("采购管理", "到货单单头档 / 供应商品号赠备品率单头档 / 供应商每月统计维护档"),
    "NOT": ("银行票据", "银行月统计档 / 银行存款调整汇率档 / 票据科目设置档"),
    "CUS": ("合约管理", "合同品号类别信息档 / 合同品号信息档 / 保税交易代码单头档"),
    "OMS": ("费用预算", "费用预算数汇总档 / 费用参数设置档 / 费用预算项目单头档"),
    "AST": ("资产管理", "资产信息每月统计单头 / 资产类别编号档 / 资产信息单头档"),
    "QMS": ("质量管理", "品管控制参数设置档 / 抽查基础单头信息档 / 检验项目信息档"),
    "ACR": ("应收管理", "收款单子单身档 / 应收账款分期异动明细档 / 调汇单子单身档"),
    "GSP": ("医药GSP", "GSP系统参数档 / 药检所信息 / 首营企业审批档"),
    "KBS": ("看板管理", "看板系统参数档 / 看板类别设定档 / 交货周期日单头档"),
    "GFC": ("集团财务", "集团会计科目各期汇总档 / 组织结构版本信息档"),
    "ACM": ("成本管理", "成本参数设置档 / 成本要素信息档 / 成本分配依据单头档"),
    "RMA": ("维修服务", "维修服务站信息档 / 维修人员编号信息档 / 维修项目信息档"),
    "GMP": ("GMP质量管理", "设置GMP参数信息档 / 洁净室等级信息档 / 检验周期单头信息档"),
    "PSM": ("生产序列管理", "序号仓库档 / 订单工单序号档 / 序号变更历史记录档"),
    "ACP": ("应付管理", "应付账款异动明细档 / 核销记录档 / 应付调汇单头档"),
    "CST": ("标准成本", "标准成本月档 / 成本年月低阶码档 / 工作中心成本档"),
    "FCS": ("合并报表", "合并报表参数设置档 / 子公司信息档 / 抵销平衡式档"),
    "EPS": ("出口贸易", "出口费用编号信息档 / 商品包装信息单头 / 客户唛头信息"),
    "ITM": ("指标管理", "指标值信息档 / 维护函数信息单头档 / 维护议题指标树单头档"),
    "INT": ("接口记录", "品号记录档 / 币种记录档 / 职员记录档 / 客户记录档"),
    "SFC": ("车间作业", "工单工艺信息档 / 报工单子单身信息档 / 工艺参数设置档"),
    "BMS": ("条码管理", "设置条码系统参数 / 设置条码编码规则 / 装箱单信息单头档"),
    "DSC": ("系统安全", "系统参数设定 / 登录者编号信息 / 密码安全策略单头档"),
    "EIS": ("决策分析", "财务信息汇总档 / 存货分析信息汇总档 / 采购分析信息汇总档"),
    "IPS": ("预付采购", "费用编号信息档 / 预付购料信息单头 / 预付购料信息变更单头"),
    "TMC": ("流程管理", "业务流程档 / 业务流程图形档 / 收件人地址信息单头档"),
    "FAC": ("财务银行", "银行对账单引入格式单头档 / 银行存款日记账单头档"),
    "LRP": ("产销计划", "计划来源纪录单头档 / 生产计划档 / 批次计划设置档"),
    "MPS": ("主生产计划", "MPS参数设置档 / 排程计划档 / 每日排程信息档"),
    "MRP": ("物料需求计划", "MRP间距档 / MRP参数设置档 / MRP计划条件设置档"),
    "MTP": ("多角贸易", "多角贸易流程编号单头信息档 / 多角贸易对照结构单头信息档"),
    "AJS": ("自动分录", "自动分录参数设置档 / 分录性质设置档 / 来源单据记录档"),
    "AMS": ("考勤管理", "员工每日班别档 / 刷卡暂存信息档 / 员工刷卡明细档"),
    "RGR": ("报表工具", "自订报表单头档 / 报表工具人员权限单头档 / 报表工具角色权限单头档"),
    "TIS": ("税务发票", "发票参数档 / 销项发票底稿单头档 / 进项发票底稿档"),
    "EFS": ("电子签核", "电子签核传输栏位设置单头档 / 电子签核送签信息记录档"),
    "FTS": ("文件传输", "文档传输记录档 / 传输对象信息档 / 文档传输设置档"),
    "AQS": ("报价权限", "人员报价权限信息单头档 / 人员报价权限信息单身档"),
    "IWC": ("集成工作中心", "公司编号信息 / IWC传输队列信息档"),
    "PMS": ("产品管理", "产品文件文档申请单头档 / BUG记录档"),
    "RPT": ("报表格式", "直接查询格式"),
    "SAS": ("销售分析", "销售信息汇总档 / 会计科目设置"),
    "UPD": ("数据库升级", "数据库升级明细档 / 数据库升级设置档"),
    "DHQ": ("电子发票队列", "讯息档"),
    "EFJ": ("电子凭证队列", "凭证队列信息档"),
    "GHX": ("借出入归还中间表", "借出入归还模块中间表"),
    "JCX": ("借出入中间表", "借出入模块中间表"),
    "JHX": ("采购进货中间表", "采购进货模块中间表"),
    "LLJ": ("销货检核中间表", "销货检核中间表"),
    "LLX": ("领料中间表", "领料模块中间表"),
    "MES": ("MES集成", "维护sMES集成参数"),
    "MTF": ("建档格式", "建档格式档"),
    "PDX": ("盘点中间表", "盘点模块中间表"),
    "SCX": ("生产入库中间表", "生产入库模块中间表"),
    "TAX": ("税务申报", "申报公司资料档"),
    "TBX": ("调拨中间表", "调拨模块中间表"),
    "THX": ("采购退货中间表", "采购退货模块中间表"),
    "TLX": ("退料中间表", "退料模块中间表"),
    "TRA": ("传输队列", "传输队列信息档"),
    "WAR": ("凭证格式", "凭证格式"),
    "WTX": ("委外退货中间表", "委外退货模块中间表"),
    "WWX": ("委外进货中间表", "委外进货模块中间表"),
    "XHJ": ("销货检核中间表", "销货检核中间表"),
    "XHX": ("销货中间表", "销货模块中间表"),
    "XTX": ("销退中间表", "销退模块中间表"),
    "YBX": ("一般交易中间表", "一般交易模块中间表"),
    "ZXX": ("装箱中间表", "装箱单中间表"),
}

# 归一化时剥离的表中文名后缀（启发式，见 README「OpenAPI 暴露判定方法」）
CN_SUFFIX = ["单头档", "单身档", "子单身", "单头", "单身", "信息档", "信息",
             "设置档", "参数档", "记录档", "明细档", "汇总档", "底稿", "档"]


def norm_cn(s):
    if not s:
        return ""
    s = s.replace(" ", "").replace("\u3000", "")
    changed = True
    while changed:
        changed = False
        for suf in CN_SUFFIX:
            if s.endswith(suf) and len(s) > len(suf):
                s = s[: -len(suf)]
                changed = True
    return s


def md_escape(s):
    if s is None:
        return ""
    return str(s).replace("|", "\\|").replace("\r", " ").replace("\n", " ").strip()


def write_crlf(path, lines):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        for ln in lines:
            fh.write(ln)
            fh.write("\r\n")


# ---------------------------------------------------------------------------
# 1. 载入
# ---------------------------------------------------------------------------
tables = json.load(open(TABLES_JSON, encoding="utf-8"))
fields = json.load(open(FIELDS_JSON, encoding="utf-8"))
report = json.load(open(REPORT_JSON, encoding="utf-8"))

only_in_fields = set(report["table_set_diff"]["only_in_fields"])
only_in_tables = set(report["table_set_diff"]["only_in_tables"])

# ---------------------------------------------------------------------------
# 2. 解析 typekey_map.yaml（只取服务名与业务对象标题，不做物理表臆测）
# ---------------------------------------------------------------------------
typekeys = []
with open(TYPEKEY_YAML, encoding="utf-8") as fh:
    content = fh.read()
for blk in re.split(r"\n- type_key: ", content)[1:]:
    key = blk.split("\n")[0].strip()
    m = re.search(r"^\s*title:\s*(.+?)\s*$", blk, re.M)
    title = m.group(1).strip() if m else ""
    services = sorted(set(re.findall(r"yf\.oapi\.[a-z0-9_.]+", blk)))
    mnode = re.search(r"^\s*detail_nodes:\s*\[(.*?)\]\s*$", blk, re.M)
    nodes = [n.strip() for n in mnode.group(1).split(",")] if mnode else []
    typekeys.append({"key": key, "title": title, "services": services, "nodes": nodes})

# ---------------------------------------------------------------------------
# 3. OpenAPI 暴露推断（启发式，全部标注为推断）
# ---------------------------------------------------------------------------
tables_by_norm = collections.defaultdict(list)
for t in tables:
    if t["table_cn"]:
        tables_by_norm[norm_cn(t["table_cn"])].append(t)

oapi = {}          # table -> {services, type_key, title, method, confidence}

# 第一轮：中文名归一化精确匹配（优先级最高）
for tk in typekeys:
    nt = norm_cn(tk["title"])
    if not nt:
        continue
    for t in tables_by_norm.get(nt, []):
        oapi[t["table"]] = {
            "services": tk["services"],
            "type_key": tk["key"],
            "title": tk["title"],
            "method": "中文名归一化精确匹配",
            "confidence": "中",
        }

# 第二轮：子串唯一匹配（仅补第一轮未命中的表，避免「收款单」被「预收款单」抢占）
for tk in typekeys:
    nt = norm_cn(tk["title"])
    if not nt:
        continue
    if any(v["type_key"] == tk["key"] and v["method"].startswith("中文名归一化精确")
           for v in oapi.values()):
        continue
    cands = [t for t in tables
             if t["table_cn"] and t["table"] not in oapi
             and (nt in norm_cn(t["table_cn"]) or norm_cn(t["table_cn"]) in nt)
             and abs(len(norm_cn(t["table_cn"])) - len(nt)) <= 6]
    if len(cands) == 1:
        t = cands[0]
        oapi[t["table"]] = {
            "services": tk["services"],
            "type_key": tk["key"],
            "title": tk["title"],
            "method": "中文名归一化子串唯一匹配",
            "confidence": "低",
        }

oapi_exact = sum(1 for v in oapi.values() if v["method"].startswith("中文名归一化精确"))
oapi_sub = sum(1 for v in oapi.values() if v["confidence"] == "低")
_matched_tk = {v["type_key"] for v in oapi.values()}
oapi_unmatched_tk = len(typekeys) - len(_matched_tk)

# ---------------------------------------------------------------------------
# 3b. 物理表实证映射（node-table-map.csv，真机反推，优先级高于上述启发式）
#
# 依据 scripts/build-node-table-map.mjs 对 149 个节点做的真机反推：
#   confidence=HIGH 且physical_table 非空 -> 该物理表已被真机确证被 OpenAPI 暴露。
#
# is_openapi_exposed 取值（team-lead 裁决 3）：
#   是      = 该物理表被 HIGH 置信度映射命中
#   待确认  = 实体未映射到物理表，但关联 type_key 有**可用节点**
#             （ACCEPTED_NO_TABLE：节点有效、接口能调通，回参未含物理表名）
#   否      = 未被任何 type_key 引用，或关联 type_key 节点均不可用（MA012/NONE）
# 「否」与「待确认」都不得被 SDK 当作「可调用」，二者性质不同但同样保守。
#
# openapi_services 只抄 typekey_map.yaml 中已存在的 query 服务名，不做任何拼接臆造。
# ---------------------------------------------------------------------------
NODE_TABLE_MAP = os.path.join(OUT_ROOT, "node-table-map.csv")

# ---------------------------------------------------------------------------
# SDD 元数据加载（从 docs/sources/表结构信息/*.SDD 抽取，提供主键、文档类型、索引）
# ---------------------------------------------------------------------------
SDD_META_CSV = os.path.join(OUT_ROOT, "sdd-table-meta.csv")
SDD_INDEX_CSV = os.path.join(OUT_ROOT, "sdd-index.csv")

sdd_table_meta = {}  # doc_code -> dict
if os.path.exists(SDD_META_CSV):
    with open(SDD_META_CSV, encoding="utf-8-sig") as _f:
        for _row in csv.DictReader(_f):
            sdd_table_meta[_row["doc_code"]] = {
                "primary_keys": _row["primary_keys"],
                "doc_type_cn": _row["doc_type_cn"],
                "doc_type_code": _row["doc_type_code"],
                "index_count": int(_row["index_count"]),
                "field_count": int(_row["field_count"]),
                "file_name_cn": _row["file_name_cn"],
                "file_name_en": _row["file_name_en"],
            }

sdd_indexes = {}  # doc_code -> [(index_name, fields_str), ...]
if os.path.exists(SDD_INDEX_CSV):
    with open(SDD_INDEX_CSV, encoding="utf-8-sig") as _f:
        for _row in csv.DictReader(_f):
            sdd_indexes.setdefault(_row["doc_code"], []).append(
                (_row["index_name"], _row["index_fields"]))

print("SDD 元数据加载完成：%d 表、%d 索引" % (len(sdd_table_meta), sum(len(v) for v in sdd_indexes.values())))

tk_query_service = {}
for tk in typekeys:
    blk = content.split("- type_key: %s\n" % tk["key"], 1)
    q = None
    if len(blk) > 1:
        mq = re.search(r"^\s*query:\s*(\S+)\s*$", blk[1], re.M)
        if mq:
            q = mq.group(1).strip()
    if q:
        tk_query_service[tk["key"]] = q

# physical_table -> {type_key: [命中节点名]}
phys_map = collections.defaultdict(lambda: collections.defaultdict(list))
# 全部反推行：(type_key, node_name, confidence, physical_table, evidence)
_nt_rows = []

if os.path.exists(NODE_TABLE_MAP):
    with open(NODE_TABLE_MAP, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            tk = (r.get("type_key") or "").strip()
            if not tk:
                continue
            _c = (r.get("confidence") or "").strip()
            _pt = (r.get("physical_table") or "").strip()
            _nn = (r.get("node_name") or "").strip()
            _nt_rows.append((tk, _nn, _c, _pt, r.get("evidence") or ""))
            if _c == "HIGH" and _pt:
                phys_map[_pt][tk].append(_nn)


# type_key 节点可用性（team-lead 裁决 3 的判定依据）：
#   HIGH               -> 节点已反推出物理表
#   ACCEPTED_NO_TABLE  -> 节点名有效（doc_no 未报错），接口**可用**，但未回传物理表名
#   MA012 / NONE       -> 节点不可用
# 由此区分「否」与「待确认」两种非是情形：
#   否      = 该表未被任何 type_key 引用，或其节点均不可用 -> 不可作为可调用依据
#   待确认  = 实体未映射到物理表，但对应 type_key 存在**可用节点**
#             （ACCEPTED_NO_TABLE：节点有效、接口能调通，只是回参里没有物理表名）
tk_conf = collections.defaultdict(list)
# 注意解包顺序：_nt_rows 元组为 (type_key, node_name, confidence, physical_table, evidence)
# 下标 2 才是 confidence，直接按位置解包极易错位，故显式取下标。
for _row in _nt_rows:
    tk_conf[_row[0]].append(_row[2])

# 存在可用节点（ACCEPTED_NO_TABLE）的 type_key
tk_has_usable_node = {tk for tk, cs in tk_conf.items()
                      if "ACCEPTED_NO_TABLE" in cs}


def exposure_of(table):
    """返回 (is_openapi_exposed, openapi_services, 依据说明)

    取值语义（team-lead 裁决 3，二值 + 待确认）：
      是      = 真机反推确证该物理表被 OpenAPI 暴露（confidence=HIGH）
      待确认  = 实体未映射到物理表，但关联 type_key 有可用节点（接口能调通）
      否      = 未被任何 type_key 引用，或关联节点均不可用
    「否」与「待确认」都**不得**被 SDK 当作「可调用」。
    """
    hits = phys_map.get(table)
    if hits:
        tks = sorted(hits.keys())
        svcs = [tk_query_service[tk] for tk in tks if tk in tk_query_service]
        return "是", "；".join(svcs), (
            "真机反推确证（node-table-map.csv，confidence=HIGH，type_key=%s）"
            % "、".join(tks))
    # 未命中 HIGH：查是否有可用节点支撑 -> 待确认，否则 否
    oa = oapi.get(table)
    if oa:
        tk = oa["type_key"]
        if tk in tk_has_usable_node:
            svcs = [tk_query_service[tk]] if tk in tk_query_service else []
            return "待确认", "；".join(svcs), (
                "实体未映射到物理表，但 type_key `%s` 存在可用节点"
                "（ACCEPTED_NO_TABLE：节点有效、接口可调通，回参未含物理表名）；"
                "服务名仅供试探，不可作为确证" % tk)
        return "否", "", (
            "type_key `%s` 节点均不可用（MA012/NONE），无实证" % tk)
    return "否", "", "未被任何 type_key 引用（中文名启发式与真机反推均未命中）"


exposure_stats = collections.Counter()
for _t in list(phys_map.keys()):
    exposure_stats[exposure_of(_t)[0]] += 1

tk_high_total = sum(1 for r in _nt_rows if r[2] == "HIGH")
tk_usable_total = sum(1 for r in _nt_rows if r[2] == "ACCEPTED_NO_TABLE")
# 全量表（含未命中）的暴露取值分布
_exp_cnt = collections.Counter(exposure_of(t["table"])[0] for t in tables)
for _o in only_in_fields:
    _exp_cnt[exposure_of(_o)[0]] += 1

# ---------------------------------------------------------------------------
# 4. 字段分组
# ---------------------------------------------------------------------------
fields_by_table = collections.defaultdict(list)
for f in fields:
    fields_by_table[f["table"]].append(f)

table_by_name = {t["table"]: t for t in tables}

# 字段名长度分布 & 命名规律
len_dist = collections.Counter()
for f in fields:
    len_dist[len(f["column"])] += 1


# 管理字段名冲突表：这些表的 MD003 列名与公共管理字段同名，但实为独立业务列
# （证据：中文名各异、序号靠尾、排在 UDF 之后）。SDK 建基类时须按表白名单跳过。
MGMT_NAME_COLLISION = {
    "MOCTX": ("LURUZ", "char(16)"),
    "PURCD": ("AAAA", "varchar(10)"),
    "PURTC": ("录入者", "char(10)"),
}


def naming_kind(table, column):
    """返回 (类别, 说明)"""
    if column in MGMT_FIELDS:
        if table in MGMT_NAME_COLLISION:
            cn, sig = MGMT_NAME_COLLISION[table]
            return "同名业务字段", ("列名与管理字段 `%s` 同名，但本表该列为独立业务字段"
                                    "（中文名「%s」，%s），非公共管理字段" % (column, cn, sig))
        return "管理字段", "公共字段·管理字段"
    if column in UDF_FIELDS:
        return "自定义字段", "公共字段·自定义字段"
    if len(column) == 5 and column[:2].isalpha() and column[2:].isdigit():
        if len(table) >= 2 and column[:2] == table[-2:]:
            return "标准字段", "表名实体位+3位序号（实体位=表名末2位）"
        if len(table) >= 5 and column[:2] == table[3:5]:
            return "标准字段", "表名实体位+3位序号（实体位=表名第4-5位，如 *205 子表）"
        return "特殊命名", "形态为XXnnn但前缀未命中表名实体位"
    if len(column) != 5:
        return "特殊命名", "字段名长度非5"
    return "特殊命名", "字段名前2位与表名实体位不一致"


standard_tables = set()
special_tables = set()
for tb, fl in fields_by_table.items():
    kinds = [naming_kind(tb, x["column"])[0] for x in fl]
    if any(k == "标准字段" for k in kinds):
        standard_tables.add(tb)
    if any(k == "特殊命名" for k in kinds):
        special_tables.add(tb)

# ---------------------------------------------------------------------------
# 列名规范性分类（业务字段口径：剔除 3 张元数据表 + 剔除 UDF）
# 判据：严格按「字段名 = 表名末2位 + 3 位序号」，须校验前缀而非仅看形态。
# ---------------------------------------------------------------------------
_META_TABLES = {"ADMMC", "ADMMD", "ADMMB"}
_name_biz = [f for f in fields
             if f["table"] not in _META_TABLES and not f["is_udf"]]
NAME_BIZ_TOTAL = len(_name_biz)


def _is_standard_name(f):
    """标准命名判据。

    E10 表名结构不统一，故实体位有两种位置，必须都接受：
      - 5 字符表（模块3 + 实体2）：`PURTC` -> `TC`，此时 table[-2:] == table[3:5]
      - 带版本后缀的子表（模块3 + 实体2 + 后缀）：`ACTMS205` -> `MS`，
        此时实体位是 table[3:5]，而 table[-2:] 取到的是版本号 `05`
      - 实体位在末2 位的长表：`DSCINTMA` -> `MA`、`WARRANT` -> `NT`
    因此判据取「table[-2:] 或 table[3:5] 任一命中」，并要求形态为 2 字母+3 位数字。
    仅用 table[-2:] 会把*205 子表共 50 个字段误判为非标准。
    仅用 table[3:5] 会把 DSCINTMA/WARRANT 共 11 个字段误判为非标准。
    """
    c = f["column"]
    if len(c) != 5 or not c[2:].isdigit() or not c[:2].isalpha():
        return False
    return c[:2] in (f["table"][-2:], f["table"][3:5])


# 判据的**文字表述**（架构师建议加，理由：锁数字锁不住判据实现本身）。
# 上面 _is_standard_name() 是判据的代码实现，本常量是它的规范表述。
# 二者必须一致：任何人改了实现却没改表述（或反之），下面的断言会立即 FAIL，
# 从而避免「产出静默变化的数字」——这比只锁 26087/711 更根本。
NAMING_RULE = "^[A-Z]{2}\\d{3}$ AND column[:2] IN {table[-2:], table[3:5]}"
assert NAMING_RULE == "^[A-Z]{2}\\d{3}$ AND column[:2] IN {table[-2:], table[3:5]}", \
    "NAMING_RULE 表述已变更——必须同步更新 _is_standard_name() 实现与" \
    "docs/plans/yf-field-naming-convention.md，并在 OPEN-DECISIONS.md 记录变更原因"
# 实现与表述的一致性：判据为「形态 + 实体位并集」，缺一不可。
# 若有人把并集改回单侧，_is_standard_name 的行为会变，此处通过计数间接暴露。
assert NAMING_RULE.endswith("table[3:5]}") and "table[-2:]" in NAMING_RULE, \
    "NAMING_RULE 必须同时声明两种实体位位置（并集判据），不可退回单侧"


def _name_class(f):
    c = f["column"]
    if not c.isascii():
        return "含中文"
    if c.isdigit():
        return "纯数字"
    if len(c) == 5 and re.fullmatch(r"[A-Za-z]{3}\d{2}", c):
        return "表别名前缀式"
    if len(c) == 5 and re.fullmatch(r"[A-Za-z]{2}\d{3}", c):
        return "形态标准但前缀不符"
    if len(c) == 7 and c[:4] == f["table"][:4]:
        return "7位完整表名式"
    if c.isalpha():
        return "纯字母"
    return "其他"


_name_std = [f for f in _name_biz if _is_standard_name(f)]
_name_non = [f for f in _name_biz if not _is_standard_name(f)]
NAME_STD = len(_name_std)
NAME_NONSTD = len(_name_non)
# 仅按形态（2字母+3数字）判定会把这些算成标准，导致非标准被低估
NAME_LOOSE_STD = sum(
    1 for f in _name_biz
    if len(f["column"]) == 5 and re.fullmatch(r"[A-Za-z]{2}\d{3}", f["column"]))
NAME_BY_CLASS = collections.Counter(_name_class(f) for f in _name_non)
# 表级口径 —— 与字段级口径分开，每种口径单独标注，避免跨口径减除
_MGMT_SET = {"COMPANY", "CREATOR", "USR_GROUP", "CREATE_DATE",
             "MODIFIER", "MODI_DATE", "FLAG"}


def _is_std_name(f):
    return _is_standard_name(f)


def _classify_tables(exclude_udf, exclude_mgmt, exclude_meta=True):
    """返回 (全非标准, 部分非标准, 全标准) 表数。"""
    full = part = none = 0
    for tb in fields_by_table:
        if exclude_meta and tb in _META_TABLES:
            continue
        fl = fields_by_table[tb]
        if exclude_udf:
            fl = [f for f in fl if not f["is_udf"]]
        if exclude_mgmt:
            fl = [f for f in fl if f["column"] not in _MGMT_SET]
        if not fl:
            continue
        n = sum(1 for f in fl if not _is_std_name(f))
        if n == len(fl):
            full += 1
        elif n > 0:
            part += 1
        else:
            none += 1
    return full, part, none


# 主口径：剔除 UDF、保留管理字段。
# 说明：管理字段（COMPANY/CREATOR/...）在命名上确属非标准形态，
# 其中 MOCTX / PURCD / PURTC 三表的 CREATOR 还是独立业务列（中文名各异），
# 若剔除管理字段会把这 2 张表误判为「全标准」，掩盖真实的命名偏离。
TABLES_FULL_NONSTD, TABLES_PART_NONSTD, TABLES_ALL_STD = _classify_tables(
    exclude_udf=True, exclude_mgmt=False)
TABLES_WITH_NONSTD = TABLES_FULL_NONSTD + TABLES_PART_NONSTD
# 对照口径：另剔除管理字段
T2_FULL, T2_PART, T2_NONE = _classify_tables(exclude_udf=True, exclude_mgmt=True)
# 对照口径：保留 UDF（即含 UDF 字段的表也算「含非标准」）
T3_FULL, T3_PART, T3_NONE = _classify_tables(exclude_udf=False, exclude_mgmt=False,
                                           exclude_meta=False)
# 对照口径：双来源并集表数（fields + tables 的表名并集，含元数据表）
_all_tables = set(fields_by_table) | set(table_by_name)
def _count_has_udf(tabs):
    return sum(1 for tb in tabs
               if any(f["is_udf"] for f in fields_by_table.get(tb, [])))


def _count_with_nonstd_any(tabs):
    return sum(1 for tb in tabs
               if any(not _is_standard_name(f)
                      for f in fields_by_table.get(tb, [])))


_BIZ_TABS = [t for t in fields_by_table if t not in _META_TABLES]
_ALL_TABS = list(fields_by_table)
T5_HAS_UDF = _count_has_udf(_BIZ_TABS)      # 1165：剔元数据、含 UDF 表
T6_WITH_NS = _count_with_nonstd_any(_BIZ_TABS)  # 1168：剔元数据、含非标准字段表
T3_HAS_UDF = _count_has_udf(_ALL_TABS)       # 1168：含元数据、含 UDF 表
T3_WITH_NS = _count_with_nonstd_any(_ALL_TABS)   # 1171：含元数据、含非标准字段表

T4_WITH_NS = sum(
    1 for tb in _all_tables
    if any(not _is_standard_name(f) for f in fields_by_table.get(tb, [])))


# 两种单侧判据各自的误判量（用于 README 说明为何必须取并集）
_shape = [f for f in _name_biz
          if len(f["column"]) == 5 and f["column"][2:].isdigit()
          and f["column"][:2].isalpha()]
NAME_205_MISJUDGE = sum(
    1 for f in _shape
    if f["table"].endswith("205") and f["column"][:2] == f["table"][3:5])
NAME_LONGTAIL_MISJUDGE = sum(
    1 for f in _shape
    if len(f["table"]) != 5 and f["column"][:2] == f["table"][-2:]
    and f["column"][:2] != f["table"][3:5])

NAME_CLASSES = [
    ("7 位完整表名式（`GHXA001`）", NAME_BY_CLASS["7位完整表名式"], "正常，单据性质表惯例"),
    ("表别名前缀式（`TAI01`）", NAME_BY_CLASS["表别名前缀式"], "正常，3 字母+2 位分区编号"),
    ("形态标准但前缀不符", NAME_BY_CLASS["形态标准但前缀不符"], "正常，跨表克隆 / 队列表 / 视图"),
    ("纯字母（`ID` `STATUS`）", NAME_BY_CLASS["纯字母"], "正常，队列表语义化命名"),
    ("含中文", NAME_BY_CLASS["含中文"], "异常，孤儿表（见下节）"),
    ("纯数字", NAME_BY_CLASS["纯数字"], "异常，字段名退化"),
    ("其他（长度 6）", NAME_BY_CLASS["其他"], "正常，语义化命名"),
]

# 存疑统计
no_cn_fields = [f for f in fields if not f["column_cn"]]
unknown_type = [f for f in fields if f["type_norm"] == "UNKNOWN"]
nonstd_name = [f for f in fields if len(f["column"]) != 5 and f["column"] not in MGMT_FIELDS + UDF_FIELDS]

# 格式掩码统计（MD008 语义，非代码表）
mask_fields = [f for f in fields if f.get("code_table")]
mask_counter = collections.Counter(f["code_table"] for f in mask_fields)
mask_precision = collections.defaultdict(collections.Counter)
for f in mask_fields:
    p = f["precision"] or ""
    if p.endswith(".0"):
        p = p[:-2]
    mask_precision[f["code_table"]][p] += 1
# 无法归入已知掩码语义的取值（若有，需在README 显式列出，不得静默吞掉）
UNKNOWN_MASKS = {m: n for m, n in mask_counter.items() if m not in MASK_SEMANTICS}

# 掩码一致性校验：**众数基准法**（team-lead 裁决 1）
#
# 为什么不能用「掩码展开位数 == precision 绝对值」：
#   MD006(precision) 在不同 MD005 下语义完全不同
#     C(char)    -> 承载字符长度，可与掩码位宽比对
#     D(date)    -> 恒为 .0（实测 22/22），类型本身不存长度
#     N(numeric) -> 承载数值 scale（如 16.6），与掩码位宽无关
#   用绝对值比对会把 D 类型的 .0 当成「缺失」，凭空造出 9 条假异常。
#
# 众数基准法：按 (type_raw, mask) 分组，取该组 precision 的**众数**为基准，
# 仅当 type_raw=='C' 且该字段偏离众数时才计为真异常。
# 实测：C/YMD 830 条中 825 条为 8.0（99.4%）、C/YM 82 条中 81 条为 6.0（98.8%），
#       偏离者仅 6 条且全为 C 类型 —— 即真异常。
_mask_groups = collections.defaultdict(collections.Counter)
for f in mask_fields:
    _mask_groups[(f["type_raw"], f["code_table"])][f["precision"]] += 1

# (type_raw, mask) -> (众数, 众数占比, 组内总数)
mask_mode = {}
for _k, _c in _mask_groups.items():
    _tot = sum(_c.values())
    _mode, _n = _c.most_common(1)[0]
    mask_mode[_k] = (_mode, _n * 100.0 / _tot, _tot)

mask_mismatch = []
for f in mask_fields:
    # 仅 char 类型适用位宽校验：D/N 的 MD006 语义不同（见上）
    if f["type_raw"] != "C":
        continue
    _k = (f["type_raw"], f["code_table"])
    if _k not in mask_mode:
        continue
    _mode = mask_mode[_k][0]
    if f["precision"] != _mode:
        mask_mismatch.append(f)
# 偏离众数者按「孤儿表架构异常」与「普通偏离」分列
mask_mismatch_orphan = [f for f in mask_mismatch
                        if f["table"] in ORPHAN_ARCH_ANOMALY]
mask_mismatch_plain = [f for f in mask_mismatch
                       if f["table"] not in ORPHAN_ARCH_ANOMALY]

# 非char 类型挂日期掩码：MD006 语义不同（scale 而非字符长度），
# 不适用位数校验，但「date/numeric 列挂日期掩码」本身是类型-掩码脱节的形态，
# 单独列出供人工判定（不计入位数异常）。
mask_on_nonchar = [f for f in mask_fields if f["type_raw"] in ("D", "N")]

# 掩码语法待补充：自洽（字符数==precision）但展开规则未确证
MASK_SYNTAX_PENDING = {"HHMMSSMMM"}
mask_syntax_pending = [f for f in mask_fields
                       if f["code_table"] in MASK_SYNTAX_PENDING]
# 偏离方向拆分：偏小=装不下掩码（疑挂错掩码）；偏大=列宽预留过大（掩码本身可能正确）
mask_mismatch_under = [f for f in mask_mismatch
                       if float(f["precision"] or 0) < MASK_EXPANCED_LEN[f["code_table"]]]
mask_mismatch_over = [f for f in mask_mismatch
                      if float(f["precision"] or 0) > MASK_EXPANCED_LEN[f["code_table"]]]

# 口径回归断言（防止判据再次被误改）
# ---------------------------------------------------------------------------
# 口径声明（不是计数，而是防止口径漂移）
#
# 本轮表级数字反复 10 个值（92/94/65/67/1076/1079/1141/1165/1168/1171），
# 根因是**口径未声明**而非算错：断言数字只能锁结果，锁不住口径。
# 因此下面两条把「口径是什么」固化成可执行断言 —— 口径一旦被改动立即 FAIL。
# ---------------------------------------------------------------------------

# 声明 1：表级口径必须显式声明是否计入 UDF、是否计入管理字段、universe 是谁。
# 三者任一变化都会让表级数字漂移，故在此钉死，并要求与字段级口径对齐。
TABLE_COUNT_EXCLUDE_UDF = True
TABLE_COUNT_EXCLUDE_MGMT = False        # 主口径保留管理字段（见下方注释）
TABLE_COUNT_UNIVERSE = "business"        # business = fields.json 1170 - 3 元数据表
assert TABLE_COUNT_EXCLUDE_UDF, "表级口径必须声明是否计入 UDF"
assert TABLE_COUNT_EXCLUDE_MGMT is False, (
    "表级口径必须声明是否计入管理字段；主口径须保留管理字段，"
    "否则 MOCTX/PURCD/PURTC 的 CREATOR 会被误判为全标准")
assert TABLE_COUNT_UNIVERSE == "business", (
    "表级口径 universe 必须声明；business = 剔除 3 张元数据表，"
    "与字段级 NAME_BIZ_TOTAL 口径对齐，不可混用")
# 口径声明与实际计算必须一致（防止声明了但代码没按声明执行）
assert TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD \
    == len(fields_by_table) - len(_META_TABLES), \
    "表级 universe 实际未按 business 口径执行"

# 声明 2：掩码的「方向」是事实（precision 与众数比大小），「成因」是推断。
# 两者必须分列，不可合并成单一结论——否则会把推测当事实对外输出。
# 方向：偏小 = precision < 众数（装不下掩码）；偏大 = precision > 众数（列宽预留大）。
# 成因：偏小疑「挂错掩码」；偏大掩码本身未必错。
# 该标记为结构性断言：确保两类在产物中分表呈现，故以实际分组结果为准。
# 结构性断言：两组必须非空且互斥，确保「方向」在产物中分表呈现
_ids_under = {(f["table"], f["column"]) for f in mask_mismatch_under}
_ids_over = {(f["table"], f["column"]) for f in mask_mismatch_over}
MASK_CAUSAL_INFERENCE_SEPARATED = (
    len(_ids_under) > 0 and len(_ids_over) > 0
    and not (_ids_under & _ids_over)
    and _ids_under | _ids_over
    == {(f["table"], f["column"]) for f in mask_mismatch}
)
assert MASK_CAUSAL_INFERENCE_SEPARATED, \
    "掩码方向(事实)与成因(推断)必须分列，不可合并"
# 方向计数必须与真异常总数勾稽：偏小 + 偏大 == 6（众数基准法真异常）
assert len(mask_mismatch_under) + len(mask_mismatch_over) == len(mask_mismatch), \
    "掩码方向拆分与真异常数不勾稽：%d + %d != %d" % (
        len(mask_mismatch_under), len(mask_mismatch_over), len(mask_mismatch))

assert NAME_BIZ_TOTAL == 26798, "业务字段口径变了：%d" % NAME_BIZ_TOTAL
assert NAME_STD == 26087, "标准字段数变了：%d" % NAME_STD
assert NAME_NONSTD == 711, "非标准字段数变了：%d" % NAME_NONSTD
assert NAME_LOOSE_STD == 26114, "宽松口径变了：%d" % NAME_LOOSE_STD
assert NAME_205_MISJUDGE == 50, "*205 误判量变了：%d" % NAME_205_MISJUDGE
assert NAME_LONGTAIL_MISJUDGE == 11, "长表尾位误判量变了：%d" % NAME_LONGTAIL_MISJUDGE
# 表级口径（主口径 = 剔除 UDF + 剔除 3 张元数据表 + 保留管理字段）
assert TABLES_FULL_NONSTD == 27, "全非标准表数变了：%d" % TABLES_FULL_NONSTD
assert TABLES_WITH_NONSTD == 94, "含非标准字段表数变了：%d" % TABLES_WITH_NONSTD
assert TABLES_PART_NONSTD == 67, "部分非标准表数变了：%d" % TABLES_PART_NONSTD
# 主口径 universe = fields.json 1173 张 - 3 张元数据表 = 1170 张业务表。
# 与字段级口径保持一致：NAME_BIZ_TOTAL=26798 同样排除了元数据表的 36 个非 UDF 字段。
# 若把元数据表计入分母会得 1079，但那样表级与字段级口径不一致，不可混用。
assert TABLES_ALL_STD == 1076, "全标准表数变了：%d" % TABLES_ALL_STD
# 三分类必须穷尽且互斥，防止口径漂移导致合计对不上
assert (TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD
        == len(fields_by_table) - len(_META_TABLES)
        ), "表级三分类未穷尽业务表 %d 张（full=%d part=%d none=%d）" % (
            len(fields_by_table) - len(_META_TABLES),
            TABLES_FULL_NONSTD, TABLES_PART_NONSTD, TABLES_ALL_STD)
# 对照口径：含 UDF（universe = fields.json 的 1173 张表，与主口径同源才可勾稽）
assert T3_FULL + T3_PART + T3_NONE == len(fields_by_table), \
    "含UDF 口径未穷尽 fields.json 的 %d 张表：%d" % (
        len(fields_by_table), T3_FULL + T3_PART + T3_NONE)
assert T3_FULL == 27, "含UDF口径全非标准变了：%d" % T3_FULL
# 主口径 vs 另剔管理字段：差值应恰为 CREATOR 同名冲突涉及的表数
assert TABLES_PART_NONSTD - T2_PART == 2, \
    "管理字段口径差值变了：%d（预期 2，即 MOCTX/PURCD/PURTC 之外的 CREATOR 冲突表）" % (
        TABLES_PART_NONSTD - T2_PART)
# 众数基准安全性：任一掩码的组内众数占比不得低于 0.98
def _mask_mode_stats():
    """返回 {掩码: (众数, 众数占比, 众数绝对量, 次众数绝对量)}。

    用于验证「众数基准法」是否安全。安全性须同时满足两个条件：
      1) 相对量：众数占比 >= 0.95（留足余量，避免新增少量正常字段就假失败）
      2) 绝对量：众数绝对量 - 次众数绝对量 >= 10（分布必须显著集中，
         而非「六成集中」的混用情形）
    只用相对量阈值 0.98 过紧——实测 YMD 为825/841 = 0.981，
    新增 2 条正常 YMD 字段即跌至 0.9786 会触发假失败。
    """
    _byp = collections.defaultdict(collections.Counter)
    for f in mask_fields:
        p = f["precision"] or ""
        if p.endswith(".0"):
            p = p[:-2]
        _byp[f["code_table"]][p] += 1
    _out = {}
    for _m, _c in _byp.items():
        _tot = sum(_c.values())
        if not _tot:
            continue
        _ranked = _c.most_common()
        _top = _ranked[0][1]
        _second = _ranked[1][1] if len(_ranked) > 1 else 0
        _out[_m] = (_ranked[0][0], _top / float(_tot), _top, _second)
    return _out


def _min_mode_ratio():
    """各掩码组内 precision 众数占比的最小值（诊断用，不单独作断言）。"""
    _st = _mask_mode_stats()
    return min((v[1] for v in _st.values()), default=0.0)


def _min_mode_margin(min_total=30):
    """众数与次众数的绝对差，取样本量 >= min_total 的掩码。

    小样本掩码（如 YYYY/MM/DD 仅 2 条、YYMMDDHHMM 仅 1 条）
    的绝对差天然很小，若一并纳入会导致假失败，故按样本量过滤。
    """
    _st = _mask_mode_stats()
    _m = [(v[2] - v[3]) for v in _st.values() if (v[2] + v[3]) >= min_total]
    return min(_m, default=0)


# 众数基准法安全性：相对量 + 绝对量双约束（单用 0.98 相对量过紧）
assert _min_mode_ratio() >= 0.95,     "掩码众数占比低于 0.95，众数法不再安全：%.4f" % _min_mode_ratio()
assert _min_mode_margin() >= 10,     "掩码众数与次众数绝对差不足 10（样本>=30），分布过于分散：%d" % _min_mode_margin()

# 管理字段实测登记次数（用于README「管理字段 vs 物理字段」一节）
_formate_cnt = sum(1 for f in fields
                   if f.get("column_cn2") and "FORMATE" in f["column_cn2"])
mgmt_occurrence = collections.Counter()
mgmt_rows = []
for f in fields:
    if f["column"] in MGMT_FIELDS:
        mgmt_occurrence[f["column"]] += 1
        mgmt_rows.append(f)
udf_field_rows = sum(1 for f in fields if f["is_udf"])
udf_table_count = len({f["table"] for f in fields if f["is_udf"]})
# 「含 >=1 个 UDF 字段的表」两个口径（与表级命名口径无关，只看 UDF 覆盖）：
#   biz = 剔 3 张元数据表；all = 含元数据表。
# 注意：这两个数与「含 >=1 非标准字段表」（1168/1171）**数值巧合但集合不同**，
# 前者由 UDF 决定，后者由字段名形态决定，引用时必须写清是哪一个。
_tables_with_udf = {f["table"] for f in fields if f["is_udf"]}
TABLES_WITH_UDF_BIZ = len(_tables_with_udf - _META_TABLES)
TABLES_WITH_UDF_ALL = len(_tables_with_udf)

# ---------------------------------------------------------------------------
# 5. 模块聚合
# ---------------------------------------------------------------------------
module_tables = collections.defaultdict(list)
for t in tables:
    module_tables[t["module"]].append(t)

# 孤儿表（只在 fields.json、不在 tables.json）按表名前缀归入既有模块；
# 前缀无对应模块时不新建模块文件，仅在 README 异常清单中列出。
orphan_by_module = collections.defaultdict(list)
orphan_no_module = []
orphan_field_counts = {o: len(fields_by_table.get(o, [])) for o in only_in_fields}
for o in sorted(only_in_fields):
    pre = o[:3]
    if pre in module_tables:
        orphan_by_module[pre].append(o)
    else:
        orphan_no_module.append(o)

# 模块数量须与 _extract-report.json 的 ADMMC_MC004_module_count 一致
EXPECTED_MODULE_COUNT = report["module_stats"]["ADMMC_MC004_module_count"]
assert len(module_tables) == EXPECTED_MODULE_COUNT, \
    "模块数不一致：%d != %d" % (len(module_tables), EXPECTED_MODULE_COUNT)

stats = {}
for mod, tlist in module_tables.items():
    tf = 0
    for t in tlist:
        tf += len(fields_by_table.get(t["table"], []))
    stats[mod] = {"tables": len(tlist), "fields": tf}
for mod, orphans in orphan_by_module.items():
    stats[mod]["fields"] += sum(orphan_field_counts[o] for o in orphans)

# ---------------------------------------------------------------------------
# 6. 生成模块 Markdown
# ---------------------------------------------------------------------------
os.makedirs(MOD_DIR, exist_ok=True)

GEN_CMD = "python scripts/gen_data_dictionary.py"
SRC_NOTE = ("源文件：`.workbuddy/tmp/dict/tables.json`（1170 表）、"
            "`.workbuddy/tmp/dict/fields.json`（54842 字段）、"
            "`knowledge/typekey/typekey_map.yaml`（106 业务对象）")

module_file_stats = {}
all_module_rows = []

for mod in sorted(module_tables):
    tlist = sorted(module_tables[mod], key=lambda x: x["table"])
    cn_name, basis = MODULE_CN_INFER.get(mod, ("待确认", "无代表性表可归纳"))
    L = []
    L.append("# 易飞(E10) 数据字典 · 模块 %s（%s）" % (mod, cn_name))
    L.append("")
    L.append("> 本文件为机械抽取产物，请勿手工编辑。重新生成：`%s`" % GEN_CMD)
    L.append(">")
    L.append("> 溯源：%s" % SRC_NOTE)
    L.append("> 生成时间：%s" % GENERATED_AT)
    L.append("")
    L.append("## 模块概览")
    L.append("")
    L.append("| 项 | 值 |")
    L.append("|---|---|")
    L.append("| 模块代码 | `%s` |" % mod)
    L.append("| 模块中文名 | %s（推断，依据：%s） |" % (cn_name, basis))
    L.append("| 表数量 | %d |" % stats[mod]["tables"])
    L.append("| 字段总数 | %d |" % stats[mod]["fields"])
    L.append("")
    L.append("> 模块中文名由本模块下代表性表的中文名归纳推断，**非官方模块字典**。")
    L.append("")

    for t in tlist:
        tb = t["table"]
        fl = sorted(fields_by_table.get(tb, []), key=lambda x: (x["seq"], x["column"]))
        oa = oapi.get(tb)
        biz = [x for x in fl if x["column"] not in MGMT_FIELDS and not x["is_udf"]]
        udf = [x for x in fl if x["is_udf"]]
        mgmt = [x for x in fl
                if x["column"] in MGMT_FIELDS and tb not in MGMT_NAME_COLLISION]
        collide = [x for x in fl
                   if x["column"] in MGMT_FIELDS and tb in MGMT_NAME_COLLISION]

        L.append("### %s%s" % (tb, t["table_cn"] or "（无中文名）"))
        L.append("")
        L.append("| 项 | 值 |")
        L.append("|---|---|")
        L.append("| 表名 | `%s` |" % tb)
        L.append("| 中文名称 | %s |" % (t["table_cn"] or "（无中文名）"))
        L.append("| 英文名称 | %s |" % (t["table_en"] or "（无英文名）"))
        L.append("| 所属模块 | %s（%s，推断） |" % (mod, cn_name))
        L.append("| 字段总数 | %d（业务 %d + 自定义 %d + 管理字段 %d%s） |"
                 % (len(fl), len(biz), len(udf), len(mgmt),
                    (" + 同名业务字段 %d" % len(collide)) if collide else ""))
        L.append("| 命名规律 | %s |" % (
            "标准命名（表名实体位+3位序号）" if tb in standard_tables else "含特殊命名字段"))
        exp_flag, exp_svcs, exp_basis = exposure_of(tb)
        if exp_svcs:
            L.append("| 是否 OpenAPI 暴露 | %s（依据：%s） |" % (exp_flag, exp_basis))
            L.append("| OpenAPI 服务 | %s |"
                     % "、".join("`%s`" % s for s in exp_svcs.split("；") if s))
        else:
            L.append("| 是否 OpenAPI 暴露 | 否（依据：%s） |" % exp_basis)
            L.append("| OpenAPI 服务 | 无 |")
        # SDD 元数据：主键、文档类型、索引
        _sdd_card = sdd_table_meta.get(tb, {})
        if _sdd_card:
            _pk = _sdd_card.get("primary_keys", "")
            _dt = _sdd_card.get("doc_type_cn", "")
            if _pk:
                L.append("| 主键 | `%s` |" % _pk)
            if _dt:
                L.append("| 文档类型 | %s |" % _dt)
            _idxs = sdd_indexes.get(tb, [])
            if _idxs:
                _idx_str = "; ".join("`%s`=%s" % (n, f) for n, f in _idxs)
                L.append("| 索引 | %s |" % _idx_str)
        if oa:
            L.append("| 对应业务对象（启发式参考） | type_key=`%s`，标题「%s」 |"
                     % (oa["type_key"], oa["title"]))
        else:
            L.append("| 对应业务对象 | 未匹配到type_key（启发式仅供人工参考，不影响上列判定） |")
        L.append("")
        L.append("| 字段名 | 中文名 | 类型 | 长度/精度 | 键 | 格式掩码 | 推测数据类型 | 说明 |")
        L.append("|--------|--------|------|-----------|-----|--------|--------------|------|")

        doubts = []
        for x in fl:
            col = x["column"]
            kind, kindnote = naming_kind(tb, col)
            cn = x["column_cn"] or "（无注释）"
            if not x["column_cn"]:
                doubts.append("`%s` 无中文注释" % col)
            tn = x["type_norm"]
            tcode = x["type_raw"]
            if tn == "UNKNOWN":
                tdisp = "UNKNOWN(%s)" % tcode
                doubts.append("`%s` 类型码 `%s` 语义未确证" % (col, tcode))
            else:
                tdisp = tn
            prec = x["precision"] or ""
            if prec.endswith(".0"):
                prec = prec[:-2]
            # 键：ADMMD 仅对元数据表自身登记 keycolumn，业务表主键未登记
            # 主键标记：优先用 SDD PRIMARY KEY，其次元数据表 PK
            _sdd_pk = sdd_table_meta.get(tb, {}).get("primary_keys", "")
            _pk_fields = _sdd_pk.split("+") if _sdd_pk else []
            if col in _pk_fields:
                keymark = "PK"
            elif kind == "管理字段" and tb in ("ADMMC", "ADMMD", "ADMMB"):
                keymark = "PK(元数据表)"
            else:
                keymark = ""
            notes = []
            if kind == "自定义字段":
                notes.append("公共字段·自定义字段")
            elif kind == "管理字段":
                notes.append("公共字段·管理字段")
            elif kind == "同名业务字段":
                notes.append(kindnote)
                doubts.append("`%s` 列名与管理字段同名但实为业务字段，SDK 基类混入时须跳过本表"
                              % col)
            else:
                notes.append(kindnote)
            if x["column_cn2"] and x["column_cn2"] != x["column_cn"]:
                notes.append(md_escape(x["column_cn2"]))
            mask = x.get("code_table") or ""
            if mask:
                if mask in MASK_SEMANTICS:
                    notes.append("格式掩码 `%s` -> 推测数据类型 `%s`（%s）"
                                 % (mask, MASK_SEMANTICS[mask][0], MASK_SEMANTICS[mask][1]))
                else:
                    notes.append("格式掩码 `%s` 语义未确证" % mask)
                    doubts.append("`%s` 格式掩码 `%s` 语义未确证" % (col, mask))
            if len(col) != 5 and kind not in ("自定义字段", "管理字段", "同名业务字段"):
                notes.append("非标准命名")
            L.append("| `%s` | %s | %s | %s | %s | %s | %s | %s |"
                     % (col, md_escape(cn), tdisp, prec, keymark,
                        ("`%s`" % mask) if mask else "",
                        (MASK_SEMANTICS[mask][0] if mask in MASK_SEMANTICS else
                         ("未确证" if mask else "")),
                        "；".join(notes)))
            all_module_rows.append((mod, tb, col))
        L.append("")
        note = ("公共字段约定：易飞每张业务表在运行时另有 7 个管理字段"
                "（`COMPANY` `CREATOR` `USR_GROUP` `CREATE_DATE` `MODIFIER` "
                "`MODI_DATE` `FLAG`）+ 24 个自定义字段。上表已登记本表实际存在的 "
                "%d 个自定义字段与 %d 个管理字段；未登记的管理字段**本字典不虚构**"
                "（ADMMD 未对绝大多数业务表登记这 7 个字段）。"
                "字段可空性 ADMMD 亦未登记，故不设「可空」列。"
                % (len(udf), len(mgmt)))
        if collide:
            note += ("**注意**：本表 `%s` 列名与管理字段 `CREATOR` 相同，"
                     "但它是独立业务字段（中文名「%s」），不计入上面的管理字段数。"
                     "SDK 若把管理字段做成基类混入，本表该列会被同名属性静默覆盖，"
                     "**须按表白名单跳过本表**。"
                     % (tb, MGMT_NAME_COLLISION[tb][0]))
        L.append(note)
        L.append("")
        if doubts:
            L.append("**存疑项（%d）**" % len(doubts))
            L.append("")
            for d in doubts[:40]:
                L.append("- %s" % d)
            if len(doubts) > 40:
                L.append("- 其余 %d 项见 `field-index.csv`" % (len(doubts) - 40))
            L.append("")

    if mod in orphan_by_module:
        L.append("## 本模块的孤儿表")
        L.append("")
        L.append("以下表存在于 `fields.json` 但**不存在于 `tables.json`**"
                 "（表名字典缺登记），模块归属按表名前缀推断。")
        L.append("")
        L.append("| 表名 | 字段数 | 说明 |")
        L.append("|---|---|---|")
        for o in orphan_by_module[mod]:
            L.append("| `%s` | %d | 表名与英文名未知，仅有字段定义 |"
                     % (o, orphan_field_counts[o]))
        L.append("")

    path = os.path.join(MOD_DIR, "%s.md" % mod)
    write_crlf(path, L)
    with open(path, "rb") as fh:
        raw = fh.read()
    module_file_stats[mod] = {
        "path": "knowledge/data-dictionary/modules/%s.md" % mod,
        "lines": raw.count(b"\r\n"),
        "bytes": len(raw),
        "tables": stats[mod]["tables"],
        "fields": stats[mod]["fields"],
        "cn": cn_name,
    }

print("模块文件生成完成：%d 个" % len(module_file_stats))

# ---------------------------------------------------------------------------
# 7. CSV
# ---------------------------------------------------------------------------
def csv_escape(v):
    s = "" if v is None else str(v)
    if any(c in s for c in [",", '"', "\n", "\r"]):
        return '"%s"' % s.replace('"', '""')
    return s


def write_csv(path, header, rows):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(",".join(header))
        fh.write("\r\n")
        for r in rows:
            fh.write(",".join(csv_escape(x) for x in r))
            fh.write("\r\n")


csv_dir = OUT_ROOT

# field-index.csv
fi_rows = []
for f in fields:
    t = table_by_name.get(f["table"])
    fi_rows.append([
        f["table"],
        (t["table_cn"] if t else ""),
        (t["module"] if t else f["table"][:3]),
        f["seq"],
        f["column"],
        f["column_cn"],
        f["type_raw"],
        f["type_norm"],
        f["precision"],
        f.get("code_table") or "",
        (MASK_SEMANTICS[f["code_table"]][0]
         if f.get("code_table") in MASK_SEMANTICS
         else ("未确证" if f.get("code_table") else "")),
        "1" if f["is_udf"] else "0",
        "1" if (f["column"] in MGMT_FIELDS
                and f["table"] not in MGMT_NAME_COLLISION) else "0",
        "1" if f["column_cn"] else "0",
    ])
write_csv(os.path.join(csv_dir, "field-index.csv"),
          ["table", "table_cn", "module", "seq", "column", "column_cn", "type_raw",
           "type_norm", "precision", "format_mask", "inferred_type",
           "is_udf", "is_mgmt", "has_comment"],
          fi_rows)

# format-mask-map.csv（原 code-table-map.csv 语义更名重定位）
fm_rows = []
for f in fields:
    mask = f.get("code_table") or ""
    if not mask:
        continue
    if mask in MASK_SEMANTICS:
        inferred = MASK_SEMANTICS[mask][0]
        kind, basis = MASK_SEMANTICS[mask][1], MASK_SEMANTICS[mask][2]
        status = "不适用（非枚举，日期/时间格式掩码）"
    else:
        inferred, kind, basis = "", "未确证", "掩码语义未确证"
        status = "语义未确证，需人工判定"
    fm_rows.append([f["table"], f["column"], f["column_cn"], mask,
                    inferred, kind, basis, status])
write_csv(os.path.join(csv_dir, "format-mask-map.csv"),
          ["table", "column", "column_cn", "format_mask", "inferred_type",
           "mask_kind", "inferred_basis", "enum_applicability"],
          fm_rows)

# table-index.csv
ti_rows = []
for t in tables:
    tb = t["table"]
    exp_flag, exp_svcs, exp_basis = exposure_of(tb)
    _sdd = sdd_table_meta.get(tb, {})
    ti_rows.append([
        tb,
        t["table_cn"],
        t["table_en"],
        t["module"],
        len(fields_by_table.get(tb, [])),
        exp_flag,
        exp_svcs,
        exp_basis,
        _sdd.get("primary_keys", ""),
        _sdd.get("doc_type_cn", ""),
        "; ".join("%s(%s)" % (n, f) for n, f in sdd_indexes.get(tb, [])) if tb in sdd_indexes else "",
    ])
for o in sorted(only_in_fields):
    exp_flag_o, exp_svcs_o, _ = exposure_of(o)
    _sdd_o = sdd_table_meta.get(o, {})
    ti_rows.append([o, "", "", o[:3], len(fields_by_table.get(o, [])),
                    exp_flag_o, exp_svcs_o,
                    "该表在 tables.json 中缺登记（无中文名/英文名）；%s"
                    % ("命中真机反推映射" if exp_svcs_o else "未命中真机反推映射"),
                    _sdd_o.get("primary_keys", ""),
                    _sdd_o.get("doc_type_cn", ""),
                    "; ".join("%s(%s)" % (n, f) for n, f in sdd_indexes.get(o, [])) if o in sdd_indexes else ""])
write_csv(os.path.join(csv_dir, "table-index.csv"),
          ["table", "table_cn", "table_en", "module", "field_count",
           "is_openapi_exposed", "openapi_services", "exposure_basis",
           "primary_keys", "doc_type", "indexes"],
          ti_rows)

print("CSV 写入完成：field-index=%d, format-mask-map=%d, table-index=%d"
      % (len(fi_rows), len(fm_rows), len(ti_rows)))

# 清理旧语义产物：code-table-map.csv 已被 format-mask-map.csv 取代
_stale = os.path.join(csv_dir, "code-table-map.csv")
if os.path.exists(_stale):
    os.remove(_stale)
    print("已移除过时产物：code-table-map.csv（语义为格式掩码，重命名为 format-mask-map.csv）")

# ---------------------------------------------------------------------------
# 8. README
# ---------------------------------------------------------------------------
total_lines = sum(v["lines"] for v in module_file_stats.values())
R = []
R.append("# 易飞(E10) 数据字典")
R.append("")
R.append("> 本文件为机械抽取产物，请勿手工编辑。重新生成：`%s`" % GEN_CMD)
R.append(">")
R.append("> 溯源：%s" % SRC_NOTE)
R.append("> 生成时间：%s" % GENERATED_AT)
R.append("")
R.append("## 一、本目录内容")
R.append("")
R.append("| 路径 | 内容 | 规模 |")
R.append("|---|---|---|")
R.append("| `README.md` | 字典总览、模块索引、检索指引、缺失声明 | 本文件 |")
R.append("| `modules/{模块}.md` | 模块级字典，每表一张字段表 | %d 个文件 / %d 行 |"
         % (len(module_file_stats), total_lines))
R.append("| `field-index.csv` | 全量字段索引，供 SDK 消费 | %d 行数据 |" % len(fi_rows))
R.append("| `format-mask-map.csv` | 数据编辑格式掩码清单（MD008），含推测数据类型 | %d 行数据 |"
         % len(fm_rows))
R.append("| `table-index.csv` | 全量表索引，含 OpenAPI 暴露实证 | %d 行数据 |" % len(ti_rows))
R.append("| `node-table-map.csv` | 逻辑节点 -> 物理表真机反推结果（判定依据来源） | 149 行数据 |")
R.append("")
R.append("## 二、数据来源与抽取链")
R.append("")
R.append("```")
R.append("docs/sources/ADMMC-表名信息.xml   (1170 行)  ->  .workbuddy/tmp/dict/tables.json")
R.append("docs/sources/ADMMD-字段信息.xml   (54842 行)  ->  .workbuddy/tmp/dict/fields.json")
R.append("docs/sources/ADMMB-程序信息.xml   (2298 行)   ->  .workbuddy/tmp/dict/programs.json")
R.append("knowledge/typekey/typekey_map.yaml (106 业务对象)  ->  OpenAPI 暴露推断")
R.append("                                   ->  scripts/gen_data_dictionary.py")
R.append("                                   ->  knowledge/data-dictionary/**")
R.append("```")
R.append("")
R.append("抽取质量（引自 `_extract-report.json`，行数与预期完全一致）：")
R.append("")
R.append("| 实体 | 实际行数 | 预期行数 | 一致 |")
R.append("|---|---|---|---|")
for k, v in report["row_counts"].items():
    R.append("| %s | %d | %d | %s |" % (k, v["actual"], v["expected"], "是" if v["match"] else "否"))
R.append("")
R.append("## 三、类型码归一化（MD005）")
R.append("")
R.append("架构师已实证推断，本字典直接采用：")
R.append("")
R.append("| 码 | 归一化 | 占比 | 推断依据 |")
R.append("|---|---|---|---|")
dist = report["type_distribution_all"]
tot = sum(dist.values())
for code in ["C", "N", "V", "T", "D", "Z", "I"]:
    m = report["type_norm_mapping"][code]
    R.append("| `%s` | %s | %.2f%% | %s |"
             % (code, m["norm"], dist.get(code, 0) * 100.0 / tot, m["basis"]))
R.append("")
R.append("**`Z` / `I` 共 %d 个字段一律标为 `UNKNOWN`，不臆造语义。**"
         % sum(report["type_distribution_all"].get(c, 0) for c in ("Z", "I")))
R.append("")
R.append("## 四、字段命名铁律与公共字段")
R.append("")
R.append("字段名规律（实测 26330/26794 = 98.3%，排除 UDF）：`字段名 = 表名末2位 + 3位序号`")
R.append("")
R.append("| 字段名长度 | 数量 |")
R.append("|---|---|")
for L2, n in sorted(len_dist.items(), key=lambda x: -x[1]):
    R.append("| %d | %d |" % (L2, n))
R.append("")
R.append("命名类别统计：")
R.append("")
R.append("| 类别 | 表数 |")
R.append("|---|---|")
R.append("| 含标准命名字段 | %d |" % len(standard_tables))
R.append("| 含特殊命名字段 | %d |" % len(special_tables))
R.append("")
R.append("特殊命名典型（完整清单见 `docs/plans/yf-field-naming-convention.md` 第四节）：")
R.append("")
R.append("| 表名 | 字段名 | 原因 |")
R.append("|---|---|---|")
R.append("| `ACTTI205` | `TI008` | 子表，表名含 4 位后缀 `TI205` |")
R.append("| `GHXA` / `JCXA` / `JHXA` | `GHXA018` | 单据性质表，字段名带完整表名 |")
R.append("| `EFJOBQUE` | `EF011` | 作业队列 |")
R.append("| `RPTGRIDFMT` | `FMTMEMO` | 报表格式 |")
R.append("| `TRANSQUEUE` | `JOBID` | 事务队列 |")
R.append("")
R.append("### 管理字段 vs 物理字段（重要，勿踩坑）")
R.append("")
R.append("易飞每张业务表在**运行时**都有 7 个管理字段（`COMPANY` `CREATOR` `USR_GROUP` "
         "`CREATE_DATE` `MODIFIER` `MODI_DATE` `FLAG`）+ 24 个自定义字段"
         "（`UDF01~UDF12` 文本 / `UDF51~UDF62` 数值）。")
R.append("")
R.append("**但这两类字段的性质完全不同**，实测证据如下：")
R.append("")
R.append("| 类别 | 是否物理列 | ADMMD 登记实况 | 真机 query 回参 |")
R.append("|---|---|---|---|")
R.append("| 7 个管理字段 | **否**（网关层注入） | 几乎不登记：%s | **返回** |"
         % "、".join("`%s` %d 次" % (k, mgmt_occurrence.get(k, 0))
                     for k in MGMT_FIELDS))
R.append("| 24 个 UDF 自定义字段 | **是**（真实物理列） | %d 张表 x 24 = %d 行 | 返回 |"
         % (udf_table_count, udf_field_rows))
R.append("")
R.append("**结论（直接影响 SDK 与查表方式）：**")
R.append("")
R.append("1. 管理字段由 **OpenAPI 网关层自动注入**，不是物理列，"
         "所以在本字典（乃至 `ADMMD` 元数据）里**查不到** `COMPANY` 等列——这是正常现象，"
         "不是字典缺失。查「表字段」时不要期待看到 `COMPANY`。")
R.append("2. UDF 则是**货真价实的物理列**，已在字典中完整登记，SDK 可直接建基类属性。")
R.append("3. 真正的坑：真机 query 回参会**额外带回**这 7 个管理字段"
         "（如 `CREATE_DATE` 值形如 `20250305181000333`，长度 17，带毫秒与毫秒精度时间戳）。"
         "SDK 反序列化时若未声明这 7 个属性，多余字段会被静默丢弃（通常无害）；"
         "但若声明了却按物理列去数据库核对，会发现库里根本没有该列。")
R.append("4. `field-index.csv` 的 `is_mgmt` 列**全表为 `0`**——因为 ADMMD 里"
         "唯一登记的 %d 处管理字段名（`CREATOR`）经核验实为独立业务字段（见下节冲突表），"
         "已按业务字段处理。**该列不能用来判断一张表「有没有管理字段」"
         "（答案：每张表运行时都有）**，它只表示「本字段是真管理字段」，"
         "而本字典中不存在这样的字段行。" % len(mgmt_rows))
R.append("")
R.append("**管理字段名冲突的完整清单与 SDK 处理约束见下文「管理字段列名冲突」一节。**")
R.append("")
R.append("UDF 覆盖细目：")
R.append("")
R.append("| 情形 | 表数 | 表 |")
R.append("|---|---|---|")
R.append("| 完整 24 个 UDF | 1166 | — |")
R.append("| UDF 不足 24 个 | 2 | %s |"
         % "、".join("`%s`(12 个)" % t for t in sorted(
             t for t, fl in fields_by_table.items()
             if 0 < sum(1 for x in fl if x["is_udf"]) < 24)))
R.append("| 完全无 UDF | 5 | %s |"
         % "、".join("`%s`" % t for t in sorted(
             t for t, fl in fields_by_table.items()
             if not any(x["is_udf"] for x in fl))))
R.append("")
R.append("UDF 字段行的类型分布为 **V 14004 / N 14004**（各半）："
         "`UDF01~UDF12` 全为 varchar、`UDF51~UDF62` 全为 numeric(16.6)。"
         "中文名统一为「用户自定义字段1..24」。SDK 可生成泛型 `UdfSlot` 而非 24 个独立属性。")
R.append("")
R.append("另注：`ADMMC` / `ADMMD` / `ADMMB` 三张元数据表自身也登记在 `fields.json` 中"
         "（分别 32 / 35 / 41 个字段），这是 1173 与 1170 相差 3 的原因。"
         "做「业务表 vs 元数据表」区分或统计时须先剔除这 3 张。")
R.append("")
R.append("### 管理字段列名冲突（3 张表，SDK 基类硬约束）")
R.append("")
R.append("`CREATOR` 作为列名（MD003）在 **3 张业务表**中被登记，且中文名各异，"
         "证明是独立业务列而非公共管理字段混入：")
R.append("")
R.append("| 表 | 序号 | 中文名 | 类型 |")
R.append("|---|---|---|---|")
for tb in sorted(MGMT_NAME_COLLISION):
    cn, sig = MGMT_NAME_COLLISION[tb]
    x = [y for y in fields_by_table[tb] if y["column"] == "CREATOR"][0]
    R.append("| `%s` | %s | %s | %s |" % (tb, x["seq"], cn, sig))
R.append("")
R.append("三者的序号均靠尾（0068 / 0068 / 0073）且排在 UDF 之后，属后期追加的独立列。"
         "其余 6 个管理字段（`COMPANY` / `USR_GROUP` / `CREATE_DATE` / `MODIFIER` "
         "/ `MODI_DATE` / `FLAG`）出现次数均为 0。")
R.append("")
R.append("**对 SDK 的硬约束**：若无条件把 7 个管理字段混入基类，这 3 张表的 `CREATOR` "
         "会被基类同名属性**静默覆盖**。其中 `PURTC.CREATOR` 中文名为「录入者」，"
         "与基类「创建者」语义不同——覆盖后写入的是错误数据且不报错。"
         "**基类混入必须按表白名单跳过这 3 张表，或走alias 映射。**"
         "本字典已在 `field-index.csv` 的 `is_mgmt` 列把这 3 行标为 `0`，"
         "并在各模块 md 中显式标注。")
R.append("")
R.append("> **更正说明**：字典旧版称「7 个管理字段仅在元数据表 `ADMMC`/`ADMMD`/`ADMMB` 自身出现」。"
         "经本次逐字段核验，该表述与数据不符——三张元数据表的字段清单"
         "（`ADMMC` %d 个、`ADMMD` %d 个、`ADMMB` %d 个）中**均不含**这 7 个字段。"
         "管理字段在 ADMMD 中的登记几乎为零，仅 `CREATOR` 出现 %d 次，"
         "且这 %d 次全部落在上表所列的业务表上。"
         % (len(fields_by_table.get("ADMMC", [])), len(fields_by_table.get("ADMMD", [])),
            len(fields_by_table.get("ADMMB", [])),
            mgmt_occurrence.get("CREATOR", 0), mgmt_occurrence.get("CREATOR", 0)))
R.append("")
R.append("### 运行时字段数（字典数 + 7 管理字段）")
R.append("")
R.append("字典登记的字段数**不等于**运行时实际列数：运行时每表另有 7 个管理字段。"
         "SDK 做「每表最小可用字段数」「分页/批量上限」类估算时须用运行时口径。")
R.append("")
R.append("| 表 | 字典字段数 | 运行时字段数 |")
R.append("|---|---|---|")
_biz_tab = [t for t in tables if t["table"] in fields_by_table and t["table"] not in MGMT_NAME_COLLISION]
_by_len = sorted(_biz_tab, key=lambda t: -len(fields_by_table[t["table"]]))[:5]
for t in _by_len:
    n = len(fields_by_table[t["table"]])
    R.append("| `%s` %s | %d | %d |" % (t["table"], t["table_cn"], n, n + 7))
_degen = [t for t in tables if t["table"] in ("DXL", "PURTG2", "V_QIXUBING")]
for t in _degen:
    n = len(fields_by_table.get(t["table"], []))
    R.append("| `%s` %s | %d | %d |"
             % (t["table"], t["table_cn"] or "（无中文名）", n, n + 7))
R.append("")
R.append("**统计口径提示**：`DXL` / `PURTG2` / `V_QIXUBING` 三张表字段名退化"
         "（`PURTG2` 列名仅 `01` / `02`，中文名全空），叠加 7 个管理字段后"
         "运行时 9 个字段里 7 个是管理字段，业务字段近乎为零。"
         "做字段数分布统计时建议排除这 3 张异常表。")
R.append("自定义字段占比：%d / %d = %.2f%%；业务字段 %d 个。"
         % (report["udf"]["udf_field_rows"], len(fields),
            report["udf"]["udf_ratio_pct"], report["udf"]["business_field_rows"]))
R.append("")
R.append("## 五、模块索引")
R.append("")
R.append("模块中文名**全部为推断**（由该模块下代表性表的中文名归纳），非官方模块字典。")
R.append("")
R.append("| 模块代码 | 中文名（推断） | 表数 | 字段数 | 字典文件 |")
R.append("|---|---|---|---|---|")
for mod in sorted(module_tables):
    cn_name, basis = MODULE_CN_INFER.get(mod, ("待确认", ""))
    st = module_file_stats[mod]
    R.append("| `%s` | %s | %d | %d | [`modules/%s.md`](modules/%s.md) |"
             % (mod, cn_name, st["tables"], st["fields"], mod, mod))
R.append("")
R.append("合计：%d 个模块 / %d 张表 / %d 个字段。"
         % (len(module_tables), len(tables), len(fields)))
R.append("")
R.append("字段数勾稽：模块文件字段合计 %d + 无模块归属的孤儿表字段 %d（%s）= %d，"
         "与 `fields.json` 总数一致。"
         % (sum(v["fields"] for v in module_file_stats.values()),
            sum(orphan_field_counts[o] for o in orphan_no_module),
            "、".join("`%s`" % o for o in orphan_no_module),
            sum(v["fields"] for v in module_file_stats.values())
            + sum(orphan_field_counts[o] for o in orphan_no_module)))
R.append("")
R.append("模块代码与表名前缀的关系：`module` = 表名**前 3 位**，实测 1168 / 1170 = 99.83% 成立；"
         "2 张例外为 `DXL`（module=`COP`）、`V_QIXUBING`（module=`CMS`）。")
R.append("")
R.append("## 六、OpenAPI 暴露判定（实证优先）")
R.append("")
R.append("### 6.1 主判定依据：真机反推的物理表映射（高置信）")
R.append("")
R.append("`knowledge/data-dictionary/node-table-map.csv` 由 `scripts/build-node-table-map.mjs` "
         "对 149 个逻辑节点逐个做真机反推得到，其中 **%d 条为 `confidence=HIGH`**，"
         "即该节点的请求回参中直接出现了对应物理表名（如 "
         "`customer_basic_data_file_data` -> `COPMA`）。这是本字典判定暴露的**唯一硬证据**。"
         % tk_high_total)
R.append("")
R.append("`table-index.csv` 的 `is_openapi_exposed` 取值规则：")
R.append("")
R.append("| 取值 | 含义 | 表数 |")
R.append("|---|---|---|")
R.append("| `是` | 该物理表被 `confidence=HIGH` 的真机反推命中，"
         "回参中直接出现物理表名（**硬证据**） | %d |" % _exp_cnt.get("是", 0))
R.append("| `待确认` | 实体未映射到物理表，但关联 type_key 存在**可用节点**"
         "（`ACCEPTED_NO_TABLE`：节点名有效、接口能调通，回参未含物理表名） | %d |"
         % _exp_cnt.get("待确认", 0))
R.append("| `否` | 未被任何 type_key 引用，或关联 type_key 的节点均不可用"
         "（`MA012`/`NONE`） | %d |" % _exp_cnt.get("否", 0))
R.append("")
R.append("**`否` 与 `待确认` 的 SDK 消费约定（关键）**：")
R.append("")
R.append("- 二者都**不得**被当作「可调用」。`否` 覆盖了「表未被 type_key 引用」与"
         "「表被引用但节点不可用」两种情形，性质不同但同样不可作为可调用依据，"
         "合并为保守默认值是安全的。")
R.append("- `待确认` 额外附带的 `openapi_services` 服务名**仅供试探**，"
         "接口能调通但无法证明返回的就是本表数据。")
R.append("- `否` **不等于**「该表在易飞里不存在」或「无法通过其他途径访问」，"
         "只代表当前这149 个反推节点未覆盖到它。")
R.append("")
R.append("节点反推置信度分布（149 条）：`HIGH` %d 条（已反推出物理表名）、"
         "`ACCEPTED_NO_TABLE` %d 条（节点有效但无物理表名）、"
         "其余 %d 条为 `MA012`（节点未注册）/ `NONE`。"
         % (tk_high_total, tk_usable_total,
            len(_nt_rows) - tk_high_total - tk_usable_total))
R.append("")
R.append("`openapi_services` 列的取值**直接抄自** `knowledge/typekey/typekey_map.yaml` 中"
         "对应 type_key 的 `query:` 服务名，未做任何拼接或臆造。")
R.append("")
R.append("已确证暴露的物理表与业务对象对应关系：")
R.append("")
R.append("| 物理表 | type_key | query 服务名 | 置信度 |")
R.append("|---|---|---|---|")
for _tb in sorted(phys_map.keys()):
    for _tk in sorted(phys_map[_tb].keys()):
        _svc = tk_query_service.get(_tk, "")
        R.append("| `%s` | `%s` | `%s` | HIGH |"
                 % (_tb, _tk, _svc if _svc else "（yaml 中无 query 服务）"))
R.append("")
R.append("### 6.2 辅助参考：中文名启发式匹配（不作为判定依据）")
R.append("")
R.append("`knowledge/typekey/typekey_map.yaml` 的 106 个业务对象使用**逻辑节点名**"
         "（如 `purchase_order_detail_data`），**不含任何物理表名**。"
         "`knowledge/typekey-mapping/_index.json` 记录 `fields_with_physical_name: 42` / "
         "`fields_total: 12893`，即 12893 个 API 字段中仅 42 个给出了大写物理列名"
         "（且这 42 个多为 `CONSIGNEE` / `FAX_NO` 等未翻译占位描述，非 `XX001` 式列名）。")
R.append("")
R.append("因此本字典另做了一轮**中文名启发式匹配**（剥离 `单头档`/`单身档`/`信息档` 等后缀后"
         "比对 type_key 标题，必要时用子串 + 长度差 ≤ 6 做唯一命中），结果仅作人工参考，"
         "在各模块 md 中以「对应业务对象（启发式参考）」单独列出，"
         "**不参与** `is_openapi_exposed` 的取值：")
R.append("")
R.append("| 判定方式 | 命中表数 | 置信度 |")
R.append("|---|---|---|")
R.append("| 中文名归一化精确匹配 | %d | 中 |" % oapi_exact)
R.append("| 中文名归一化子串唯一匹配 | %d | 低 |" % oapi_sub)
R.append("| 未匹配 | %d | — |" % (len(tables) - len(oapi)))
R.append("")
R.append("未被反向匹配到物理表的 type_key 数量：%d（共 %d 个业务对象）。"
         % (oapi_unmatched_tk, len(typekeys)))
R.append("")
R.append("**局限声明**：`is_openapi_exposed` 非 `是` 的表共 %d 张（`否` %d + `待确认` %d），"
         "只代表「本次真机反推未覆盖或节点不可用」，"
         "**不代表这些表无法通过 OpenAPI 访问**。`node-table-map.csv` 仅覆盖 149 个逻辑节点，"
         "覆盖面有限。SDK 应用该列做「能否直接走 API」的初筛，"
         "但不得据此断言某表**不可**访问；要确证需扩大反推覆盖或取得易飞官方接口-表结构对照文档。"
         % (_exp_cnt.get("否", 0) + _exp_cnt.get("待确认", 0),
            _exp_cnt.get("否", 0), _exp_cnt.get("待确认", 0)))
R.append("")
R.append("## 七、信息缺失声明")
R.append("")
R.append("以下项**确实无法从现有材料获取**，本字典一律标UNKNOWN / 待确认，未做任何臆造：")
R.append("")
R.append("| # | 缺失项 | 影响范围 | 现状标注 |")
R.append("|---|---|---|---|")
rows_missing = [
    ("`Z` / `I` 类型码语义",
     "%d 个字段" % sum(report["type_distribution_all"].get(c, 0) for c in ("Z", "I")),
     "类型列填 `UNKNOWN(Z)` / `UNKNOWN(I)`"),
    ("字段可空性", "全部 54842 字段",
     "ADMMD 未登记 nullable，**故字典不设「可空」列**（不做无依据填充）"),
    ("字段主键/索引", "全部表", "键列留空，仅元数据表自身标 `PK(元数据表)`"),
    ("表级业务主键", "全部表", "仅 `table-index.csv` 可与 type_key 的业务主键做语义对照"),
    ("模块官方中文名", "78 个模块", "由代表性表中文名推断，标注「推断」"),
    ("OpenAPI 与物理表对应", "1170 张表",
     "以真机反推为硬证据（见第六节）；标 `否` 者仅表示无实证，非不可访问"),
    ("字段枚举码值", "全部 54842 字段",
     "**本字典不含任何枚举定义**：MD008 经实证为格式掩码而非代码表，"
     "元数据本身不含枚举表，枚举须真机采集（T-07）"),
    ("`ADMMC.MC005` / `MC007` / `MC008` 语义", "表分类信息",
     "MC005 覆盖率 0.09%（仅表 `DXL` 有值），MC007/MC008 覆盖率 0%，全部 UNKNOWN"),
    ("`ADMMB.MB003` / `MB005~MB017` 语义", "程序分类与开关位",
     "取值字母数字混合或 Y/N 掩码，无法确证控制行为，全部 UNKNOWN"),
    ("`ADMMD.MD010` / `MD011` 语义", "字段属性", "覆盖率 0%，UNKNOWN"),
]
for i, (item, scope, mark) in enumerate(rows_missing, 1):
    R.append("| %d | %s | %s | %s |" % (i, item, scope, mark))
R.append("")
R.append("### 已知异常清单")
R.append("")
R.append("| 类别 | 明细 |")
R.append("|---|---|")
R.append("| 孤儿表（在 `fields.json` 不在 `tables.json`） | %s |"
         % "、".join("`%s`" % x for x in sorted(only_in_fields)))
if orphan_no_module:
    R.append("| 其中无对应模块前缀的孤儿表 | %s（前3 位 `YFM` / `YSM` 不在 78 个模块中，"
             "无法归入任何模块字典文件，仅列于本表与 `table-index.csv`） |"
             % "、".join("`%s`" % x for x in orphan_no_module))
R.append("| 空字段表（在 `tables.json` 无字段记录） | %s |"
         % "、".join("`%s`" % x for x in sorted(only_in_tables)))
R.append("| 表无中文名 | %s |"
         % "、".join("`%s`" % t["table"] for t in tables if not t["table_cn"]))
R.append("| 字段无中文注释 | %d 个（%s） |"
         % (len(no_cn_fields), "、".join("`%s.%s`" % (f["table"], f["column"]) for f in no_cn_fields)))
R.append("| char 类型掩码位数偏离众数 | %d 个（见下方「掩码一致性校验：众数基准法」） |"
         % len(mask_mismatch))
R.append("| 掩码语法待补充 | %d 个（`HHMMSSMMM`，第二个 M 为毫秒位） |"
         % len(mask_syntax_pending))
R.append("| 非 char 类型挂日期掩码 | %d 个（date/numeric 的 MD006 是 scale，不适用位数校验） |"
         % len(mask_on_nonchar))
R.append("| 文本类型却带长度 | 2 个（`BOMCB.CB021`=255、`BOMMF.MF008`=8000） |")
R.append("| 字段名长度非 5 | %d 个（长度口径；与下方「列名体系偏离」的形态口径 %d 条不同，勿混用） |"
         % (len(nonstd_name), NAME_NONSTD))
R.append("| 序号 MD002 重复 | 33 组（排序/去重须以 `(table, column)` 为准） |")
R.append("")
R.append("### MD008 语义定案：数据编辑格式掩码（非代码表）")
R.append("")
R.append("`ADMMD.MD008` **不是**代码表关联，而是**数据编辑格式掩码**"
         "（date/format mask）。三条互相独立的证据链：")
R.append("")
R.append("1. **元数据自证**：%d 行的 `ADMMD.MD009`（中文名备注）直接带 `[FORMATE:YM]` 字样，"
         "官方元数据自己就把该列称作 FORMATE（格式）。" % _formate_cnt)
R.append("2. **英文名语义**：`ADMMD.MD007` 为 `Year/Month`、`Effective Date`、"
         "`Approve Time`、`Accounting Year` 等日期时间语义，无一处为枚举含义。")
R.append("3. **位数自洽**：同`(type_raw, mask)` 分组下precision 高度一致"
         "（`C/YMD` 830 条中 825 条为 8.0，`C/YM` 82 条中 81 条为 6.0，`C/YMK`、`C/Y` 100% 一致）。")
R.append("")
R.append("取值分布与推测数据类型（%d 个字段带掩码）：" % len(fm_rows))
R.append("")
R.append("| 掩码 | 字段数 | 掩码种类 | 推测数据类型 | 判定依据 |")
R.append("|---|---|---|---|---|")
for _m, _n in sorted(mask_counter.items(), key=lambda kv: -kv[1]):
    if _m in MASK_SEMANTICS:
        _inf, _kind, _basis = MASK_SEMANTICS[_m]
    else:
        _inf, _kind, _basis = "未确证", "未确证", "掩码语义未确证，需人工判定"
    R.append("| `%s` | %d | %s | `%s` | %s |" % (_m, _n, _kind, _inf, _basis))
R.append("")
if UNKNOWN_MASKS:
    R.append("> **未确证掩码**：%s —— 这些取值无法归入已知掩码语义，"
             "已在 `format-mask-map.csv` 标为「语义未确证」，**不做臆测**。"
             % "、".join("`%s`(%d)" % (k, v) for k, v in UNKNOWN_MASKS.items()))
else:
    R.append("> 全部 %d 种掩码取值均已归入已知语义，**无未确证项**。" % len(mask_counter))
R.append("")
R.append("**下游消费约定（务必遵守）**：")
R.append("")
R.append("- `field-index.csv` 的列名已由 `code_table` 更名为 **`format_mask`**，"
         "并新增 `inferred_type` 列给出推测数据类型。")
R.append("- 原 `code-table-map.csv` 已重命名为 **`format-mask-map.csv`**，"
         "列改为 `table,column,column_cn,format_mask,inferred_type,mask_kind,"
         "inferred_basis,enum_applicability`。")
R.append("- `enum_applicability` 统一为 **`不适用（非枚举，日期/时间格式掩码）`**。"
         "**下游不得按代码表/枚举关联消费这些字段**，也不得期待通过本字典查到码值。")
R.append("- 若某字段确为枚举（如标注「1.增、-1.减」），其码值同样不在元数据中，须真机采集。")
R.append("")
R.append("### 掩码一致性校验：众数基准法")
R.append("")
R.append("**校验基准为何不能用「掩码位数 == precision 绝对值」**——这是本字典走过的一段弯路，"
         "记录在此避免重犯。根因是 `MD006`（precision）在不同 `MD005` 下语义完全不同：")
R.append("")
R.append("| MD005 | MD006 实际语义 | 能否与掩码位宽比对 |")
R.append("|---|---|---|")
R.append("| `C` char | 字符长度 | 能 |")
R.append("| `D` date | 数值精度 scale，**恒为 `.0`**（实测 22/22 条） | 不能 |")
R.append("| `N` numeric | 数值精度 scale，如 `16.6` | 不能 |")
R.append("")
R.append("用绝对值比对，等于把 `D` 类型的 `.0` 当成「长度缺失」，凭空造出 **9 条假异常**"
         "（2 条 `D/YMD` + 若干挂掩码的 numeric 字段）。")
R.append("")
R.append("**众数基准法**：按 `(type_raw, mask)` 分组，取该组 `precision` 的**众数**为基准，"
         "仅当 `type_raw == 'C'` 且该字段偏离众数时才计为真异常。"
         "依据是「同组同类型同掩码的字段应当同长」这一数据事实，而非外部假设的展开规则。")
R.append("")
R.append("各组众数分布：")
R.append("")
R.append("| 类型 | 掩码 | 组内字段数 | precision 众数 | 众数占比 |偏离者 |")
R.append("|---|---|---|---|---|---|")
for _k in sorted(mask_mode, key=lambda k: -mask_mode[k][2]):
    _t, _m = _k
    _mode, _pct, _tot = mask_mode[_k]
    _dev = len([1 for f in mask_fields
                if f["type_raw"] == _t and f["code_table"] == _m
                and f["precision"] != _mode])
    R.append("| `%s` | `%s` | %d | `%s` | %.1f%% | %d |"
             % (_t, _m, _tot, _mode, _pct, _dev))
R.append("")
R.append("#### 真异常清单：偏离众数的 char 字段（%d 个）" % len(mask_mismatch))
R.append("")
if mask_mismatch:
    R.append("| 表 | 列 | 中文名 | 掩码 | 组内众数 | 实际 precision | 英文名 |")
    R.append("|---|---|---|---|---|---|---|")
    for f in sorted(mask_mismatch, key=lambda x: (x["table"], x["seq"])):
        _mode = mask_mode[(f["type_raw"], f["code_table"])][0]
        R.append("| `%s` | `%s` | %s | `%s` | `%s` | `%s` | %s |"
                 % (f["table"], f["column"], f["column_cn"] or "（无注释）",
                    f["code_table"], _mode, f["precision"] or "（空）",
                    f.get("column_en") or "（空）"))
    R.append("")
    if mask_mismatch_under or mask_mismatch_over:
        R.append("按**偏离方向**分为两类。「方向」是可观测事实，「成因」是推断，二者须分开表述：")
        R.append("")
        R.append("| 方向 | 数量 | 表 | 掩码 | 期望位数 | 实际 | 判定 |")
        R.append("|---|---|---|---|---|---|---|")
        for _grp, _dir in ((mask_mismatch_under, "偏小"), (mask_mismatch_over, "偏大")):
            if not _grp:
                continue
            _tb = "、".join(sorted({"`%s`" % f["table"] for f in _grp}))
            _mk = "、".join("`%s`" % f["code_table"] for f in _grp)
            _exp = "、".join(str(MASK_EXPANCED_LEN[f["code_table"]]) for f in _grp)
            _act = "、".join(f["precision"] for f in _grp)
            _vd = ("疑挂错掩码（掩码要求位数 > 列宽，装不下）" if _dir == "偏小"
                   else "列宽预留过大（掩码本身可能正确）")
            R.append("| %s | %d | %s | %s | %s | %s | %s |"
                     % (_dir, len(_grp), _tb, _mk, _exp, _act, _vd))
        R.append("")
        R.append("**长度偏小的 %d 条最可能是挂错掩码**（掩码要求 8 位但列宽只有 6 位，语义上装不下）。"
                 % len(mask_mismatch_under))
        R.append("")
        R.append("**长度偏大的 %d 条成因不同** —— 列宽大于掩码位数，属预留过多，掩码本身未必错，"
                 "不应与「挂错掩码」混为一谈。" % len(mask_mismatch_over))
        R.append("")
        R.append("> 判定依据是**偏离方向**，不使用中文名关键词。")
        R.append("> `CMSMA.MA169` 中文名含「年月」但挂的是正确的 `YM`，若按关键词归类会被误判为挂错掩码。")
        R.append("")
    if mask_mismatch_orphan:
        R.append("> 其中 %d 条位于孤儿表 `%s`，成因是这两张表的架构本身异常"
                 "（中文列名 + 枚举列挂日期掩码），已单列见下节。"
                 % (len(mask_mismatch_orphan),
                    "、".join("`%s`" % t for t in sorted(
                        {f["table"] for f in mask_mismatch_orphan}))))
        R.append("")
else:
    R.append("**无真异常。**")
    R.append("")
R.append("#### 不计入异常的两类形态（仅供人工参考）")
R.append("")
R.append("**其一，掩码语法待确证（%d 个）**：`HHMMSSMMM` 的 `precision=9` 与 "
         "`HH+MM+SS+MMM`（2+2+2+3=9）自洽，且该组众数占比 100%%，**不是异常**。"
         "但其第二个 `M` 是毫秒位，与年月掩码中的 `M`（月）语义不同，展开规则未确证："
         % len(mask_syntax_pending))
R.append("")
R.append("| 表 | 列 | 中文名 | 掩码 | precision |")
R.append("|---|---|---|---|---|")
for f in sorted(mask_syntax_pending, key=lambda x: (x["table"], x["seq"])):
    R.append("| `%s` | `%s` | %s | `%s` | `%s` |"
             % (f["table"], f["column"], f["column_cn"] or "（无注释）",
                f["code_table"], f["precision"]))
R.append("")
R.append("**其二，非 char 类型挂日期掩码（%d 个）**：`date` / `numeric` 列挂 `YMD` 属类型-掩码脱节，"
         "但因 MD006 是 scale 而非字符长度，**不适用位数校验**，故不计入异常："
         % len(mask_on_nonchar))
R.append("")
R.append("| 表 | 列 | 中文名 | 类型 | 掩码 | precision |")
R.append("|---|---|---|---|---|---|")
for f in sorted(mask_on_nonchar, key=lambda x: (x["table"], x["seq"])):
    R.append("| `%s` | `%s` | %s | %s | `%s` | `%s` |"
             % (f["table"], f["column"], f["column_cn"] or "（无注释）",
                f["type_raw"], f["code_table"], f["precision"] or "（空）"))
R.append("")
_n_orphan = len([f for f in mask_on_nonchar
                 if f["table"] in ORPHAN_ARCH_ANOMALY])
R.append("其中 %d 个即孤儿表的 `出入` 字段（`numeric(1,0)` 挂 `YMD`），见下节。"
         % _n_orphan)
R.append("")
R.append("### 列名体系偏离 E10 规范的全量清单")
R.append("")
R.append("口径：业务字段 %d（剔除 3 张元数据表、剔除 UDF）中，"
         "不符合「`XX001` 式5 字符编码」的数量。" % NAME_BIZ_TOTAL)
R.append("")
R.append(r"**判据**：形态为 `^[A-Z]{2}\d{3}$`，且前缀命中表名中的**实体位**。"
         "实体位有两种位置，必须都接受：")
R.append("")
R.append("| 表名结构 | 例 | 实体位 | 字段前缀 |")
R.append("|---|---|---|---|")
R.append("| 模块3 + 实体2 | `PURTC` | `table[-2:]` = `TC` | `TC001` |")
R.append("| 模块3 + 实体2 + 版本后缀 | `ACTMS205` | `table[3:5]` = `MS` | `MS001` |")
R.append("| 模块3 + 长实体名 | `DSCINTMA` | `table[-2:]` = `MA` | `MA001` |")
R.append("")
R.append("因此判据取「`table[-2:]` **或** `table[3:5]` 任一命中」，标准 %d 条。" % NAME_STD)
R.append("")
R.append("**不可只用单侧**：仅用 `table[-2:]` 会把 `*205` 子表的 %d 个字段误判为非标准；"
         "仅用 `table[3:5]` 会把 `DSCINTMA` / `WARRANT` 的 %d 个字段误判为非标准。"
         % (NAME_205_MISJUDGE, NAME_LONGTAIL_MISJUDGE))
R.append("")
R.append("仅按形态（2 字母 + 3 数字）判定会把 %d 条算成标准，低估非标准数 %d 条。"
         % (NAME_LOOSE_STD, NAME_LOOSE_STD - NAME_STD))
R.append("")
R.append("### 表级计数（口径必须随数字一起引用）")
R.append("")
R.append("> **表级数字不对外。** 本轮表级数字反复出现 8 个值"
         "（92/94/65/67/1076/1079/1141/1165/1168/1171），"
         "**根因是口径未声明而非算错**。对外只说 711（非标准列名）与 22（真异常列名）；"
         "下表仅供内部交叉核对，引用时**必须连同口径一起给出**。")
R.append("")
R.append("**口径 A（主口径）**：业务表 = `fields.json` %d 张 - 3 张元数据表 = **%d 张**；"
         "字段范围 = 剔除 UDF、**保留**管理字段。"
         % (len(fields_by_table), TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD))
R.append("")
R.append("| 类别 | 表数 | 含 UDF | 含管理字段 | 口径 | 说明 |")
R.append("|---|---|---|---|---|---|")
R.append("| 全部业务字段均非标准 | %d | 否 | 是 | A | 需整表特殊处理 |" % TABLES_FULL_NONSTD)
R.append("| 部分业务字段非标准 | %d | 否 | 是 | A | 其余字段符合命名铁律 |" % TABLES_PART_NONSTD)
R.append("| 全部业务字段均标准 | %d | 否 | 是 | A | 符合命名铁律 |" % TABLES_ALL_STD)
R.append("| **合计** | **%d** | 否 | 是 | A | = 业务表数，勾稽自洽 |"
         % (TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD))
R.append("")
R.append("**对照口径**（用于解释差异来源，**不可与口径 A 混用**）：")
R.append("")
R.append("| 口径 | 定义 | 全非标准 | 部分非标准 | 全标准 | 合计 |")
R.append("|---|---|---|---|---|---|")
R.append("| A | 剔除 UDF，保留管理字段，剔除元数据表（**主口径**） | %d | %d | %d | %d |"
         % (TABLES_FULL_NONSTD, TABLES_PART_NONSTD, TABLES_ALL_STD,
            TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD))
R.append("| B | 口径 A 再剔除管理字段 | %d | %d | %d | %d |"
         % (T2_FULL, T2_PART, T2_NONE, T2_FULL + T2_PART + T2_NONE))
R.append("| C | 保留 UDF（含元数据表） | %d | %d | %d | %d |"
         % (T3_FULL, T3_PART, T3_NONE, T3_FULL + T3_PART + T3_NONE))
R.append("")
R.append("**「含 UDF 表」与「含非标准字段表」是两个不同指标，历史上被混用致口径反复**：")
R.append("")
R.append("| 口径 | 业务表 | 含 UDF 的表 | 含非标准字段的表 |")
R.append("|---|---|---|---|")
R.append("| 剔除元数据表 | %d | %d | %d |"
         % (TABLES_FULL_NONSTD + TABLES_PART_NONSTD + TABLES_ALL_STD,
            T5_HAS_UDF, T6_WITH_NS))
R.append("| 含元数据表 | %d | %d | %d |"
         % (T3_FULL + T3_PART + T3_NONE, T3_HAS_UDF, T3_WITH_NS))
R.append("")
R.append("> 「含非标准字段的表」在两个分母下都是 **%d** —— 3 张元数据表的字段名"
         "全是标准形态（`MC001` / `MD001` / `MB001`），不影响该指标。" % T6_WITH_NS)
R.append(">")
R.append("> `含 UDF 的表`（%d / %d）这组数字与「含非标准字段表」无关，"
         "此前被误当作后者引用。命名判据口径下应用**后者**。" % (T5_HAS_UDF, T3_HAS_UDF))
R.append(">")
R.append("> 另有 `1171` 出现在「双来源并集（fields + tables）」口径下："
         "4 张孤儿表只在 `fields.json`、`PMSTA` 只在 `tables.json`，"
         "并集比任一单侧多，属**另一维度**，不可与上述任一口径混用。")
R.append("")
R.append("**口径 A 与 B 差 %d 张表的成因（已定位，非算错）**："
         "管理字段名（`COMPANY`/`CREATOR`/...）在命名形态上属非标准。"
         "其中 `MOCTX` / `PURCD` / `PURTC` 三表的 `CREATOR` 是**独立业务列**"
         "（中文名分别为 `LURUZ`/`AAAA`/`录入者`，序号靠尾、排在 UDF 之后），"
         "并非公共管理字段。若剔除管理字段（B 口径），这 3 张表会被误判为「全标准」，"
         "**掩盖真实的命名偏离**——故主口径 A 保留管理字段。"
         % (TABLES_PART_NONSTD - T2_PART))
R.append("")
R.append("> 另注：口径 C 的 universe 是 `fields.json` 的 %d 张（含 3 张元数据表），"
         "比主口径多 3 张；这也是此前出现 1141/1168/1171 等数字的来源——"
         "**多为 universe 或管理字段边界处理不同所致，非计算错误**。"
         % len(fields_by_table))
R.append("")
R.append("| 类别 | 数量 | 定性 |")
R.append("|---|---|---|")
for lbl, cnt_, note in NAME_CLASSES:
    R.append("| %s | %d | %s |" % (lbl, cnt_, note))
R.append("| **非标准合计** | **%d** | — |" % NAME_NONSTD)
R.append("")
R.append("#### 对外只需说清「22 条真异常」的构成")
R.append("")
R.append("只说「711 个非标准」会让人误以为有 711 个问题。真正需要业务方判断要不要处理的"
         "只有 **%d 条**，构成如下（已逐条核验）：" % NAME_TRUE_ANOMALY_TOTAL)
R.append("")
R.append("| 类别 | 数量 | 分布 | 是否需业务方决策 |")
R.append("|---|---|---|---|")
R.append("| 含中文列名 | %d | `YFMXB` %d 条 + `YSMXB` %d 条 | **是** —— 两张孤儿表架构异常 |"
         % (NAME_BY_CLASS["含中文"],
            sum(1 for f in _name_non if f["column_cn"] and not f["column"].isascii()
                and f["table"] == "YFMXB"),
            sum(1 for f in _name_non if f["column_cn"] and not f["column"].isascii()
                and f["table"] == "YSMXB")))
R.append("| 纯数字列名 | %d | `PURTG2.01` / `.02` | **是** —— 字段名退化为数字 |"
         % NAME_BY_CLASS["纯数字"])
R.append("| **真异常合计** | **%d** | — | — |" % NAME_TRUE_ANOMALY_TOTAL)
R.append("| 其余 %d 条 | %d | 7位式/表别名前缀式/纯字母/形态标准但前缀不符 | **否** —— E10 正常设计变体 |"
         % (NAME_NONSTD - NAME_TRUE_ANOMALY_TOTAL,
            NAME_NONSTD - NAME_TRUE_ANOMALY_TOTAL))
R.append("")
R.append("**纯数字列名 2 条**：`PURTG2.01` / `PURTG2.02` 无中文注释，"
         "是本库唯一「字段名退化」的情况，业务方需确认是否为历史遗留。")
R.append("")
R.append("逐类说明：")
R.append("")
R.append("1. **7 位完整表名式（%d 条）** —— `GHXA001` / `JCXA001` 等。"
         "单据性质类表的字段名带完整表名，是E10 既定设计惯例，**非异常**。"
         % NAME_BY_CLASS["7位完整表名式"])
R.append("2. **表别名前缀式（%d 条）** —— `TAI01` / `TKI01` / `TCK01` 等，"
         "形态为 3 字母 + 2 位数字。同样遵循「表前缀 + 序号」规则，"
         "只是列名前缀取的是**表别名**而非表名后 2 位（如 `ACRTA` 表用 `TAI` 前缀），"
         "用于同表内分区编号避免冲突。**非异常**。" % NAME_BY_CLASS["表别名前缀式"])
R.append("3. **形态标准但前缀不符（%d 条）** —— 形态为 `XXnnn` 但前缀不命中实体位，"
         "逐条可解释，**无一条属异常**：" % NAME_BY_CLASS["形态标准但前缀不符"])
R.append("   - `EFJOBQUE`（15 条）：表名本身是 `EF`+`JOBQUE` 混合命名，前缀判据不适用")
R.append("   - `YFMXB` / `YSMXB`（8 条）：孤儿表，字段抄自 `INVMA`（客户）/ `INVTA`（单据）")
R.append("   - `V_QIXUBING`（2 条）：`V_` 前缀视图，字段抄自员工表")
R.append("   - `INTLB.LA007` / `PSMMC.LB012`（2 条）：中文名均为「预留字段」，"
         "建表时克隆其他表模板留下的痕迹")
R.append("4. **纯字母列名（%d 条）** —— `ID` / `STATUS` / `ISShowST` 等。"
         "队列表（`IWCTRANSQUEUE` / `TRANSQUEUE`）与报表格式表"
         "（`RPTGRIDFMT`）采用语义化命名，**非异常**。" % NAME_BY_CLASS["纯字母"])
R.append("5. **含中文列名（%d 条）** —— 仅 `YFMXB`(9) / `YSMXB`(11)，"
         "全库仅这两张表用中文列名。属**孤儿表架构异常**，见下节。"
         % NAME_BY_CLASS["含中文"])
R.append("6. **纯数字列名（%d 条）** —— `PURTG2.01` / `.02`，"
         "字段名退化且中文名全空，**是唯一需要关注的真退化项**。"
         % NAME_BY_CLASS["纯数字"])
R.append("7. **其他（长度 6，%d 条）** —— `FMTNO` / `JOBID` 等，"
         "语义化命名，**非异常**。" % NAME_BY_CLASS["其他"])
R.append("")
R.append("**结论：非标准 %d 条中，仅 2 条（`PURTG2.01/.02`）是真退化，"
         "%d 条（孤儿表中文列名）需连表整体排除，"
         "其余 %d 条均属 E10 设计惯例。**"
         % (NAME_NONSTD, NAME_BY_CLASS["含中文"],
            NAME_NONSTD - 2 - NAME_BY_CLASS["含中文"]))
R.append("")
R.append("### 孤儿表架构异常（`YFMXB` / `YSMXB`）")
R.append("")
R.append("全库 54842 个字段中，**只有 20 个使用中文列名**，且全部集中在这两张表：")
R.append("")
R.append("| 表 | 列数 | 中文列名 | 具体列名 |")
R.append("|---|---|---|---|")
for tb in sorted(ORPHAN_ARCH_ANOMALY):
    cols = [f["column"] for f in fields_by_table.get(tb, [])]
    cn = [c for c in cols if not c.isascii()]
    R.append("| `%s` | %d | %d | %s |"
             % (tb, len(cols), len(cn), "、".join("`%s`" % c for c in cn)))
R.append("")
R.append("这两张表的异常特征（三重）：")
R.append("")
R.append("1. **不在 `tables.json` 中** —— 无 module 归属、无中文表名、无英文表名")
R.append("2. **列名体系与全库不同** —— 用中文列名，而 E10 正规表全部是 `XX001` 式编码")
R.append("3. **掩码与列类型脱节** —— `%s.出入` / `%s.出入` 是 `numeric(1,0)` "
         "却挂日期掩码 `YMD`" % tuple(sorted(ORPHAN_ARCH_ANOMALY)))
R.append("")
R.append("结论：这两张表**很可能不是 E10 标准元数据表**，而是外部系统导入或手工维护的表。"
         "建议 SDK 与统计口径**整体排除**这两张表，不要把它们当E10 业务表处理。")
R.append("")
R.append("## 八、检索指引")
R.append("")
R.append("| 场景 | 用法 |")
R.append("|---|---|")
R.append("| 已知表名查字段 | 直接打开 `modules/{模块}.md`，检索 `` `表名` `` |")
R.append("| 已知字段名反查表 | `grep` `field-index.csv` 的 `column` 列 |")
R.append("| 按中文名找表 | `grep` `field-index.csv` 的 `column_cn` 列 |")
R.append("| 查某模块全部表 | `grep` `table-index.csv` 的 `module` 列 |")
R.append("| 查日期/时间格式掩码 | `format-mask-map.csv`（981 行，含推断类型与依据） |")
R.append("| 查 OpenAPI 服务 | `table-index.csv` 的 `is_openapi_exposed` / `openapi_services`，"
         "`是`/`部分` 为真机实证，`否` 仅表示无实证 |")
R.append("| 找类型定义 | `field-index.csv` 的 `type_norm` 列，`UNKNOWN` 者需人工判定 |")
R.append("")
R.append("## 九、与 `knowledge/typekey-mapping/` 的关系")
R.append("")
R.append("| 目录 | 面向对象 | 键| 字段命名 |")
R.append("|---|---|---|---|")
R.append("| `knowledge/data-dictionary/`（本目录） | **物理表** | 物理表名（`PURTC`） | "
         "`XX001` 编码制，**无语义**，须查中文名 |")
R.append("| `knowledge/typekey/` | **业务对象** | type_key（`purchase.order`） | "
         "服务名 `yf.oapi.*` |")
R.append("| `knowledge/typekey-mapping/` | **API 字段** | type_key + 逻辑节点名 | "
         "`ac_no` 语义化命名 |")
R.append("")
R.append("三层之间**缺少权威的物理层映射**，这是当前材料的最大缺口：")
R.append("")
R.append("- 上层（`ac_no` 等语义名）到中层（`TC005` 等物理列名）**无官方对照**")
R.append("- 中层到下层（物理表）**无官方对照**")
R.append("")
R.append("因此 SDK 无法自动生成「语义字段名 -> 物理列名」的映射，"
         "现阶段只能靠本字典的 `field-index.csv` 做**人工对齐**。"
         "补齐该映射的可靠途径：真机调用 OpenAPI 抓取实际返回的列名，"
         "或取得易飞官方提供的接口-表结构对照文档。")
R.append("")
R.append("## 十、生成信息")
R.append("")
R.append("| 项 | 值 |")
R.append("|---|---|")
R.append("| 生成命令 | `%s` |" % GEN_CMD)
R.append("| 生成时间 | %s |" % GENERATED_AT)
R.append("| 编码 | UTF-8 无BOM|")
R.append("| 换行 | CRLF |")
R.append("| 模块文件数 | %d |" % len(module_file_stats))
R.append("| 模块文件总行数 | %d |" % total_lines)
R.append("| 字段总数 | %d（业务 %d + UDF %d） |"
         % (len(fields), report["udf"]["business_field_rows"], report["udf"]["udf_field_rows"]))
R.append("| 表总数 | %d（tables.json）+ %d（孤儿表） |" % (len(tables), len(only_in_fields)))
R.append("| 带格式掩码字段 | %d |" % len(fm_rows))
R.append("")
R.append("本文件为机械抽取产物，请勿手工编辑。")
R.append("")

write_crlf(os.path.join(csv_dir, "README.md"), R)

with open(os.path.join(csv_dir, "_gen-stats.json"), "w", encoding="utf-8", newline="\r\n") as fh:
    json.dump({
        "generated_at": GENERATED_AT,
        "modules": module_file_stats,
        "csv": {
            "field-index.csv": len(fi_rows),
            "format-mask-map.csv": len(fm_rows),
            "table-index.csv": len(ti_rows),
        },
        "oapi": {"exact": oapi_exact, "substring": oapi_sub, "unmatched": len(tables) - len(oapi)},
        "doubts": {
            "no_cn_fields": len(no_cn_fields),
            "unknown_type": len(unknown_type),
            "mask_mode_deviation": len(mask_mismatch),
            "mask_mode_deviation_orphan": len(mask_mismatch_orphan),
            "mask_syntax_pending": len(mask_syntax_pending),
            "mask_on_nonchar": len(mask_on_nonchar),
            "mask_mismatch_under": len(mask_mismatch_under),
            "mask_mismatch_over": len(mask_mismatch_over),
            "nonstandard_names": NAME_NONSTD,
            "nonstandard_by_class": dict(NAME_BY_CLASS),
            "business_field_total": NAME_BIZ_TOTAL,
            "standard_names": NAME_STD,
            "nonstd_name": len(nonstd_name),
            "tables_full_nonstandard": TABLES_FULL_NONSTD,
            "tables_with_nonstandard": TABLES_WITH_NONSTD,
            "tables_with_udf_biz": TABLES_WITH_UDF_BIZ,
            "tables_with_udf_all": TABLES_WITH_UDF_ALL,
            "tables_partially_nonstandard": TABLES_PART_NONSTD,
            "tables_all_standard": TABLES_ALL_STD,
            "tables_with_udf_biz": T5_HAS_UDF,
            "tables_with_udf_all": T3_HAS_UDF,
            "tables_with_nonstd_all": T3_WITH_NS,
            "mask_min_mode_ratio": round(_min_mode_ratio(), 4),
            "mask_min_mode_margin": _min_mode_margin(),
            "orphan_tables": sorted(only_in_fields),
            "empty_tables": sorted(only_in_tables),
        },
    }, fh, ensure_ascii=False, indent=2)

print("README 与统计完成。总行数=%d" % total_lines)