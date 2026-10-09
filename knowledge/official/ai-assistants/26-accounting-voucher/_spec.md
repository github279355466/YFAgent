> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 会计凭证操作助手 PRD

| 文档版本 | 修改日期 | 修改人 | 修改内容 |
|---------|---------|--------|---------|
| V1.0 | 2026-08-06 | | 初稿，对标 k3c voucher 安全契约 |

## 1. 项目背景与目标

**背景**：YZCLI 当前 18 个助手覆盖进销存/供应链，财务凭证操作完全空白。易助 ERP 已通过 `accounting.voucher`(KJSKC04) TypeKey 暴露凭证 CRUD 能力，但缺乏 Agent 安全封装。

**目标**：
- 识别用户"会计凭证"操作意图（录入/查询/修改/删除/过账）
- 通过 `@digiwin/erp-experts` 的 `VoucherSaveModel` 执行借贷平衡/末级/必填维度校验
- 写操作默认 dry-run 预览，显式 confirm 后落地
- 安全红线：不实现反审核/反过账/反结账

## 2. 目标用户

- 会计/财务人员
- 审计师
- ERP 管理员

## 3. 数据接口

| 属性 | 值 |
|------|-----|
| ERP 服务名 | `accounting.voucher` (KJSKC04) |
| 调用方式 | `yfcli_run` type_key 模式 |
| 安全引擎 | `@digiwin/erp-experts` VoucherSaveModel + VoucherSafety |
| 输入参数 | entries (分录列表), operation (操作类型) |
| 返回结构 | JSON 预览（dry-run）或 创建结果 |

## 4. 工作流程

```
用户自然语言输入（如"录一张凭证：借银行存款1000 贷销售收入1000"）
  ↓
意图识别（LLM1）：提取 operation + 分录明细（科目/金额/摘要/方向）
  ↓
调用 @digiwin/erp-experts VoucherSaveModel.validate()
  ├─ 借贷平衡校验
  ├─ 末级科目校验
  └─ 必填维度校验
  ↓
dry-run 预览 → 用户确认
  ↓
VoucherSafety.checkConfirmFlags(confirm=true, dryRun=false) → 通过
  ↓
yfcli_run(type_key="accounting.voucher", operation="create", input=request)
  ↓
VoucherSafety.validatePostCreate 回读防副本
  ↓
LLM2 生成结果报告
```

## 5. 安全契约（强制，对标 k3c）

| 规则 | 说明 |
|------|------|
| dry-run 默认 | 所有写操作默认仅预览，不落地 |
| confirm 必填 | 落地需显式 `confirm=true` |
| 不反向操作 | 绝不执行 disapprove/reverse_post/reverse_close |
| 软删除 | 不支持物理删除，走 copy→归档→GUI 删除 |
| v1 不写维度 | 必填维度科目校验但报错，不持久化维度 |

## 6. 触发关键词

| 关键词 | 排除 |
|--------|------|
| 凭证、录凭证、会计凭证、修改凭证、删除凭证、过账、凭证查询、会计分录 | 采购、销售 |
