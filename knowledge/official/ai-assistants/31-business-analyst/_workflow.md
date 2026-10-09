> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 业务分析工作流

> 宿主 Agent 按此流程执行。所有数字计算交给 MCP 工具，LLM 只做决策与报告。

## 主流程

```
用户问题（为什么/原因/归因类）
    │
    ▼
1. yfcli_analysis_plan { action:"create", question }
    │  → route（三分诊：business_analysis / smart_query / erp_operation）
    │  → plan + validation
    │  （若 route 非 business_analysis，按 hint 改用 yfcli_ask / yfcli_run）
    ▼
2. yfcli_analysis_step { plan_json, operation_json }   ← 不传 rows
    │  → query_plan（dimensions / filters / aggregations / options）
    │  （必要时先 yfcli_analysis_meta 查字段语义视图）
    ▼
3. yfcli_run { type_key, operation:"getMultiple", ...query_plan }  ← 客户 ERP 取数
    │  → rows / compare_rows
    ▼
4. yfcli_analysis_step { plan_json, operation_json, rows, compare_rows }
    │  → result（变化/变化率/贡献度/TopN）+ drilldown + stop
    ▼
5. stop=false 且有可下钻维度？
    │ 是 → 回到 2（DRILL_DOWN 必须携带上一步 drill_context）
    │ 否 → 继续
    ▼
6. 汇总 findings/evidence → 报告（prompts/05-report.md）
```

## 关键规则

1. **第一步永远先 routeIntent**：目标明确的查询（"本月销售额多少"）→ 立即转 yfcli_ask，不建分析 Plan
2. **step 分两种调用**：无 rows = 拿 QueryPlan（编译）；有 rows = 确定性计算
3. **下钻上下文不可臆造**：DRILL_DOWN 的 drill_context 必须来自上一轮 result.drilldown
4. **停止条件由程序判定**：depth/actions/evidence 门禁，LLM 不自行决定"够了"
5. **证据链**：每个结论（finding）必须挂 evidence（数值可回溯），无法证实的不写进"主要原因"

## 结束条件

- `stop=true`（达到 max_depth / max_actions / 无高贡献维度）
- 或已形成完整「指标 → 异常维度 → 异常对象 → 验证」原因链
- 报告必须含「无法确认部分」：数据不足的假设明确标注，不得编造
