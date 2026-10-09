# 生产专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: ProductionExpert | **产品线**: YF | **模块**: yfcli-experts/production
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 工单进度、报工统计、良率分析、工时统计、产量汇总

## 2. 工作流总览

```
用户输入 → 意图识别(progress/work-report)
  ↓
数据获取(yfcli_run: wo/work.report等)
  ↓
引擎计算(yfcli-experts/production纯函数)
  ↓
报告生成(进度汇总/良率报告)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "工单进度""进度跟踪""延期预警" → progress
- "报工""工时""产量""良率" → work-report

### Step 2: 数据获取
通过 `yfcli_run` 查询工单、报工记录等相关 TypeKey。

### Step 3: 引擎计算
- progress: `summarizeProgress(workOrders, asOfDate)` → 工单状态汇总 + 延期预警
- work-report: `summarizeWorkReports(entries)` → 工时/产量聚合 + 良率计算

### Step 4: 报告生成
输出进度汇总表或良率报告。

## 4. 业务规则

- 工单进度跟踪：工单状态汇总、延期预警
- 报工统计：工时/产量聚合、良率计算
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| 无报工记录 | 返回空报告并提示补录 |
| 工单状态异常 | 高亮异常工单并建议跟进 |
| 良率低于阈值 | 警告并列出异常批次 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| workOrders | yfcli_run | 工单列表 WorkOrderProgress[] |
| asOfDate | 用户输入 | 进度截止日期 |
| entries | yfcli_run | 报工记录 WorkReportEntry[] |
