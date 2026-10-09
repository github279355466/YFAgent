> ⚠️ 本助手从易助(YZ)移植，以下为适配点清单：
> - 工具名前缀: yzcli_* → yfcli_*
> - AI 服务名: yz.ai.* → yf.ai.*（待 Q-02 确认）
> - typekey: 需确认易飞侧对应 typekey 是否存在于 typekey_map.yaml
> - 引擎模块: @yzcli/* → @digiwin/erp-experts（公共包）
# 会计凭证操作工作流

## 操作类型

| 操作 | 说明 | 安全要求 |
|------|------|----------|
| `list` | 查询凭证列表（按日期/科目/金额） | 只读 |
| `show` | 查看单张凭证明细 | 只读 |
| `create` | 录入新凭证 | dry-run→confirm |
| `copy` | 复制凭证（创建草稿副本） | dry-run→confirm |
| `edit` | 修改凭证（仅未过账草稿） | dry-run→confirm |
| `delete` | 软删除（见安全契约） | 不物理删 |
| `post` | 过账（仅已审核凭证） | dry-run→confirm |

## 调用流程

### 录入凭证 (create)

```
1. Agent 提取意图 → operation="create"
2. Agent 从用户输入提取分录：科目/借方金额/贷方金额/摘要
3. 组装 VoucherSaveRequest { entries: [...] }
4. 调用 @digiwin/erp-experts VoucherSaveModel.validate(request)
   - 失败 → 返回具体校验错误（借贷不平/非末级/缺维度）
   - 通过 → 返回预览 JSON
5. 展示预览给用户，等待确认
6. 确认后设置 confirm=true, dryRun=false
7. 调用 yfcli_run(type_key="accounting.voucher", operation="create", ...)
8. 回读校验 (VoucherSafety.validatePostCreate)
9. 返回创建结果（FVoucherID）
```

### 查询凭证 (list/show)

```
1. Agent 提取意图 → operation="list" 或 "show"
2. 调 yfcli_run(type_key="accounting.voucher", operation="getMultiple/fastquery", ...)
3. 格式化输出（JSON/表格）
```

### 过账 (post)

```
1. Agent 提取意图 → operation="post"
2. 调 VoucherSafety.checkDisallowedOp("post") → allowed
3. dry-run 预览待过账凭证
4. confirm 确认
5. 调 yfcli_run(type_key="accounting.voucher", operation="approve")
6. （易助 approve=审核，过账可能需要独立 API）
7. 返回过账结果
```

## 错误处理

| 错误 | 处理 |
|------|------|
| 借贷不平衡 | 展示借方合计/贷方合计/差额，要求修正 |
| 非末级科目 | 展示科目编码，建议使用下级明细科目 |
| 必填维度缺失 | 展示科目，提示需在 ERP 界面补录维度 |
| 禁止操作 | 展示禁止原因，引导用户走 GUI |
| ERP 返回错误 | 保留原始错误结构展示 |

## 安全红线（绝对不执行）

- ❌ 反审核 (disapprove)
- ❌ 反过账 (reverse_post)
- ❌ 反结账 (reverse_close)
- ❌ 物理删除凭证
- ❌ 跳过 dry-run 直接落地
