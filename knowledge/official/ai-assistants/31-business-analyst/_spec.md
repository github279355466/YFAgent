> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 业务分析助手 PRD（Business Analyst）

| V1.0 | 2026-08-29 | 对齐 docs/erp_analysis/analysis-framework（Analysis Rules = 分析操作系统） |

## 定位

回答「为什么」类开放式业务问题（销售下降 / 库存上升 / 利润波动 / 客户流失…）。
**不是问数助手**：目标明确的数据查询（降多少 / Top N / 同比）走 `yfcli_ask`；
**不是单据操作**：增删改查走 `yfcli_run`。

## 架构边界（铁律）

```
宿主 Agent(LLM 决策) → 本助手(方法论) → yfcli_analysis_* (本地确定性计算) → yfcli_run (客户 ERP 取数)
```

- **LLM 产出 Plan，Runtime 只执行不理解**：所有数字由 `yfcli_analysis_step` 确定性计算，LLM 不得自行心算
- **ERP 原始数据不出客户环境**：取数永远经 `yfcli_run`（客户侧 MCP），本地算完只回传聚合结果
- **不自建 Agent 平台**：编排由宿主 Agent 完成

## 数据接口

| 属性 | 值 |
|------|-----|
| 计划创建 | `yfcli_analysis_plan { action: "create", question }` → 意图路由 + Plan |
| 计划校验 | `yfcli_analysis_plan { action: "validate", plan_json }` → 语义准入 |
| 字段视图 | `yfcli_analysis_meta { type_key }` / `{ list: true }`（LLM 可见语义层） |
| 单步执行 | `yfcli_analysis_step { plan_json, operation_json, rows?, compare_rows? }` |
| 取数 | `yfcli_run`（按 QueryPlan 的 dimensions/filters/aggregations） |

## 分析流程（与 _workflow.md 一致）

1. 意图路由（plan 内建 `routeIntent` 三分诊）
2. 创建 Plan → 校验通过
3. step（无 rows）→ QueryPlan → `yfcli_run` 取数
4. step（有 rows）→ 变化/贡献度/TopN + 下钻门禁 + 停止判定
5. 按门禁循环下钻，直到 `stop=true`
6. 汇总 findings/evidence 生成报告（prompts/05-report.md）

## 护栏（来自 analysis-framework，程序化强制）

| 护栏 | 实现 |
|------|------|
| 跨维度贡献度不可相加 | `assertNoCrossDimensionSum` 抛错 |
| 下钻对象必须来自上一轮 | `compileOperation` 无 drill_context 抛错 |
| 数据不足不得编造原因 | `evaluateStop` require_evidence + 报告模板「无法确认部分」段 |
| 假设必须可验证 | `validateSemantic` HYPOTHESIS_NO_EVIDENCE 拦截 |
| 字段必须真实存在 | metadata 程序核对 verified，目录外维度抛错 |

## 安全契约

- 只读分析：本助手**不产生任何 ERP 写操作**
- 越界问题（单据操作/明确问数）→ 返回 hint 建议改用对应工具，不猜测
- 未知数据源/字段 → 显式报错，不臆造
