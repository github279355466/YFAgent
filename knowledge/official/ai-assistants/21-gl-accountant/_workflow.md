# 总账会计专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: GlAccountantExpert | **产品线**: YF | **模块**: yfcli-experts/gl
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 凭证、录入凭证、结账、关账、报表、资产负债表、利润表、内部对账

## 2. 工作流总览

```
用户输入 → 意图识别(voucher/close/report/reconcile)
  ↓
数据获取(yfcli_run: accounting.voucher/account等)
  ↓
引擎计算(yfcli-experts/gl纯函数)
  ↓
报告生成(校验结果/结账检查/报表/勾稽结果)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "凭证""录入凭证" → voucher
- "结账""关账" → close
- "报表""资产负债表""利润表" → report
- "内部对账" → reconcile

### Step 2: 数据获取
通过 `yfcli_run` 查询凭证、科目余额等相关 TypeKey。

### Step 3: 引擎计算
- voucher: `validateVoucher(voucher)` → 借贷平衡校验、审核状态追踪
- close: `checkPeriodClose(status)` → 结账前置检查
- report: `buildBalanceSheetTemplate()` / `buildIncomeStatementTemplate()` → 报表模板生成
- reconcile: 内部交易对账与差异调平

### Step 4: 报告生成
输出校验结果、结账检查清单、财务报表或勾稽校验结果。

## 4. 业务规则

- 凭证管理：借贷平衡校验、审核状态追踪、过账检查
- 期末结账：结账前置检查（未过账/未对账/待调整）、结转损益摘要
- 财务报表：资产负债表/利润表模板生成、勾稽校验
- 内部往来对账：内部交易对账与差异调平
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| 借贷不平衡 | 返回差额并高亮异常分录 |
| 存在未过账凭证 | 阻断结账并列出待处理项 |
| 勾稽校验失败 | 显示差异明细并建议调整 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| voucher | yfcli_run / 用户输入 | 凭证数据 |
| status | yfcli_run | 期间状态 PeriodStatus |
| report | yfcli_run / 引擎生成 | 报表数据 |
