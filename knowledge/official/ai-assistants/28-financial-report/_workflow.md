> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 财务报表工作流

1. 意图提取（LLM1）：报表类型 + 期间（YYYY.MM）
2. 加载报表模板 YAML → 逐行 evaluateFormula
   - Acct(range,caliber) → CaliberEngine.evaluateBatch → ErpClient 取科目余额
   - 单元格引用 R[n]C[m]
3. 四表勾稽（checkBalanceSheet）
4. LLM2 生成格式化报表输出
