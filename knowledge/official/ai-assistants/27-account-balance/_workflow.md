> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 科目余额查询工作流

1. 意图提取（LLM1）：提取科目编码/期间/维度
2. 调 yfcli_run(type_key="account", operation="fastquery") 查询末级科目
3. 过滤末级科目（对标 k3c 坑点#4：父科目=FDetailID=0 双计）
4. LLM2 生成余额表输出
