> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 99-intelligent-query PRD

| 文档版本 | 修改日期 | 修改人 | 修改内容 |
|---------|---------|--------|---------|
| V1.0 | 2026-07-29 | | 初稿，智能问数助手 |

## 1. 项目背景与目标

**背景**：用户需要用自然语言对 ERP 数据进行聚合统计分析（如"查询一季度销售情况"），但 ERP OpenAPI 只能按条件查询具体单据，无法直接提供聚合统计结果。

**目标**：
- 自然语言输入即可获取聚合统计分析报告
- 宿主 LLM 理解意图 → 产出固定步骤计划（确定性多步，无下钻循环）
- yfcli_ask / yfcli_analysis_step 按 QueryPlan 确定性执行（变化/变化率/贡献/排名）
- 调查类问题（为什么/归因）走 yfcli_analysis_plan/step 下钻循环

## 2. 目标用户

- 销售/运营/财务/供应链等业务人员
- 数据分析师（辅助工具）
- 管理层（看报告、趋势）

## 3. 数据接口

| 属性 | 值 |
|------|-----|
| MCP 工具名 | `yfcli_ask`（确定性问数执行，无下钻） |
| 计划产出 | `yfcli_analysis_plan`（routeIntent 三分诊 + 语义准入） |
| 底层数据获取 | `yfcli_run`（fastquery 取数，字段解析走 erp-metadata 物理码） |
| 计算执行 | `yfcli_analysis_step` / `yfcli_ask`（calc 内核确定性计算） |

## 4. 工作流程（执行层统一，指标库已取消）

```
用户自然语言输入
    ↓
routeIntent 三分诊（程序化 + LLM 可解释覆盖）
    ├─ erp_operation  → yfcli_run（单据增改查）
    ├─ smart_query    → yfcli_ask（确定性问数）
    │    宿主 LLM 建 Plan（yfcli_analysis_plan create）→ yfcli_ask 无 rows 返回 QueryPlan
    │    → yfcli_run 取数（物理码由 resolveField 解析）→ yfcli_ask 传 rows 确定性计算
    └─ business_analysis → yfcli_analysis_plan/step（下钻循环，结果决定下一步）
```

## 5. 触发关键词

| 触发词 | 排除词 |
|--------|--------|
| 统计分析、趋势分析、排名、对比分析、汇总统计、占比分析、同比、环比、跨表、帮我算一下、综合查询 | 具体单据号、具体客户名+报告、呆滞、库龄 |

## 6. 执行层统一（2026-08-29 架构变更）

- 指标库（YAML 匹配）已取消：客户环境命中率≈0，不构成加速
- ask 与 analysis 共用同一执行内核（calc/ + executeStep），区别只在计划形态：
  - smart_query = 确定性多步（固定步骤、无分支、无状态）
  - business_analysis = 调查循环（有分支、有状态、下钻门禁 + 停止条件）
- 字段解析统一：逻辑字段名 → erp-metadata 物理码（resolveField）

## 7. 护栏

- 语义准入：validateSemantic（指标/数据源/假设证据/预算）
- 下钻门禁：DRILL_DOWN 必须带上一轮上下文；确定性问数拒绝下钻
- 取数：分页 + 本地过滤；字段无法解析时告警而非静默发错
- 完整审计日志

## 8. 安全护栏

- 单call ≤1000条，总量 ≤5000条
- 最多5次 yfcli_run 调用
- 敏感字段自动脱敏
- 完整审计日志

## 9. 输出格式

富文本报告（Markdown）：
- 核心结论（1-3句话）
- 数据表格
- 趋势/排名/对比分析
- 追问建议
