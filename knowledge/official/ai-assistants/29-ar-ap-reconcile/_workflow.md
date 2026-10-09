> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 应收应付对账工作流
1. 意图提取: type(AR/AP) + 期间
2. 取应收/应付明细（ErpClient）
3. 按客户/供应商分桶 → 多 Pass 匹配
4. 按置信度分级输出：high(自动配对)/medium(建议)/manual(人工)
5. --apply 写入匹配缓存（~/.yfcli/ar_cache/）
