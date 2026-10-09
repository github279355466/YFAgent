# 采购专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: PurchaseExpert | **产品线**: YF | **模块**: yfcli-experts/purchase
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 询价、比价、交期评审、采购跟催、供应商选择

## 2. 工作流总览

```
用户输入 → 意图识别(inquiry/delivery-review)
  ↓
数据获取(yfcli_run: inquiry/supplier/purchase.order等)
  ↓
引擎计算(yfcli-experts/purchase纯函数)
  ↓
报告生成(比价建议/交期评审报告)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "询价""比价""供应商选择" → inquiry
- "交期评审""跟催""到料日" → delivery-review

### Step 2: 数据获取
通过 `yfcli_run` 查询询价单、供应商、采购订单等相关 TypeKey。

### Step 3: 引擎计算
- inquiry: `compareQuotes(items, quotes)` → 多供应商比价分析
- delivery-review: `reviewDelivery(requirements, params)` → 历史×前置期加权 + 工作日历推到料日

### Step 4: 报告生成
输出比价建议表或交期评审报告。

## 4. 业务规则

- 新料采购询价：物料展开 → 供应商推荐 → 比价分析
- 采购交期评审：历史×前置期加权 → 工作日历推到料日 → 缺口风险
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| 无供应商报价 | 提示补充询价 |
| 历史交期数据不足 | 使用默认前置期并标注 |
| 到料日晚于需求日 | 高亮风险并建议拆批 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| items | yfcli_run / 用户输入 | 物料列表 |
| quotes | yfcli_run | 供应商报价数组 |
| requirements | yfcli_run | 物料需求 MaterialRequirement[] |
| params | 配置 | 交期评审参数 DeliveryReviewParams |
