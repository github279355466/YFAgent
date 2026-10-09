> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 财务报表助手 PRD

| V1.0 | 2026-08-06 | 对标 k3c report 命令 + formula.py + report_amounts.py |

## 背景
出具四张财务报表（资产负债表/利润表/现金流量表/权益变动表），使用本地口径引擎（CaliberEngine）+ 公式评估器（evaluateFormula），出数前自动勾稽检查。

## 数据接口
| 属性 | 值 |
|------|-----|
| 引擎 | `@digiwin/erp-experts` CaliberEngine + evaluateFormula + checkBalanceSheet |
| 报表模板 | `packages/yfcli-finance/src/data/metrics/` YAML |
| 口径 | Y/C/JY/DY/JF/DF/SY/SL |
