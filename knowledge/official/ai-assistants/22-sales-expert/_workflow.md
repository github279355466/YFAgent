# 销售专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: SalesExpert | **产品线**: YF | **模块**: yfcli-experts/sales
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 解析PO、订单底稿、报价、询价、评审、审核订单

## 2. 工作流总览

```
用户输入 → 意图识别(parse/quotation/review)
  ↓
数据获取(yfcli_run: customer/item/sales.order等)
  ↓
引擎计算(yfcli-experts/sales纯函数)
  ↓
报告生成(底稿/报价单/评审结论)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "解析PO""订单底稿" → parse
- "报价""询价" → quotation
- "评审""审核订单" → review

### Step 2: 数据获取
通过 `yfcli_run` 查询客户、物料、销售订单等相关 TypeKey。

### Step 3: 引擎计算
- parse: `parseStructuredPo(params)` → PO结构化解析 + 主数据匹配
- quotation: `generateQuotation(draftId, lines, params)` → 四象限取价链 + 毛利底线
- review: `reviewOrder(pkg, thresholds)` → 一致性检查 + 越权判定

### Step 4: 报告生成
输出订单底稿、报价单或评审结论。

## 4. 业务规则

- 订单底稿生成：结构化PO解析 → 主数据匹配 → 底稿落库
- 销售报价：四象限取价链（新/老客×标准/定制）+ 毛利底线 + 反推报价
- 销售订单评审：汇聚评审包 → 一致性检查 → 越权四类判定
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| PO 格式无法解析 | 提示用户上传标准格式或手动录入 |
| 物料主数据缺失 | 高亮缺失项并建议补录 |
| 报价低于毛利底线 | 警告并要求审批 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| params | 用户输入 / PO文件 | PO解析参数 |
| draftId | yfcli_run | 订单底稿ID |
| lines | yfcli_run / 用户输入 | 报价行项目 |
| pkg | yfcli_run | 评审包 ReviewPackage |
| thresholds | 配置 | 评审阈值 ReviewThresholds |
