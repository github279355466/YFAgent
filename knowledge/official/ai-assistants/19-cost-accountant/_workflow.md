# 成本会计专家 — Agent 工作流定义

> **版本**: V1.0 | **最后更新**: 2026-10-09
> **数据来源**: 从 YZCLI 易助专家模块移植
> **助手编码**: CostAccountantExpert | **产品线**: YF | **模块**: yfcli-experts/cost
>
> ⚠️ 本助手从易助(YZ)移植，引擎模块名需从 yzcli-experts 改为 yfcli-experts，ERP 服务名需从 yz.* 改为 yf.*（待 Q-02 回复确认）。

## 1. Agent 概述

**触发关键词**: 成本模拟、BOM成本、降本、月结检查、关账、成本归因、波动分析、呆滞、库龄

## 2. 工作流总览

```
用户输入 → 意图识别(simulate/monthend/attribution/deadstock)
  ↓
数据获取(yfcli_run: bom/item/inventory等TypeKey)
  ↓
引擎计算(yfcli-experts/cost纯函数)
  ↓
报告生成(成本结构表/归因树/呆滞清单/月结报告)
```

## 3. 各步骤详细定义

### Step 1: 意图识别
- "成本模拟""BOM成本""降本" → simulate
- "月结检查""关账" → monthend
- "成本归因""波动分析" → attribution
- "呆滞""库龄" → deadstock

### Step 2: 数据获取
通过 `yfcli_run` 查询 BOM、物料、库存等相关 TypeKey。

### Step 3: 引擎计算
- simulate: `simulateCost(item, materials, prices, params)` → 三步法成本 + 目标毛利反推
- monthend: `diagnoseMonthEnd(period, exceptions)` → 四步诊断
- attribution: `calcAttribution(item, current, previous)` → 五层穿透归因
- deadstock: `diagnoseDeadstockBatch(details, asOfDate)` → 双条件判定 + 6区间账龄

### Step 4: 报告生成
输出成本结构表、归因树、呆滞清单或月结报告。

## 4. 业务规则

- BOM模拟成本：三步法（材料/人工/制造费用）+ 目标毛利反推 + 三类降本方案
- 成本月结检查：四步诊断（问题→影响→根因→建议），异常三级分类
- 产品成本分析：五层穿透归因（总成本→要素→明细→价差/量差）
- 库存呆滞料分析：双条件判定 + 6区间账龄 + 7维原因诊断
- 所有数值由确定性引擎计算，LLM不做算术

## 5. 异常处理

| 异常场景 | 处理方式 |
|---------|---------|
| BOM 展开失败 | 提示检查物料主数据完整性 |
| 无历史成本数据 | 归因分析跳过，仅展示当期 |
| 月结异常过多 | 按优先级排序，分批展示 |

## 6. 数据上下文变量

| 变量名 | 来源 | 描述 |
|--------|------|------|
| item | yfcli_run | 物料主数据 |
| materials | yfcli_run BOM展开 | BOM子件列表 |
| prices | yfcli_run / 用户输入 | 材料单价 |
| period | 用户输入 | 会计期间 |
| exceptions | yfcli_run | 月结异常列表 |
| details | yfcli_run | 库存明细数组 |
| asOfDate | 用户输入 | 呆滞判定基准日 |
