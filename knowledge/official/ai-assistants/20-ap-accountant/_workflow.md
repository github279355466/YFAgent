# 应付会计专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: ApAccountantExpert | **产品线**: YF | **模块**: yfcli-experts/ap
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 应付分析、账龄、DPO、付款优先级、排款、三单匹配、差异、月结、关账

## 2. 工作流总览

```
用户输入 → 意图识别(analyze/priority/match/monthend)
  ↓
数据获取(yfcli_run: accounts.payable/payable.doc等)
  ↓
引擎计算(yfcli-experts/ap纯函数)
  ↓
报告生成(14维分析/付款排序/匹配差异/月结计划)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "应付分析""账龄""DPO" → analyze
- "付款优先级""排款" → priority
- "三单匹配""差异" → match
- "月结""关账" → monthend

### Step 2: 数据获取
通过 `yfcli_run` 查询应付账款、应付单据等相关 TypeKey。

### Step 3: 引擎计算
- analyze: `analyzeAp(details, params)` → 14维分析
- priority: `calcPaymentPriority(inputs)` → 付款优先级排序
- match: `performThreeWayMatch(groups, thresholds)` → 三单匹配差异检测
- monthend: `planMonthEnd(config)` → 5阶段月结编排

### Step 4: 报告生成
输出14维分析报告、付款优先级列表、匹配差异表或月结计划。

## 4. 业务规则

- 应付六大业务循环：预付请款/应付立账/暂估冲销/对冲核销/请款付款/传票凭证
- 14维分析：账龄/周转/暂估/现金流/供应商/风险/预付/三单匹配/发票/核销/对账/抵减/付款优先级/价格差异
- 月结5阶段SOP：前置检查→外币重评价→暂估计提→账龄分析→月结检核
- 所有数值由确定性引擎计算，LLM不做算术
- 写操作一律先预览后确认

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| 无应付明细 | 返回空报告并说明 |
| 三单匹配差异过大 | 高亮显示并建议人工复核 |
| 月结前置条件不满足 | 列出未完成项并阻断 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| details | yfcli_run | 应付明细数组 ApDetail[] |
| inputs | yfcli_run + 用户输入 | 付款优先级输入 PaymentInput[] |
| groups | yfcli_run | 三单匹配分组 MatchGroup[] |
| config | 用户输入 | 月结配置 MonthEndConfig |
