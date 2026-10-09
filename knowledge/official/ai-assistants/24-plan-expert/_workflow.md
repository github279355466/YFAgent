# 计划专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: PlanExpert | **产品线**: YF | **模块**: yfcli-experts/plan
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 齐套分析、物料齐套、ATP、交付承诺、可承诺交期、拆批

## 2. 工作流总览

```
用户输入 → 意图识别(kit-check/atp)
  ↓
数据获取(yfcli_run: wo/bom/inventory等)
  ↓
引擎计算(yfcli-experts/plan纯函数)
  ↓
报告生成(齐套状态/ATP交期/拆批方案)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "齐套""物料齐套""缺料" → kit-check
- "ATP""交付承诺""可承诺交期" → atp

### Step 2: 数据获取
通过 `yfcli_run` 查询工单、BOM、库存等相关 TypeKey。

### Step 3: 引擎计算
- kit-check: `checkKit(workOrders, bomEntries, availability)` → BOM展开 + 按优先级分配 + 双维齐套判定
- atp: `calcAtp(input)` → 关键链路计算 + 可承诺交期 + 拆批方案

### Step 4: 报告生成
输出齐套状态表、ATP交期或拆批方案。

## 4. 业务规则

- 物料齐套分析：BOM展开 → 按优先级分配 → 双维齐套判定 → 叫料建议
- ATP交付承诺：关键链路计算 → 可承诺交期 → 拆批方案 → what-if试算
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| BOM 展开失败 | 提示检查物料主数据 |
| 库存数据不完整 | 标注缺失项并给出保守估计 |
| ATP 无可行解 | 返回最早可能交期 + 瓶颈说明 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| workOrders | yfcli_run | 工单列表 |
| bomEntries | yfcli_run | BOM子件列表 |
| availability | yfcli_run | 库存可用量 |
| input | yfcli_run + 用户输入 | ATP输入 AtpInput |
