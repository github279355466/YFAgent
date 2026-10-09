# 应收会计专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: ArAccountantExpert | **产品线**: YF | **模块**: yfcli-experts/ar
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 应收、对账、立账、收款、核销、账龄、催收、DSO、坏账拨备（排除"凭证""报表"）

## 2. 工作流总览

```
用户输入（含"应收""账龄""催收"等关键词）
  ↓
Step 1: 意图识别 — 判断 action 类型（reconcile/aging/dunning/collect/writeoff）
  ↓
Step 2: 数据获取 — 通过 yfcli_run 从 ERP 取应收明细
  ↓
Step 3: 引擎计算 — 调用 yfcli-experts/ar 纯函数
  ↓ (calcAgingReport / calcCollectionScores)
Step 4: 生成报告 — 结构化输出 + 风险发现
  ↓
输出报告给用户
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "对账" → action=reconcile
- "账龄" → action=aging
- "催收" → action=dunning
- "收款" → action=collect
- "核销" → action=writeoff

### Step 2: 数据获取
通过 `yfcli_run` 查询 `accounts.receivable` 或相关 TypeKey 获取应收明细。

### Step 3: 引擎计算
- aging: `calcAgingReport(details, params)` → 32项指标
- dunning: `calcCollectionScores(inputs)` → 4维评分排序

### Step 4: 报告生成
输出账龄分布表、逾期TOP10、催收建议清单。

## 4. 业务规则

- 所有数值由确定性引擎计算，LLM不做算术
- 写操作一律先预览后确认
- 不替代业务人员与客户谈判
- 32项账龄指标：分级账龄表、逾期O01~O05、DSO、坏账拨备、TOP10穿透矩阵
- 4维催收评分：金额30% + 紧急度30% + 历史逾期率20% + 坏账20%

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| ERP 连接失败 | 提示用户检查网络与 token |
| 无应收明细数据 | 返回空报告并说明原因 |
| 引擎计算超时 | 分批处理或提示缩小范围 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| details | yfcli_run fastquery/getMultiple | 应收明细数组 ArDetail[] |
| params | 用户输入提取 | 账龄区间、客户筛选等参数 |
| inputs | 用户输入 + ERP数据 | 催收评分输入 CollectionInput[] |
