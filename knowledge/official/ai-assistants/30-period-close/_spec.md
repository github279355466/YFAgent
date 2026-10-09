> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 期末结转结账助手 PRD
| V1.0 | 2026-08-06 | 对标 k3c transferpl + closing + 决策5 |

## 安全契约
- 结账为最重不可逆操作，含四重护栏（对标 k3c closing run）
- 期间状态探测（closed/open/unknown）→ unknown 时 fail-closed
- 不实现反结账（对标 k3c 安全哲学）

## 数据接口
| 属性 | 值 |
|------|-----|
| 引擎 | @digiwin/erp-experts period/guards.ts + status-probe.ts |
| ERP | transferpl 方案执行 + closing |
