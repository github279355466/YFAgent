# 易飞业务域归属草案（T-06 中间产物）

>由 `scripts/gen-domain-map.mjs` 从 `knowledge/typekey/typekey_map.yaml` 机械生成。
> **本文件是草案，不是最终结论。**
>
> 高置信 = type_key 首段精确匹配，可直接采用；
> 中置信 = 子串匹配，**需实施顾问复核**；
> 待确认 = 无规则命中，**必须人工判定，不得默认归入某域**。

>正式版需补充：**系统菜单树**（Apipost 目录 ≠ 系统菜单）、各域中文业务名、业务术语。
> 交付目标见 `docs/plans/yf-materials-tasks.md` 任务 T-06。

## 一、域分布统计

| 域编码 | 域名称 | 对象数 | 置信度 |
|---|---|---|---|
| `purchase` | 采购管理 | 14 | 高 |
| `outsourcing` | 委外管理 | 10 | 高 |
| `sales` | 销售管理 | 9 | 高 |
| `inventory` | 存货管理 | 11 | 高 |
| `production` | 生产管理 | 10 | 中 |
| `engineering` | 产品结构与工艺 | 7 | 高 |
| `quality` | 质量管理 | 5 | 高 |
| `base` | 基础资料 | 27 | 高 |
| `finance` | 会计总账 | 3 | 高 |
| `ar` | 应收管理 | 5 | 高 |
| `ap` | 应付管理 | 3 | 高 |
| `UNASSIGNED` | ⚠️ 待人工确认 | 2 | 无 |

**域说明**：

- **采购管理**（14）：采购单/请购单/核价单/询价单/进货单/到货单/验收/采购发票
- **委外管理**（10）：委外进货/退货/价格/核价/到货/验收
- **销售管理**（9）：报价/预测/订单/订单变更/出货/销货/销退/发票/客户品号
- **存货管理**（11）：库存交易/调拨/报废/销毁/借出/拣货/批号
- **生产管理**（10）：工单/工单变更/拆分/投产/领料/报工/入库
- **产品结构与工艺**（7）：BOM/EBOM/ECN/工艺路线/工程品号/取替代料
- **质量管理**（5）：品管类别/检验项目/抽查基础/不良原因/各类检验单
- **基础资料**（27）：工厂/仓库/部门/员工/币种/单位/客户/供应商/品号/项目/假日/公司/金融机构/工作中心
- **会计总账**（3）：会计凭证/会计科目/费用发票
- **应收管理**（5）：应收退款/预收款/收款单/其他应收/销售发票
- **应付管理**（3）：应付退款/付款单/预付款/其他应付/费用发票

## 二、按域列出的业务对象

### 采购管理（`purchase`，14 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `approve.price` | 核价单 | 8 | 是 | 0 | 高 |
| `inquiry` | 询价单 | 8 | 是 | 0 | 高 |
| `purchase.arrival` | 到货单 | 8 | 是 | 0 | 高 |
| `purchase.arrival.acceptance` | 到货单验收 | 7 | 是 | 0 | 高 |
| `purchase.arrival.inspection` | 到货检验单 | 2 | 是 | 0 | 高 |
| `purchase.change` | 采购变更单 | 8 | 是 | 0 | 高 |
| `purchase.inspection.return` | 退回验退件 | 5 | 是 | 0 | 高 |
| `purchase.invoice` | 采购发票 | 8 | 是 | 0 | 高 |
| `purchase.order` | 采购单 | 8 | 是 | 0 | 高 |
| `purchase.receipt` | 进货单 | 8 | 是 | 0 | 高 |
| `purchase.receipt.acceptance` | 修改进货单验收 | 5 | 是 | 0 | 高 |
| `purchase.receipt.inspection` | 进货检验单 | 2 | 是 | 0 | 高 |
| `purchase.requisitions` | 请购单 | 8 | 是 | 0 | 高 |
| `purchase.return` | 退货单 | 8 | 是 | 0 | 高 |

### 委外管理（`outsourcing`，10 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `outsourcing.approve.price` | 委外核价单 | 8 | 是 | 0 | 高 |
| `outsourcing.price` | 委外价格 | 5 | 是 | 0 | 高 |
| `outsourcing.purchase.acceptance` | 委外进货单验收 | 5 | 是 | 0 | 高 |
| `outsourcing.purchase.arrival` | 委外到货单 | 8 | 是 | 0 | 高 |
| `outsourcing.purchase.arrival.acceptance` | 委外到货单验收 | 8 | 是 | 0 | 高 |
| `outsourcing.purchase.arrival.inspection` | 委外到货检验单 | 2 | 是 | 0 | 高 |
| `outsourcing.purchase.inspection` | 委外进货检验单 | 2 | 是 | 0 | 高 |
| `outsourcing.purchase.inspection.return` | 退回委外验退件 | 5 | 是 | 0 | 高 |
| `outsourcing.purchase.receipt` | 委外进货单 | 8 | 是 | 0 | 高 |
| `outsourcing.purchase.return` | 委外退货单 | 8 | 是 | 0 | 高 |

### 销售管理（`sales`，9 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `quotation` | 报价单 | 8 | 是 | 0 | 高 |
| `sales.forecast` | 销售预测 | 5 | 是 | 0 | 高 |
| `sales.invoice` | 销售发票 | 8 | 是 | 0 | 高 |
| `sales.order` | 数据重新加载刷新 | 8 | 是 | 0 | 高 |
| `sales.order.change` | 修改订单变更单 | 8 | 是 | 0 | 高 |
| `sales.return` | 销退单 | 8 | 是 | 0 | 高 |
| `sales.return.inspection` | 销退检验单 | 2 | 是 | 0 | 高 |
| `shipping.notice` | 出货通知单 | 8 | 是 | 0 | 高 |
| `shipping.order` | 销货单 | 8 | 是 | 0 | 高 |

### 存货管理（`inventory`，11 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `borrow.doc` | 借出单 | 8 | 是 | 0 | 高 |
| `borrow.return` | 借出归还单 | 8 | 是 | 0 | 高 |
| `destroy.order` | 销毁单 | 8 | 是 | 0 | 高 |
| `inventory.transaction` | 库存交易单 | 8 | 是 | 0 | 高 |
| `inventory.transaction.details` | 库存交易明细 | 2 | 是 | 0 | 高 |
| `picking.receipt` | 领料单 | 8 | 是 | 0 | 高 |
| `picking.return` | 退料单 | 8 | 是 | 0 | 高 |
| `scrap.order` | 报废单 | 8 | 是 | 0 | 高 |
| `transfer` | 调拨单 | 8 | 是 | 0 | 高 |
| `transfer.doc` | 转移单 | 8 | 是 | 0 | 高 |
| `transfer.doc.inspection` | 转移检验单 | 2 | 是 | 0 | 高 |

### 生产管理（`production`，10 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `op.stockin` | 工艺入库单 | 8 | 是 | 0 | 高 |
| `operation` | 工艺 | 4 | — | 0 | ⚠️ 中 |
| `wo` | 工单 | 8 | 是 | 0 | 高 |
| `wo.change` | 工单变更单 | 8 | 是 | 0 | 高 |
| `wo.commence` | 投产单 | 8 | 是 | 0 | 高 |
| `wo.routing` | 工单工艺 | 5 | 是 | 0 | 高 |
| `wo.split` | 工单拆分 | 2 | 是 | 0 | 高 |
| `wo.stockin` | 生产入库单 | 8 | 是 | 0 | 高 |
| `wo.stockin.inspection` | 生产入库检验单 | 2 | 是 | 0 | 高 |
| `work.report` | 报工单 | 8 | 是 | 0 | 高 |

### 产品结构与工艺（`engineering`，7 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `bom` | 新增BOM | 8 | 是 | 0 | 高 |
| `ebom` | 查询EBOM | 5 | 是 | 0 | 高 |
| `ebom.change` | 变更单 | 8 | 是 | 0 | 高 |
| `ecn` | 变更单 | 8 | 是 | 0 | 高 |
| `engineering.item` | 工程品号 | 5 | 是 | 0 | 高 |
| `product.process` | 产品工艺路线 | 5 | 是 | 0 | 高 |
| `replace.substitute.item` | 取替代料 | 5 | 是 | 0 | 高 |

### 质量管理（`quality`，5 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `bad.cause` | 不良原因 | 2 | 是 | 0 | 高 |
| `computation.sampling.basis` | 计量抽查基础 | 2 | 是 | 0 | 高 |
| `inspection` | 检验项目 | 2 | 是 | 0 | 高 |
| `quality.control.category` | 品管类别 | 2 | 是 | 0 | 高 |
| `sampling.basis` | 抽查基础 | 2 | 是 | 0 | 高 |

### 基础资料（`base`，27 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `calendar` | 假日表 | 2 | 是 | 0 | 高 |
| `company.detail` | 公司 | 1 | — | 0 | 高 |
| `currency` | 币种 | 2 | 是 | 0 | 高 |
| `customer` | 客户 | 5 | 是 | 0 | 高 |
| `customer.item` | 客户品号 | 5 | 是 | 0 | 高 |
| `department` | 部门 | 2 | 是 | 0 | 高 |
| `document.type.general` | 单据性质 | 1 | — | 0 | 高 |
| `employee` | 员工 | 1 | — | 0 | 高 |
| `financial.institution` | 金融机构 | 2 | 是 | 0 | 高 |
| `function.category` | 职务类别 | 2 | 是 | 0 | 高 |
| `item` | 品号信息 | 5 | 是 | 0 | 高 |
| `item.classification` | 品号类别 | 5 | 是 | 0 | 高 |
| `item.count` | 盘点 | 1 | 是 | 0 | 高 |
| `item.customer.price` | 客户商品价格 | 5 | 是 | 0 | 高 |
| `item.inspection` | 品号检验项目 | 2 | 是 | 0 | 高 |
| `item.inventory.qty` | 品号库存 | 1 | — | 0 | 高 |
| `item.lot` | 批号 | 2 | 是 | 0 | 高 |
| `item.supplier.price` | 供应商料件价格 | 5 | 是 | 0 | 高 |
| `monthly.item.statistics` | 品号月档 | 2 | 是 | 0 | 高 |
| `plant` | 工厂 | 5 | 是 | 0 | 高 |
| `project` | 项目 | 5 | 是 | 0 | 高 |
| `receive.payment.term` | 付款条件 | 5 | 是 | 0 | 高 |
| `supplier` | 供应商 | 5 | 是 | 0 | 高 |
| `team.personnel` | 班组成员 | 5 | 是 | 0 | 高 |
| `unit` | 单位 | 3 | 是 | 0 | 高 |
| `warehouse` | 仓库 | 5 | 是 | 0 | 高 |
| `workstation` | 工作中心 | 5 | 是 | 0 | 高 |

### 会计总账（`finance`，3 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `account` | 会计科目 | 2 | 是 | 0 | 高 |
| `accounting.voucher` | 会计凭证 | 8 | 是 | 0 | 高 |
| `expense.invoice` | 费用发票 | 8 | 是 | 0 | 高 |

### 应收管理（`ar`，5 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `ar.refund.doc` | 应收退款单 | 8 | 是 | 0 | 高 |
| `collection.doc` | 收款单 | 8 | 是 | 0 | 高 |
| `other.payable.doc` | 其他应付单 | 8 | 是 | 0 | 高 |
| `other.receivable` | 其他应收单 | 8 | 是 | 0 | 高 |
| `precollection.doc` | 预收款单 | 8 | 是 | 0 | 高 |

### 应付管理（`ap`，3 个）

| type_key | 中文名 | 操作集 | 复合主键 | 单身表 | 置信度 |
|---|---|---|---|---|---|
| `ap.refund.doc` | 应付退款单 | 8 | 是 | 0 | 高 |
| `payable.doc` | 付款单 | 8 | 是 | 0 | 高 |
| `prepayment.doc` | 预付单 | 8 | 是 | 0 | 高 |

## 三、⚠️ 待人工确认的对象（禁止默认归域）

| type_key | 中文名 | 操作数 | 建议确认人 |
|---|---|---|---|
| `combination.order` | 组合单 | 8 | 实施顾问 |
| `split.order` | 拆解单 | 8 | 实施顾问 |

## 四、⚠️ 中置信对象（建议复核域归属）

| type_key | 现判域 | 判定依据 |
|---|---|---|
| `operation` | 生产管理 | 子串 `operation` 匹配 |

## 五、下一步

1. 实施顾问复核「待确认」与「中置信」两组，确认域归属
2. 补充**系统菜单树**（本草案只覆盖 TypeKey 视角，不含菜单层级）
3. 补充各域的中文业务名与业务术语（用于助手触发词设计）
4. 产出正式版 `menu-tree.md` + `menu-tree.csv`，替代本草案
