> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 99-intelligent-query 工作流

## 触发条件

用户输入匹配以下任一关键词且不匹配排除词：
- 触发词：统计分析、趋势分析、排名、对比分析、汇总统计、占比分析、同比、环比、跨表、帮我算一下、综合查询
- 排除词：具体单据号（SO/PO开头+数字）、具体客户名+报告、呆滞、库龄

## 工作流步骤

### 步骤 1：意图识别 + 路由

宿主按 `routeIntent` 三分诊确定走 `smart_query`（确定性问数），调用 `yfcli_ask`。

> **指标库已取消**（2026-08-29 架构变更）：YAML 指标匹配在客户环境命中率≈0，不构成加速。
> `yfcli_ask` 无三层路由，走「宿主产 Plan → 确定性执行」两步链路。

### 步骤 2：Plan → 取数 → 确定性计算

1. **建 Plan**：宿主调 `yfcli_analysis_plan`（create）产出 `root_analysis`（根指标），
   或由 `yfcli_ask` 内部按问题推导。
2. **取 QueryPlan**：`yfcli_ask(question)` 不带 `rows` → 返回 QueryPlan（含 `fetch[]` 模板与参数）。
3. **取数**：宿主按 QueryPlan 调 `yfcli_run` 取当前期/对比期原始数据。字段名由
   `resolveField` 解析为 erp-metadata 物理码。
4. **确定性计算**：`yfcli_ask(question, plan, rows, compare_rows)` 传回数据 →
   calc 内核计算变化 / 变化率 / 贡献度 / 排名，**不经 LLM 算数**。
5. **生成报告**：宿主按 05-report 提示词渲染富文本报告，展示给用户。

### 步骤 3：语义边界

- **不下钻**：`yfcli_ask` 显式拒绝 `DRILL_DOWN`（调查类问题归 `yfcli_analysis_plan/step`）。
- **根指标缺失时诚实失败**：无法推导 `root_analysis` 时返回错误并提示显式建 Plan，不猜测。

## 异常处理

| 异常 | 处理 |
|------|------|
| 数据量超限 | 提示缩小时间范围或增加筛选条件 |
| 意图模糊 | 追问澄清"您想看哪个维度的统计？" |
| 数据为空 | 明确告知"该时间段暂无数据" |
| 无法推导根指标 | 返回错误，提示改用 `yfcli_analysis_plan` 显式建 Plan |
| 请求下钻 | 拒绝并引导至 `yfcli_analysis_plan` / `yfcli_analysis_step` |
| 超出能力 | 转人工，记录为待治理指标候选 |

## 护栏（详见 `_spec.md`）

- 语义准入：`validateSemantic`（指标 / 数据源 / 假设证据 / 预算）
- 取数上限：单 call ≤1000 条，总量 ≤5000 条，最多 5 次 `yfcli_run`
- 字段无法解析时告警而非静默发错

## 审计日志

每次查询记录：用户ID、问题内容、路由结果（`routeIntent` 三分诊结论）、
数据源、记录数、执行时间。
