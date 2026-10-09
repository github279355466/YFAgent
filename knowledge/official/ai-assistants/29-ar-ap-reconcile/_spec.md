> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 应收应付对账助手 PRD
| V1.0 | 2026-08-06 | 对标 k3c ar.py 多 Pass 匹配 + 收编体外 ERP业财一体对账工具 |

## 背景
收编 `D:\AIProject\workbuddy\ERP业财一体对账工具`（LNA001/NDB017/暂估/M1-M3），复用 k3c 多 Pass 匹配算法（A/B/C/D 分级+转人工）。v1 出匹配建议不自动核销，v2 可扩展核销凭证生成。

## 算法
- Pass A: 1:1 完全等额 → high
- Pass B: 结构化线索 + tier3 金额组合 → high
- Pass C: 纯 tier3 组合唯一解 → medium
- Pass D: 转人工

## 数据接口
| 属性 | 值 |
|------|-----|
| ERP 服务 | accounts.receivable / accounts.payable |
| 引擎 | @digiwin/erp-experts reconcile/matcher.ts |
| 配置 | config/finance/{entity}/cues.json |
