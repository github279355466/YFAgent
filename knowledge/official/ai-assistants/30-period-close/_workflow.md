> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 期末结转结账工作流
1. 结转损益: 调预配置方案出草稿 → 界面审核 → 过账 → 结账
2. 结账: 四重护栏（dry-run/confirm/期间探测/不反向）
3. 失败时展示原因 + 修复指引
