> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 科目余额查询助手 PRD

| V1.0 | 2026-08-06 | 对标 k3c balance 命令 |

## 背景
查询科目余额（多期间/科目区间/层级汇总/核算维度钻取），对标 k3c balance 命令的末级过滤+维度能力。

## 数据接口
| 属性 | 值 |
|------|-----|
| ERP 服务 | `account` (KJSKC02) typekey |
| 调用 | `yfcli_run` type_key 模式 |
| 输入 | account_codes, period, dimensions |
