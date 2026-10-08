# 易飞(E10) 表间关联概览（ER 推断）

> 生成脚本：`scripts/gen-er-overview.py`
> 数据来源：`ADMMC-表名信息.xml`（1170 表）+ `ADMMD-字段信息.xml`（54842 字段）
> 节点名到物理表映射：`node-table-map.csv`（真机反推 31 条）

## 警告：本文档全部内容均为推断，非数据库声明

源数据（`ADMMC` / `ADMMD`）**不含外键约束、索引、默认值定义**。
下述关联由启发式规则推导，**不可直接用作建库依据**，仅供开发期参考与人工核验线索。

| 置信度 | 依据 | 可信度 |
|---|---|---|
| HIGH | 同模块 + 中文名一致 + 字段序号前缀相同 | 较可信（典型单头/单身对） |
| MID | 同模块 + 中文名一致 | 需人工确认 |
| LOW | 跨模块 + 中文名一致 | 仅为线索，误判率高 |

### 推断的已知局限

1. **无语义中文名不参与推断** —— 「预留字段」等出现在 5000+ 张表中，无区分度，已排除
2. **表数上限 40** —— 同一中文名若出现在超过 40 张表中，不做两两配对（否则组合爆炸）
3. **同模块假设** —— MID/HIGH 依赖 `MC004` 模块划分，模块划分本身可能有误
4. **仅覆盖同名字段** —— 若关联字段中文名不同（如「客户」vs「客户编号」），本方法无法发现

## 一、字段命名规律（推断基础）

```
字段名 = 表名末 2 位 + 3 位序号
例：PURTC -> TC001 / TC002；INVMB -> MB001 / ... / MB287
```

- 实测匹配率 **98.3%**（26330/26794，已排除 UDF 与管理字段）
- 完整分析见 `docs/plans/yf-field-naming-convention.md`

## 二、单据族单头/单身配对

按「表名前 4 位相同 + 其一以 C 结尾（视为单头）」推断，共 **936 对**。

| 族 | 单头表 | 单头中文名 | 单身表 | 单身中文名 | 模块 |
|---|---|---|---|---|---|
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTD` | 工单成本分配依据单身档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTE` | 部门成本分配率单头档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTF` | 部门成本分配率单身档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTI` | 成本计算单头档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTJ` | 成本计算单身档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTK` | 成本计算单身工单明细档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTL` | 产品成本单头月档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTM` | 产品成本单身月档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTN` | 完工率单头档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTO` | 完工率单身档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTP` | 成本计算单部门成本明细档 | ACM |
| ACMT | `ACMTC` | 工单成本分配依据单头档 | `ACMTQ` | 成本计算单产出数量明细档 | ACM |
| ACPL | `ACPLC` | 应付账款异动明细档 | `ACPLB` | 核销记录档 | ACP |
| ACPL | `ACPLC` | 核销记录档 | `ACPLD` | 应付调汇单头档 | ACP |
| ACPL | `ACPLC` | 核销记录档 | `ACPLE` | 应付调汇单身档 | ACP |
| ACRI | `ACRIC` | 收款单子单身档 | `ACRIA` | 核销分期记录档 | ACR |
| ACRI | `ACRIC` | 应收账款分期异动明细档 | `ACRIB` | 核销分期记录档 | ACR |
| ACRI | `ACRIC` | 核销分期记录档 | `ACRID` | 分期收款分期金额明细档 | ACR |
| ACRI | `ACRIC` | 核销分期记录档 | `ACRIE` | 调汇单子单身档 | ACR |
| ACRI | `ACRIC` | 核销分期记录档 | `ACRIF` | 销售发票开票底稿档 | ACR |
| ACRL | `ACRLC` | 应收账款异动明细档 | `ACRLB` | 核销记录档 | ACR |
| ACRL | `ACRLC` | 核销记录档 | `ACRLD` | 应收调汇单头档 | ACR |
| ACRL | `ACRLC` | 核销记录档 | `ACRLE` | 应收调汇单身档 | ACR |
| ACRM | `ACRMC` | 应收参数设置档 | `ACRMA` | 账龄区间单头档 | ACR |
| ACRM | `ACRMC` | 客户供应商信息档 | `ACRMB` | 账龄区间单头档 | ACR |
| ACRM | `ACRMC` | 账龄区间单头档 | `ACRMD` | 账龄区间单身档 | ACR |
| ACRM | `ACRMC` | 账龄区间单头档 | `ACRME` | 其他收支类型信息档 | ACR |
| ACTL | `ACTLC` | 公司凭证复制记录档 | `ACTLA` | 期初开账单头档 | ACT |
| ACTL | `ACTLC` | 现金流量表项目维护档 | `ACTLB` | 期初开账单头档 | ACT |
| ACTL | `ACTLC` | 期初开账单头档 | `ACTLD` | 期初开账单身档 | ACT |
| ACTL | `ACTLC` | 期初开账单头档 | `ACTLE` | 会计科目各期汇总档 | ACT |
| ACTL | `ACTLC` | 期初开账单头档 | `ACTLF` | 自动转账单头档 | ACT |
| ACTL | `ACTLC` | 期初开账单头档 | `ACTLG` | 自动转账单身档 | ACT |
| ACTM | `ACTMC` | 会计科目信息档 | `ACTMA` | 会计系统参数档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTME` | 科目部门设限档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMF` | 核算项目名称档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMG` | 会计期间设置单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMH` | 会计期间设置单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMI` | 预算编号名称档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMJ` | 科目/部门预算单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMK` | 科目/部门预算单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMO` | 分摊比率单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMP` | 分摊比率单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMQ` | 比率分摊金额来源档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMR` | 部门级次信息档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMS` | 现金流量表项目单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMS205` | 现金流量表项目单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMT` | 现金流量表项目单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMT205` | 现金流量表项目单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMU` | 自定义账册设置单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMV` | 自定义账册设置单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMW` | 销货-制造成本表设置单头档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMX` | 销货-制造成本表设置单身档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMY` | 预算追加/挪用资料档 | ACT |
| ACTM | `ACTMC` | 会计系统参数档 | `ACTMZ` | 销货-制造成本表设置类别档 | ACT |
| ACTT | `ACTTC` | 会计凭证单头档 | `ACTTA` | 常用凭证单头档 | ACT |
| ACTT | `ACTTC` | 会计凭证单身档 | `ACTTB` | 常用凭证单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTD` | 常用凭证单身档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTE` | 报表结构单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTF` | 报表结构单身档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTG` | 现金流量表格式单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTG205` | 现金流量表格式单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTH` | 现金流量表格式单身档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTH205` | 现金流量表格式单身档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTI` | 现金流量表格式单身科目明细档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTI205` | 现金流量表格式单身科目明细档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTJ` | 现金流量调整金额单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTK` | 现金流量调整金额单身档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTL` | 自定义报表结构单头档 | ACT |
| ACTT | `ACTTC` | 常用凭证单头档 | `ACTTM` | 自定义报表结构单身档 | ACT |
| ADMM | `ADMMC` | 系统信息 | `ADMMA` | 文档信息 | ADM |
| ADMM | `ADMMC` | 程序信息 | `ADMMB` | 文档信息 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMD` | 字段信息 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMME` | 组信息 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMF` | 用户信息 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMG` | 用户作业权限档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMH` | 作业扩展权限设置档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMP` | 程序信息 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMQ` | 电子表单关联单头档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMR` | 电子表单关联单身档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMS` | OLAP设置档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMT` | 用户限定基础数据档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMU` | 用户作业扩展权限设置档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMV` | 业务导航地图档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMW` | 业务导航用户信息档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMX` | 图片信息档 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMY` | 用户自定义菜单 | ADM |
| ADMM | `ADMMC` | 文档信息 | `ADMMZ` | 自定义F2开窗 | ADM |
| ADMO | `ADMOC` | 角色信息 | `ADMOA` | 角色成员信息 | ADM |
| ADMO | `ADMOC` | 组织信息档 | `ADMOB` | 角色成员信息 | ADM |
| ADMO | `ADMOC` | 角色成员信息 | `ADMOD` | 角色成员管理范围档 | ADM |
| ADMT | `ADMTC` | 传真/Email传送纪录信息档 | `ADMTA` | 待发消息档 | ADM |
| ADMT | `ADMTC` | 数据修改记录档 | `ADMTB` | 待发消息档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTD` | 已发消息档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTE` | 消息存档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTF` | 消息草稿档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTG` | 用户数据权限信息单头档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTH` | 用户数据权限信息单身档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTI` | 自定义信息参数档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTJ` | 自定义信息参数档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTK` | 自定义信息定义档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTL` | 自定义信息定义档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTM` | 自定义信息定义档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTN` | 自定义信息定义档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTO` | 上线效益指标档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTP` | 上线效益结果档 | ADM |
| ADMT | `ADMTC` | 待发消息档 | `ADMTQ` | 上线效益指标权限档 | ADM |
| AJSL | `AJSLC` | 来源单据记录档 | `AJSLA` | 发出商品记录档 | AJS |
| AJSL | `AJSLC` | 暂估回冲记录档 | `AJSLB` | 发出商品记录档 | AJS |
| AJSM | `AJSMC` | 自动分录参数设置档 | `AJSMA` | 分录性质设置单身档 | AJS |
| AJSM | `AJSMC` | 分录性质设置档 | `AJSMB` | 分录性质设置单身档 | AJS |
| AMSM | `AMSMC` | 刷卡信息定义档 | `AMSMA` | 刷卡暂存信息档 | AMS |
| AMSM | `AMSMC` | 员工每日班别档 | `AMSMB` | 刷卡暂存信息档 | AMS |
| AMSM | `AMSMC` | 刷卡暂存信息档 | `AMSMD` | 加班尾数设置信息档 | AMS |
| AMSM | `AMSMC` | 刷卡暂存信息档 | `AMSME` | 员工刷卡明细档 | AMS |
| AMSM | `AMSMC` | 刷卡暂存信息档 | `AMSMF` | 临时卡信息档 | AMS |
| ASMM | `ASMMC` | 参数设置档 | `ASMMA` | 产品验收项目单头档 | ASM |
| ASMM | `ASMMC` | 服务人员单身区域信息档 | `ASMMB` | 产品验收项目单头档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMD` | 产品验收项目单身档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMG` | 维修零件价格信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMH` | 服务紧急度信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMI` | 问卷信息单头档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMJ` | 问卷信息单身档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMK` | 故障类型信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMML` | 知识库信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMM` | 服务站点信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMN` | 服务人员信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMO` | 设备卡信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMP` | 设备卡过户历史信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMQ` | 服务人员库存信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMR` | 售后常用语信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMS` | 站别主管信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMT` | 服务中心信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMU` | 服务中心主管信息档 | ASM |
| ASMM | `ASMMC` | 产品验收项目单头档 | `ASMMV` | 服务人员代理信息档 | ASM |
| ASMT | `ASMTC` | 服务请求单信息档 | `ASMTA` | 维修合同单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单头档 | `ASMTB` | 维修合同单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTD` | 维修单单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTE` | 维修单单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTF` | 旧件返回单单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTG` | 旧件返回单单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTH` | 配件交易单单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTI` | 配件交易单单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTJ` | 安装验收单单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTK` | 安装验收单单身验收项目档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTL` | 安装验收单单身配件信息档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTM` | 维护合同单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTN` | 维护合同单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTO` | 服务请求单单身故障信息档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTP` | 巡检保养记录单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTQ` | 巡检保养记录单单身巡检项目档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTR` | 巡检保养记录单身配件信息档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTS` | 投诉处理单信息档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTT` | 满意度调查单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTU` | 满意度调查单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTV` | 服务回访单头档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTW` | 服务回访单身档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTX` | 服务请求单单身处理意见档 | ASM |
| ASMT | `ASMTC` | 维修合同单身档 | `ASMTY` | 维修单单身故障信息档 | ASM |
| ASTL | `ASTLC` | 资产信息每月统计单头档 | `ASTLA` | 资产固定比率分摊每月统计档 | AST |
| ASTL | `ASTLC` | 资产信息每月统计单身档 | `ASTLB` | 资产固定比率分摊每月统计档 | AST |
| ASTM | `ASTMC` | 资产类别编号档 | `ASTMA` | 资产信息单身档 | AST |
| ASTM | `ASTMC` | 资产信息单头档 | `ASTMB` | 资产信息单身档 | AST |
| ASTM | `ASTMC` | 资产信息单身档 | `ASTMD` | 资产固定比率分摊档 | AST |
| ASTM | `ASTMC` | 资产信息单身档 | `ASTME` | 固定资产参数设置档 | AST |
| ASTM | `ASTMC` | 资产信息单身档 | `ASTMF` | 资产盘点底稿单头 | AST |
| ASTM | `ASTMC` | 资产信息单身档 | `ASTMG` | 资产盘点底稿单身档 | AST |
| ASTT | `ASTTC` | 保险信息单头档 | `ASTTA` | 资产交易单头档 | AST |
| ASTT | `ASTTC` | 保险信息单身档 | `ASTTB` | 资产交易单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTD` | 资产交易单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTE` | 资产转移外送收回单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTF` | 资产转移单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTG` | 资产外送单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTH` | 资产收回单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTI` | 资产请购单单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTJ` | 资产请购单单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTK` | 资产询价单单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTL` | 资产询价单单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTM` | 资产采购单单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTN` | 资产采购单单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTO` | 资产进货单单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTP` | 资产进货单单身档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTQ` | 资产工作量记录单头档 | AST |
| ASTT | `ASTTC` | 资产交易单头档 | `ASTTR` | 资产工作量记录单身档 | AST |
| BMSM | `BMSMC` | 设置条码系统参数 | `BMSMA` | 记录序号条码档当前最大流水码 | BMS |
| BMSM | `BMSMC` | 设置条码编码规则 | `BMSMB` | 记录序号条码档当前最大流水码 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSMD` | 条码扫描作业信息临时档 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSME` | 装箱单信息单头档 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSMF` | 装箱单信息单身档 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSMG` | 品号条码档 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSMH` | 数量条码档 | BMS |
| BMSM | `BMSMC` | 记录序号条码档当前最大流水码 | `BMSMI` | 多前置单据临时档 | BMS |
| BOMC | `BOMCC` | BOM 信息单头档 | `BOMCA` | 元件群组单头档 | BOM |
| BOMC | `BOMCC` | BOM 信息单身档 | `BOMCB` | 元件群组单头档 | BOM |
| BOMC | `BOMCC` | 元件群组单头档 | `BOMCD` | 元件群组单身档 | BOM |
| BOMC | `BOMCC` | 元件群组单头档 | `BOMCE` | 替代群组单头档 | BOM |
| BOMC | `BOMCC` | 元件群组单头档 | `BOMCF` | 替代群组单身档 | BOM |
| BOMM | `BOMMC` | 取替代料单头档 | `BOMMA` | BOM 用量信息单头档 | BOM |
| BOMM | `BOMMC` | 取替代料单身档 | `BOMMB` | BOM 用量信息单头档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMD` | BOM 用量信息单身档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMME` | 产品工艺路线单头档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMF` | 产品工艺路线单身档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMG` | 标准作业程序档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMH` | 料件认可信息档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMI` | 工程品号基本信息档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMJ` | E-BOM 用量信息单头档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMK` | E-BOM 用量信息单身档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMML` | E-BOM参数设置档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMM` | E-BOM转BOM对照单头档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMN` | E-BOM转BOM对照单身档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMO` | BOM参数设置档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMP` | BOM子单身明细档 | BOM |
| BOMM | `BOMMC` | BOM 用量信息单头档 | `BOMMQ` | BOM分量损耗档 | BOM |
| BOMT | `BOMTC` | BOM变更单头档 | `BOMTA` | BOM 变更子单身档 | BOM |
| BOMT | `BOMTC` | BOM变更单身档 | `BOMTB` | BOM 变更子单身档 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTD` | 组合单单头信息 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTE` | 组合单单身信息 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTF` | 拆解单单头信息 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTG` | 拆解单单身信息 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTH` | 料件认可信息档 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTI` | E-BOM变更单头档 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTJ` | E-BOM变更单身档 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTK` | E-BOM变更子单身档 | BOM |
| BOMT | `BOMTC` | BOM 变更子单身档 | `BOMTL` | BOM分量损耗变更档 | BOM |
| CMSM | `CMSMC` | 共用参数设置档 | `CMSMA` | 仓库信息档 | CMS |
| CMSM | `CMSMC` | 工厂信息档 | `CMSMB` | 仓库信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMD` | 工作中心信息单头档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSME` | 部门信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMF` | 币种汇率档单头 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMG` | 币种汇率档单身 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMH` | 编码原则信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMI` | 假日表单头档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMJ` | 职务类别档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMK` | 职务人员档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSML` | 公司名称 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMM` | 常用语 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMO` | 金融机构信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMP` | 假日表单身档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMQ` | 各系统单据设置档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMR` | 交易对象分类方式档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMS` | 页脚/签核档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMT` | 程序页脚/签核档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMU` | 单别限定输入用户信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMV` | 员工基本信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMW` | 工艺档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMX` | 机器信息档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMY` | 每日产能单头档 | CMS |
| CMSM | `CMSMC` | 仓库信息档 | `CMSMZ` | 每日产能单身档 | CMS |
| COPA | `COPAC` | 合同单头信息档 | `COPAA` | 合同变更单单头信息档 | COP |
| COPA | `COPAC` | 合同单身信息档 | `COPAB` | 合同变更单单头信息档 | COP |
| COPA | `COPAC` | 合同变更单单头信息档 | `COPAD` | 合同变更单单身信息档 | COP |
| COPD | `COPDC` | 装配清单单头档 | `COPDA` | 客户订单子单身信息档 | COP |
| COPD | `COPDC` | 装配清单单身档 | `COPDB` | 客户订单子单身信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDD` | 零组件发货/退回单单头信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDE` | 零组件发货/退回单单身信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDF` | 安装调试通知单信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDG` | 安装调试单头信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDH` | 安装调试单身费用明细信息档 | COP |
| COPD | `COPDC` | 客户订单子单身信息档 | `COPDI` | 安装调试机器信息档 | COP |
| COPE | `COPEC` | 自动报价参数设置档 | `COPEA` | 自定义报价参数档 | COP |
| COPE | `COPEC` | 录入报价组成信息 | `COPEB` | 自定义报价参数档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPED` | 录入参数值单头档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEE` | 录入参数值单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEF` | 报价分类单头档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEG` | 报价分类单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEH` | 报价分类子单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEI` | 报价分类总价折扣规则档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEJ` | 报价权限单头档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEK` | 报价权限单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEL` | 报价权限子单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEM` | 录入自动报价单状态 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEN` | 自动报价单头档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEO` | 自动报价单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEP` | 自动报价子单身档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPEQ` | 自动报价子单头档 | COP |
| COPE | `COPEC` | 自定义报价参数档 | `COPER` | 报价分类参数信息子单头档 | COP |
| COPI | `COPIC` | 分期收款信息单头 | `COPIA` | 分期收款变更信息单头 | COP |
| COPI | `COPIC` | 分期收款信息单身 | `COPIB` | 分期收款变更信息单头 | COP |
| COPI | `COPIC` | 分期收款变更信息单头 | `COPID` | 分期收款变更信息单身 | COP |
| COPM | `COPMC` | 客户基本信息档 | `COPMA` | 客户商品价格单身信息档 | COP |
| COPM | `COPMC` | 客户商品价格单头信息档 | `COPMB` | 客户商品价格单身信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMD` | 客户地址信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPME` | 销售预测单头信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMF` | 销售预测单身信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMG` | 客户品号信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMH` | 信用控制参数设置档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMI` | 客户赠备品单头信息档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMJ` | 客户品号赠备品率单身档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMK` | 客户与仓库对照档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPML` | 预测维护单头档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMM` | 预测维护单身档 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMN` | 零组件发货清单模版单头 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMO` | 零组件发货清单模版单身 | COP |
| COPM | `COPMC` | 客户商品价格单身信息档 | `COPMP` | 预测参数档 | COP |
| COPT | `COPTC` | 报价单单头档 | `COPTA` | 客户订单单头信息档 | COP |
| COPT | `COPTC` | 报价单单身档 | `COPTB` | 客户订单单头信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTD` | 客户订单单身信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTE` | 订单变更单头信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTF` | 订单变更单身信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTG` | 销货单单头档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTH` | 销货单单身档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTI` | 销退单单头档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTJ` | 销退单单身档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTK` | 报价单单身明细档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTL` | 发票号码信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTM` | 订单选配档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTN` | 出货通知单头档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTO` | 出货通知单身 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTP` | 订单变更选配档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTQ` | 产品配置单头档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTR` | 产品配置单身档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTS` | 客户信息变更单头档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTT` | 客户信息变更单身档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTU` | 客户地址变更信息档 | COP |
| COPT | `COPTC` | 客户订单单头信息档 | `COPTV` | 产品配置分量损耗档 | COP |
| CSTL | `CSTLC` | 标准成本月档 | `CSTLA` | 成本年月低阶码档 | CST |
| CSTL | `CSTLC` | 标准成本差异重估维护档 | `CSTLB` | 成本年月低阶码档 | CST |
| CSTM | `CSTMC` | 成本参数设置档 | `CSTMA` | 工作中心成本档 | CST |
| CSTM | `CSTMC` | 工单工时档 | `CSTMB` | 工作中心成本档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTME` | 产品成本档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTMF` | 联产品成本分摊比率档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTMG` | 成本计算条件设定档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTMH` | 本阶标准成本设定单头档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTMI` | 本阶标准成本设定单身档 | CST |
| CSTM | `CSTMC` | 工作中心成本档 | `CSTMK` | 工单工作中心成本档 | CST |
| CUSM | `CUSMC` | 合同品号类别信息档 | `CUSMA` | 合同品号对照档 | CUS |
| CUSM | `CUSMC` | 合同品号信息档 | `CUSMB` | 合同品号对照档 | CUS |
| CUSM | `CUSMC` | 合同品号对照档 | `CUSMD` | 合同材料用量单头档 | CUS |
| CUSM | `CUSMC` | 合同品号对照档 | `CUSME` | 合同材料用量单身档 | CUS |
| CUSM | `CUSMC` | 合同品号对照档 | `CUSMF` | 保税交易代码单头档 | CUS |
| CUSM | `CUSMC` | 合同品号对照档 | `CUSMG` | 保税交易代码单身档 | CUS |
| CUSM | `CUSMC` | 合同品号对照档 | `CUSMH` | 征免性质基本信息档 | CUS |
| CUST | `CUSTC` | 合同信息单头档 | `CUSTA` | 合同材料信息单身档 | CUS |
| CUST | `CUSTC` | 合同成品信息单身档 | `CUSTB` | 合同材料信息单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTD` | 合同信息变更单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTE` | 合同成品信息变更单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTF` | 合同材料信息变更单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTG` | 合同信息结转单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTH` | 合同成品信息结转单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTI` | 合同材料信息结转单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTJ` | 分手册单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTK` | 分手册成品单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTL` | 分手册材料单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTM` | 交易单据单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTN` | 交易单据单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTO` | 转厂申请单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTP` | 转厂申请单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTR` | 转厂维护单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTS` | 转厂维护单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTU` | 设备申请单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTV` | 设备申请单身档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTW` | 设备维护单头档 | CUS |
| CUST | `CUSTC` | 合同材料信息单身档 | `CUSTX` | 设备维护单身档 | CUS |
| DSCM | `DSCMC` | 登录者编号信息 | `DSCMA` | 个案凭证/审核对照档 | DSC |
| DSCM | `DSCMC` | 公司编号信息 | `DSCMB` | 个案凭证/审核对照档 | DSC |
| DSCM | `DSCMC` | 个案凭证/审核对照档 | `DSCMD` | 用户自定义设置档 | DSC |
| DSCM | `DSCMC` | 个案凭证/审核对照档 | `DSCME` | 密码安全策略单头档 | DSC |
| DSCM | `DSCMC` | 个案凭证/审核对照档 | `DSCMF` | 密码安全策略单身档 | DSC |
| DSCM | `DSCMC` | 个案凭证/审核对照档 | `DSCMG` | 用户历史密码记录 | DSC |
| EFSM | `EFSMC` | 电子签核传输栏位设置单头档 | `EFSMD` | 电子签核传输栏位设置单身档 | EFS |
| EFSM | `EFSMC` | 电子签核传输栏位设置单头档 | `EFSME` | 电子签核送签信息记录档 | EFS |
| EISL | `EISLC` | 财务信息汇总档 | `EISLA` | 盘盈盘亏分析信息汇总档 | EIS |
| EISL | `EISLC` | 存货分析信息汇总档 | `EISLB` | 盘盈盘亏分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLD` | 采购分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLE` | 工单分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLF` | 工作中心分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLG` | 产品成本分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLH` | 委外加工分析信息汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLI` | 应收账款账龄分析汇总档 | EIS |
| EISL | `EISLC` | 盘盈盘亏分析信息汇总档 | `EISLJ` | 人事薪资出勤信息汇总档 | EIS |
| EPSM | `EPSMC` | 出口费用编号信息档 | `EPSMA` | 商品包装信息单身 | EPS |
| EPSM | `EPSMC` | 商品包装信息单头 | `EPSMB` | 商品包装信息单身 | EPS |
| EPSM | `EPSMC` | 商品包装信息单身 | `EPSMD` | 客户唛头信息 | EPS |
| EPST | `EPSTC` | 出货通知单头 | `EPSTA` | 包装明细信息档 | EPS |
| EPST | `EPSTC` | 出货通知单身 | `EPSTB` | 包装明细信息档 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTD` | 货运通知单头 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTE` | 货运通知单身 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTF` | 信用证信息单头 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTG` | 信用证信息单身 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTH` | 出口费用信息单头档 | EPS |
| EPST | `EPSTC` | 包装明细信息档 | `EPSTI` | 出口费用信息单身档 | EPS |
| EQTM | `EQTMC` | 设备管理参数档 | `EQTMA` | 设备型号档 | EQT |
| EQTM | `EQTMC` | 设备类别档 | `EQTMB` | 设备型号档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMD` | 型号属性档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTME` | 备件信息档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMF` | 周期信息单头档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMG` | 周期信息单身档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMH` | 设备处理结果定义档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMI` | 设备状态定义档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMJ` | 设备信息档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTML` | 设备保修方案档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMM` | 设备属性档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMN` | 保修方案定义单头档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMP` | 保修方案定义单身档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMQ` | 保修方案料件需求档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMR` | 故障类别档 | EQT |
| EQTM | `EQTMC` | 设备型号档 | `EQTMS` | 故障代码档 | EQT |
| EQTT | `EQTTC` | 送检单单头档 | `EQTTA` | 送检返还单单头档 | EQT |
| EQTT | `EQTTC` | 送检单单身档 | `EQTTB` | 送检返还单单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTD` | 送检返还单单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTE` | 保修单单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTF` | 保修单单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTG` | 保修单料件需求档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTJ` | 设备变更档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTK` | 运行记录单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTL` | 运行记录单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTM` | 故障记录单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTN` | 故障记录单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTO` | 产品模具关系单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTP` | 产品模具关系单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTQ` | 工单模具关系信息档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTR` | 工单模具关系子单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTS` | 领用单单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTT` | 领用单单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTU` | 归还单单头档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTV` | 归还单单身档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTW` | 进货单模具关系信息档 | EQT |
| EQTT | `EQTTC` | 送检返还单单头档 | `EQTTX` | 进货单模具关系子单身档 | EQT |
| FACT | `FACTC` | 银行对账单单头档 | `FACTA` | 银行存款日记账单头档 | FAC |
| FACT | `FACTC` | 银行对账单单身档 | `FACTB` | 银行存款日记账单头档 | FAC |
| FACT | `FACTC` | 银行存款日记账单头档 | `FACTD` | 银行存款日记账单身档 | FAC |
| FACT | `FACTC` | 银行存款日记账单头档 | `FACTE` | 银行存款余额调节单头档 | FAC |
| FACT | `FACTC` | 银行存款日记账单头档 | `FACTF` | 银行未达余额调节单身档 | FAC |
| FACT | `FACTC` | 银行存款日记账单头档 | `FACTG` | 企业未达余额调节单身档 | FAC |
| FCSM | `FCSMC` | 合并报表参数设置档 | `FCSMA` | 合并报表项目单头档 | FCS |
| FCSM | `FCSMC` | 子公司信息档 | `FCSMB` | 合并报表项目单头档 | FCS |
| FCSM | `FCSMC` | 合并报表项目单头档 | `FCSMD` | 合并报表项目单身档 | FCS |
| FCSM | `FCSMC` | 合并报表项目单头档 | `FCSME` | 合并报表项目子单身档 | FCS |
| FCSM | `FCSMC` | 合并报表项目单头档 | `FCSMF` | 抵销平衡式档 | FCS |
| FCST | `FCSTC` | 合并报表结构单头档 | `FCSTA` | 公司报表项目数据单头档 | FCS |
| FCST | `FCSTC` | 合并报表结构单身档 | `FCSTB` | 公司报表项目数据单头档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTD` | 公司报表项目数据单身档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTE` | 个别报表项目数据单头档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTF` | 个别报表项目数据单身档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTG` | 抵销分录单头档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTH` | 抵销分录单身档 | FCS |
| FCST | `FCSTC` | 公司报表项目数据单头档 | `FCSTI` | 工作底稿档 | FCS |
| GFCL | `GFCLC` | 集团会计科目各期汇总档 | `GFCLA` | 集团现金流量表项目维护档 | GFC |
| GFCL | `GFCLC` | 集团费用预算数汇总档 | `GFCLB` | 集团现金流量表项目维护档 | GFC |
| GFCL | `GFCLC` | 集团现金流量表项目维护档 | `GFCLD` | 集团现金流量调整金额单头档 | GFC |
| GFCL | `GFCLC` | 集团现金流量表项目维护档 | `GFCLE` | 集团现金流量调整金额单身档 | GFC |
| GFCM | `GFCMC` | 组织结构版本信息档 | `GFCMA` | 集团组织成员关系档 | GFC |
| GFCM | `GFCMC` | 集团组织成员信息档 | `GFCMB` | 集团组织成员关系档 | GFC |
| GFCM | `GFCMC` | 集团组织成员关系档 | `GFCMD` | 集团科目部门人员设置档 | GFC |
| GFCM | `GFCMC` | 集团组织成员关系档 | `GFCME` | 集团基础资料发布/凭证数据收集LOG档 | GFC |
| GFCM | `GFCMC` | 集团组织成员关系档 | `GFCMK` | 集团费用设置档 | GFC |
| GFCT | `GFCTC` | 集团会计凭证单头档 | `GFCTA` | 集团抵销分录单头档 | GFC |
| GFCT | `GFCTC` | 集团会计凭证单身档 | `GFCTB` | 集团抵销分录单头档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTD` | 集团抵销分录单身档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTE` | 集团费用预算单头档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTF` | 集团费用预算单身档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTG` | 集团费用预算分期明细档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTH` | 集团费用预算调整单头档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTI` | 集团费用预算调整单身档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTJ` | 集团费用预算调整分期明细档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTN` | 集团费用报销单单头档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTO` | 集团费用报销单单身档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTP` | 集团费用调整单头档 | GFC |
| GFCT | `GFCTC` | 集团抵销分录单头档 | `GFCTQ` | 集团费用调整单身档 | GFC |
| GMPM | `GMPMC` | 设置GMP参数信息档 | `GMPMA` | 检验周期单身信息档 | GMP |
| GMPM | `GMPMC` | 检验周期单头信息档 | `GMPMB` | 检验周期单身信息档 | GMP |
| GMPM | `GMPMC` | 检验周期单身信息档 | `GMPMD` | 洁净室等级信息档 | GMP |
| GMPM | `GMPMC` | 检验周期单身信息档 | `GMPME` | 录入洁净室信息档 | GMP |
| GMPM | `GMPMC` | 检验周期单身信息档 | `GMPMF` | 工艺用水类别检验项目单头信息档 | GMP |
| GMPM | `GMPMC` | 检验周期单身信息档 | `GMPMG` | 工艺用水类别检验项目单身信息档 | GMP |
| GMPT | `GMPTC` | 洁净室检验单信息档 | `GMPTA` | 工艺用水检验单单身信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单头信息档 | `GMPTB` | 工艺用水检验单单身信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTD` | 清场记录单信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTE` | 准产证信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTF` | 批生产记录审核信息单头档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTG` | 批生产记录审核信息单身档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTH` | 留样单信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTI` | 留样检验单头信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTJ` | 留样检验单身信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTK` | 留样检验单不良原因档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTL` | 养护检验单头信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTM` | 养护检验单身信息档 | GMP |
| GMPT | `GMPTC` | 工艺用水检验单单身信息档 | `GMPTN` | 养护检验单不良原因档 | GMP |
| GSPM | `GSPMC` | GSP系统参数档 | `GSPMA` | 仪器设备信息档 | GSP |
| GSPM | `GSPMC` | 药检所信息 | `GSPMB` | 仪器设备信息档 | GSP |
| GSPM | `GSPMC` | 仪器设备信息档 | `GSPMD` | 审批材料单头档 | GSP |
| GSPM | `GSPMC` | 仪器设备信息档 | `GSPME` | 审批材料单身档 | GSP |
| GSPT | `GSPTC` | 首营企业审批档 | `GSPTA` | 进货检验信息档 | GSP |
| GSPT | `GSPTC` | 首营品种审批档 | `GSPTB` | 进货检验信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTD` | 抽送检单信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTE` | 质量复检通知单信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTF` | 药品停售通知单单头信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTG` | 药品停售通知单单身信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTH` | 客户限销商品单头信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTI` | 客户限销商品单身信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTJ` | 员工限销商品单头信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTK` | 员工限销商品单身信息档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTL` | 药品养护记录单头档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTM` | 药品养护记录单身档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTN` | 仓库温湿度记录档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTO` | 设备养护使用记录单头档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTP` | 设备养护使用记录单身档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTQ` | 报损药品销毁单单头档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTR` | 报损药品销毁单单身档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTS` | 商品质量查询反馈档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTT` | 用户质量查询/投诉档 | GSP |
| GSPT | `GSPTC` | 进货检验信息档 | `GSPTU` | 仓库温湿度记录单身档 | GSP |
| HRSM | `HRSMC` | 人力资源参数设定档 | `HRSMB` | 费用信息档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMD` | 部门人力预算单头档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSME` | 部门人力预算单身档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMF` | 评价因素资料档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMG` | 部门职务评价因素设定单头 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMH` | 部门职务评价因素设定单身 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMI` | 课程分类档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMJ` | 课程信息单头档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMK` | 培训信息档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSML` | 场地分类资料档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMM` | 场地信息档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMN` | 讲师资料档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMO` | 年度培训计划单头档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMP` | 年度培训计划单身档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMQ` | 培训经费预算单头档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMR` | 培训经费预算单身档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMS` | 课程信息单身档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMT` | 教育培训编码原则资料档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMV` | 人才来源信息档 | HRS |
| HRSM | `HRSMC` | 费用信息档 | `HRSMX` | 专案信息档 | HRS |
| HRST | `HRSTC` | 人才资料档 | `HRSTA` | 人员工作经验档 | HRS |
| HRST | `HRSTC` | 人员教育经历档 | `HRSTB` | 人员工作经验档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTD` | 人员特长和技能档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTE` | 人员语言能力档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTF` | 人员证书档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTG` | 人力需求申请单单头资料档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTH` | 应试记录单头档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTI` | 应试记录单身档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTJ` | 录用人员资料维护档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTK` | 培训申请资料单头档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTL` | 培训申请资料单身档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTM` | 培训申请子单头档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTN` | 培训结果单头档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTO` | 培训结果单身档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTP` | 培训结果费用分摊单头档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTQ` | 培训结果费用分摊单身档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTR` | 家庭成员基本资料档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTU` | 项目经验档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTV` | 人力需求申请单单身资料档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTW` | 人力需求申请变更单单单头资料档 | HRS |
| HRST | `HRSTC` | 人员工作经验档 | `HRSTX` | 人力需求申请单单身资料档 | HRS |
| INTL | `INTLC` | 品号记录档 | `INTLA` | 币种记录档 | INT |
| INTL | `INTLC` | 品号计量单位记录档 | `INTLB` | 币种记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLD` | 职员记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLE` | 客户记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLF` | 订单变更记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLG` | 订单记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLH` | 班组记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLI` | 计件明细记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLJ` | BOM变更单头记录档 | INT |
| INTL | `INTLC` | 币种记录档 | `INTLK` | BOM变更单身记录档 | INT |
| INVL | `INVLC` | 交易明细信息档 | `INVLA` | 品号每月统计单身 | INV |
| INVL | `INVLC` | 品号每月统计单头 | `INVLB` | 品号每月统计单身 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLD` | 品号项目管理档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLE` | 品号每月统计子单身 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLF` | 入库单结存信息档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLG` | 出库核销明细档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLH` | 库存交易成本要素明细档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLI` | 库存交易成本要素结转档(已结存年月的历史档) | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLJ` | 品号每月统计要素明细档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLM` | 成本要素出库核销明细档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLN` | 品号批号每月统计档 | INV |
| INVL | `INVLC` | 品号每月统计单身 | `INVLP` | 品号批号每月统计要素明细档 | INV |
| INVM | `INVMC` | 品号类别信息档 | `INVMA` | 品号仓库档 | INV |
| INVM | `INVMC` | 品号基本信息档 | `INVMB` | 品号仓库档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMD` | 品号换算单位档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVME` | 品号批号信息单头 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMF` | 品号批号信息单身 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMG` | NetChange记录档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMH` | 商品条码信息档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMI` | 品号属性资料单头档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMJ` | 品号特征信息单头档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMK` | 品号特征对应信息单身档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVML` | 品号仓库库位档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMM` | 品号限制存放位置档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMN` | 品号供应商采购比率信息档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMP` | 品号属性资料单身档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMQ` | 基本单位信息档 | INV |
| INVM | `INVMC` | 品号仓库档 | `INVMR` | 品号主要仓库(工厂)信息档 | INV |
| INVT | `INVTC` | 交易单据单头档 | `INVTA` | 盘点底稿信息档单身 | INV |
| INVT | `INVTC` | 交易单据单身档 | `INVTB` | 盘点底稿信息档单身 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTD` | 盘点信息汇总档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTE` | 盘点底稿信息档单头 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTF` | 借出入调拨单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTG` | 借出入调拨单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTH` | 借出入归还单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTI` | 借出入归还单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTJ` | 成本开账/调整单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTK` | 成本开账/调整单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTL` | 报废单单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTM` | 报废单单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTN` | 销毁单单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTO` | 销毁单单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTP` | 成本开账/调整单子单身档-成本要素 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTQ` | 品号变更单头档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTR` | 品号变更单身档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTS` | 品号仓库变更档 | INV |
| INVT | `INVTC` | 盘点底稿信息档单身 | `INVTT` | 品号换算单位变更档 | INV |
| IPST | `IPSTC` | 预付购料信息单头 | `IPSTA` | 预付购料信息变更单头 | IPS |
| IPST | `IPSTC` | 预付购料信息单身 | `IPSTB` | 预付购料信息变更单头 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTD` | 预付购料信息变更单身 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTE` | S/I 信息单头档 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTF` | S/I 信息单身档 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTG` | 报关/赎单信息单头档 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTH` | 报关/赎单费用信息档 | IPS |
| IPST | `IPSTC` | 预付购料信息变更单头 | `IPSTI` | 报关/赎单信息单身档 | IPS |
| ITMT | `ITMTC` | 维护函数信息单头档 | `ITMTA` | 维护函数信息返回值档 | ITM |
| ITMT | `ITMTC` | 维护函数信息参数档 | `ITMTB` | 维护函数信息返回值档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTD` | 维护议题指标树单头档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTE` | 维护议题指标树指标明细档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTF` | 维护议题指标树指标参数档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTG` | 维护议题指标树指标子明细 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTH` | 维护议题指标树参考值设置 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTI` | 议题指标树信息相关作业 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTJ` | 公版能力信息档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTK` | 公版指标明细档 | ITM |
| ITMT | `ITMTC` | 维护函数信息返回值档 | `ITMTL` | 周起始日设置档 | ITM |
| KBSM | `KBSMC` | 看板系统参数档 | `KBSMA` | 交货时段信息档 | KBS |
| KBSM | `KBSMC` | 看板类别设定档 | `KBSMB` | 交货时段信息档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMD` | 交货周期日单头档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSME` | 交货周期日单身档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMF` | 看板计算公式设定档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMG` | 看板计算公式参数档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMH` | 生产看板维护单头档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMI` | 生产看板维护单身档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMJ` | 采购看板维护单头档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMK` | 采购看板维护单身档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSML` | 看板序号维护单头档 | KBS |
| KBSM | `KBSMC` | 交货时段信息档 | `KBSMM` | 看板序号维护单身档 | KBS |
| KBST | `KBSTC` | 刷读产生采购单单头档 | `KBSTA` | 刷读产生工单单头档 | KBS |
| KBST | `KBSTC` | 刷读产生采购单单身档 | `KBSTB` | 刷读产生工单单头档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTD` | 刷读产生工单单身档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTE` | 刷读产生生产入库单单头档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTF` | 刷读产生生产入库单单身档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTG` | 进货单子单身档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTH` | 刷读产生调拨单单头档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTI` | 刷读产生调拨单单身档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTJ` | 刷读产生销货单单头档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTK` | 刷读产生销货单单身档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTL` | 刷读冻结/反冻结看板单头档 | KBS |
| KBST | `KBSTC` | 刷读产生工单单头档 | `KBSTM` | 刷读冻结/反冻结看板单身档 | KBS |
| LRPL | `LRPLC` | 计划来源纪录单头档 | `LRPLA` | 计划工作号记录单头档 | LRP |
| LRPL | `LRPLC` | 计划来源纪录单身档 | `LRPLB` | 计划工作号记录单头档 | LRP |
| LRPT | `LRPTC` | 生产计划档 | `LRPTA` | 采购计划档 | LRP |
| LRPT | `LRPTC` | 相关需求档 | `LRPTB` | 采购计划档 | LRP |
| LRPT | `LRPTC` | 采购计划档 | `LRPTE` | 生产计划每日产量档 | LRP |
| MOCC | `MOCCC` | 委外到货单单头档 | `MOCCD` | 委外到货单单身档 | MOC |
| MOCM | `MOCMC` | 委外计价档 | `MOCMA` | 委外计价单身档 | MOC |
| MOCM | `MOCMC` | 工单系统参数档 | `MOCMB` | 委外计价单身档 | MOC |
| MOCT | `MOCTC` | 工单单头档 | `MOCTA` | 领/退料单头档 | MOC |
| MOCT | `MOCTC` | 工单单身档 | `MOCTB` | 领/退料单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTD` | 领/退料工单信息档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTE` | 领/退料单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTF` | 生产入库单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTG` | 生产入库单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTH` | 委外进货单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTI` | 委外进货单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTJ` | 委外验退件退回信息档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTK` | 委外退货单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTL` | 委外退货单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTM` | 委外核价单头 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTN` | 委外核价单身 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTO` | 工单变更单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTP` | 工单变更单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTQ` | 工单联产品成本计算参数档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTR` | 挪料单单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTS` | 挪料单单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTT` | 挪料工单信息档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTU` | 工单拆分单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTV` | 工单拆分单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTW` | 入库转领料单单头档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTX` | 入库转领料单单身档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTY` | 工单每日产量档 | MOC |
| MOCT | `MOCTC` | 领/退料单头档 | `MOCTZ` | 工单变更单每日产量档 | MOC |
| MOCU | `MOCUC` | 工单拆分子单身档 | `MOCUA` | 领料通知单单身档 | MOC |
| MOCU | `MOCUC` | 领料通知单单头档 | `MOCUB` | 领料通知单单身档 | MOC |
| MOCU | `MOCUC` | 领料通知单单身档 | `MOCUD` | 委外核价单单身明细档 | MOC |
| MPSM | `MPSMC` | MPS参数设置档 | `MPSMA` | 品号资源信息档 | MPS |
| MPSM | `MPSMC` | 资源信息档 | `MPSMB` | 品号资源信息档 | MPS |
| MPST | `MPSTC` | 排程来源档 | `MPSTA` | 每日排程信息档 | MPS |
| MPST | `MPSTC` | 排程计划档 | `MPSTB` | 每日排程信息档 | MPS |
| MPST | `MPSTC` | 每日排程信息档 | `MPSTD` | 每日资源产能档 | MPS |
| MPST | `MPSTC` | 每日排程信息档 | `MPSTE` | 工单每日产量信息档 | MPS |
| MPST | `MPSTC` | 每日排程信息档 | `MPSTF` | 资源耗用明细档 | MPS |
| MRPM | `MRPMC` | MRP参数设置档 | `MRPMA` | 间距设置单身档 | MRP |
| MRPM | `MRPMC` | 间距设置单头档 | `MRPMB` | 间距设置单身档 | MRP |
| MRPM | `MRPMC` | 间距设置单身档 | `MRPMD` | MRP计划条件设置档 | MRP |
| MRPM | `MRPMC` | 间距设置单身档 | `MRPME` | 间距编号单身档 | MRP |
| MRPT | `MRPTC` | MRP供需汇总单头档 | `MRPTA` | MRP供需明细档 | MRP |
| MRPT | `MRPTC` | MRP供需汇总单身档 | `MRPTB` | MRP供需明细档 | MRP |
| MTPM | `MTPMC` | 多角贸易流程编号单头信息档 | `MTPMA` | 多角贸易对照结构单头信息档 | MTP |
| MTPM | `MTPMC` | 多角贸易流程编号单身信息档 | `MTPMB` | 多角贸易对照结构单头信息档 | MTP |
| MTPM | `MTPMC` | 多角贸易对照结构单头信息档 | `MTPMD` | 多角贸易对照结构单身信息档 | MTP |
| MTPT | `MTPTC` | 多角贸易计价及调拨单价单头信息档 | `MTPTA` | 多角贸易计价及调拨单价子单身信息档 | MTP |
| MTPT | `MTPTC` | 多角贸易计价及调拨单价单身信息档 | `MTPTB` | 多角贸易计价及调拨单价子单身信息档 | MTP |
| MTPT | `MTPTC` | 多角贸易计价及调拨单价子单身信息档 | `MTPTD` | 多角贸易采购单价维护信息档 | MTP |
| MTPT | `MTPTC` | 多角贸易计价及调拨单价子单身信息档 | `MTPTE` | 多角贸易抛转纪录档 | MTP |
| NOTM | `NOTMC` | 银行账号信息单头档 | `NOTMA` | 融资种类档 | NOT |
| NOTM | `NOTMC` | 银行账号信息单身档 | `NOTMB` | 融资种类档 | NOT |
| NOTM | `NOTMC` | 融资种类档 | `NOTMD` | 票据科目设置档 | NOT |
| NOTM | `NOTMC` | 融资种类档 | `NOTME` | 信贷银行融资额度单头档 | NOT |
| NOTM | `NOTMC` | 融资种类档 | `NOTMF` | 信贷银行融资额度单身档 | NOT |
| NOTM | `NOTMC` | 融资种类档 | `NOTMG` | 银行对账单引入格式单头档 | NOT |
| NOTM | `NOTMC` | 融资种类档 | `NOTMH` | 银行对账单引入格式单身档 | NOT |
| NOTT | `NOTTC` | 应付票据单头档 | `NOTTA` | 应收票据单头档 | NOT |
| NOTT | `NOTTC` | 应付票据单身档 | `NOTTB` | 应收票据单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTD` | 应收票据单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTE` | 预计收支档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTF` | 银行存款提款单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTG` | 银行存款提款单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTH` | 票据融资单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTI` | 票据融资单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTJ` | 抵押借款单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTK` | 借/还款单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTL` | 借/还款单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTM` | 融/撤票单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTN` | 融/撤票单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTO` | 抵押借款单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTP` | 银行对账单单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTQ` | 银行对账单单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTR` | 银行存款日记账单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTS` | 银行存款日记账单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTT` | 银行存款余额调节单头档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTV` | 银行未达余额调节单身档 | NOT |
| NOTT | `NOTTC` | 应收票据单头档 | `NOTTW` | 企业未达余额调节单身档 | NOT |
| OMSM | `OMSMC` | 费用参数设置档 | `OMSMA` | 费用预算项目单头档 | OMS |
| OMSM | `OMSMC` | 费用项目信息档 | `OMSMB` | 费用预算项目单头档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMD` | 费用预算项目单身档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSME` | 自定义费用单据参数字段单头档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMF` | 自定义费用单据参数字段单身档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMG` | 费用预算方案单头档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMH` | 费用预算方案单身档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMI` | 员工借款信用设置单头档 | OMS |
| OMSM | `OMSMC` | 费用预算项目单头档 | `OMSMJ` | 员工借款信用设置单身档 | OMS |
| OMST | `OMSTC` | 费用预算单头档 | `OMSTA` | 费用预算分期明细档 | OMS |
| OMST | `OMSTC` | 费用预算单身档 | `OMSTB` | 费用预算分期明细档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTD` | 费用预算调整单头档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTE` | 费用预算调整单身档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTF` | 费用预算调整分期明细档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTG` | 费用申请单据档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTH` | 费用借款单据档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTI` | 费用还款单据档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTJ` | 费用报销单单头档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTK` | 费用报销单单身档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTL` | 费用调整单头档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTM` | 费用调整单身档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTN` | 其他费用申请单单头档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTO` | 其他费用申请单单身档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTP` | 其他费用单头档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTQ` | 其他费用单单身档 | OMS |
| OMST | `OMSTC` | 费用预算分期明细档 | `OMSTR` | 费用申请单单身档 | OMS |
| PALL | `PALLC` | 社会褔利金月缴费单头档 | `PALLA` | 计件工资月档 | PAL |
| PALL | `PALLC` | 社会褔利金月缴费单身档 | `PALLB` | 计件工资月档 | PAL |
| PALL | `PALLC` | 计件工资月档 | `PALLD` | 计件工资日档 | PAL |
| PALM | `PALMC` | 基本条件设置档 | `PALMA` | 请假扣款条件设置档 | PAL |
| PALM | `PALMC` | 津贴扣款条件设置档 | `PALMB` | 请假扣款条件设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMD` | 加班条件设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALME` | 全勤奖金条件设置 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMF` | 员工加扣款设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMG` | 所得税条件设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMH` | 职等信息档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMI` | 学历编号档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMJ` | 特休天数设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMK` | 班别信息档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALML` | 劳健保补助等级档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMM` | 投保身分保费设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMN` | 劳保投保等级设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMO` | 健保投保等级设置档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMP` | 金融转存信息档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMQ` | 薪资会计科目设置单头档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMR` | 薪资会计科目设置单身档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMS` | 扣缴税额设置单头档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMT` | 扣缴税额设置单身档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMU` | 事务所信息档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMW` | 税率表设置单头档 | PAL |
| PALM | `PALMC` | 请假扣款条件设置档 | `PALMX` | 税率表设置单身档 | PAL |
| PALN | `PALNC` | 社会褔利金身份类型单头档 | `PALNA` | 社会褔利金基数设置档 | PAL |
| PALN | `PALNC` | 社会褔利金身份类型单身档 | `PALNB` | 社会褔利金基数设置档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALND` | 员工褔利金基数档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNE` | 员工学历档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNF` | 员工经历档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNG` | 员工专长档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNH` | 员工语言能力档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNI` | 员工证书档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNJ` | 纳税公司信息档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNK` | 员工家庭成员档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNL` | 员工项目经验档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNM` | 产品计件单价单头档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNN` | 产品计件单价单身档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNO` | 班组成员信息单头档 | PAL |
| PALN | `PALNC` | 社会褔利金基数设置档 | `PALNP` | 班组成员信息单身档 | PAL |
| PALT | `PALTC` | 员工年资增减档 | `PALTA` | 员工班别出勤月档 | PAL |
| PALT | `PALTC` | 员工每日出勤信息档 | `PALTB` | 员工班别出勤月档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTD` | 员工薪资异动档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTE` | 员工人事异动档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTF` | 请假单信息档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTG` | 员工加班单档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTH` | 员工津贴扣款单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTI` | 员工发薪记录单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTJ` | 员工发薪记录单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTK` | 员工请假记录单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTL` | 员工请假记录单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTM` | 劳健保月投保信息单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTN` | 劳健保月投保信息单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTO` | 员工劳保异动档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTP` | 员工健保异动档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTQ` | 员工眷保异动档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTR` | 独立发放信息档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTS` | 扣缴媒体信息档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTT` | 员工基数异动单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTU` | 员工津贴扣款单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTV` | 员工基数异动单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTW` | 计件数量单头档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTX` | 计件数量班组成员档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTY` | 计件数量单身档 | PAL |
| PALT | `PALTC` | 员工班别出勤月档 | `PALTZ` | 扣缴媒体暂保存 | PAL |
| PSMM | `PSMMC` | 序号仓库档 | `PSMMA` | 订单工单序号档 | PSM |
| PSMM | `PSMMC` | 序号交易临时档 | `PSMMB` | 订单工单序号档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMD` | 序号变更历史记录档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMME` | 订单工单变更序号档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMF` | 不良原因信息档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMG` | 工站信息档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMH` | 工站人员信息档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMI` | 工站产品设置单头档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMJ` | 工站产品设置单身档 | PSM |
| PSMM | `PSMMC` | 订单工单序号档 | `PSMMK` | 工站产品设置子单身档 | PSM |
| PSMT | `PSMTC` | 序号交易明细档 | `PSMTA` | 产品序号对应单单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单头档 | `PSMTB` | 产品序号对应单单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTD` | 产品序号对应单不良原因单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTE` | 维修站维护单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTF` | 盘点底稿信息序号子单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTG` | 序号开账调整单头档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTH` | 序号开账调整单身档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTI` | 返工产品序号对应单单头档 | PSM |
| PSMT | `PSMTC` | 产品序号对应单单身档 | `PSMTJ` | 返工产品序号对应单单身档 | PSM |
| PURC | `PURCC` | 供应商品号赠备品率单头档 | `PURCA` | 到货单单头档 | PUR |
| PURC | `PURCC` | 供应商品号赠备品率单身档 | `PURCB` | 到货单单头档 | PUR |
| PURC | `PURCC` | 到货单单头档 | `PURCD` | 到货单单身档 | PUR |
| PURL | `PURLC` | 品号供应商每月统计维护档 | `PURLB` | 供应商每月统计维护档 | PUR |
| PURM | `PURMC` | 供应商基本信息档 | `PURMA` | 品号供应商单身档 | PUR |
| PURM | `PURMC` | 品号供应商单头档 | `PURMB` | 品号供应商单身档 | PUR |
| PURM | `PURMC` | 品号供应商单身档 | `PURMD` | 供应商品号特殊检验方式档 | PUR |
| PURM | `PURMC` | 品号供应商单身档 | `PURME` | 供应商交货时段档 | PUR |
| PURM | `PURMC` | 品号供应商单身档 | `PURMF` | 供应商银行账号信息档 | PUR |
| PURT | `PURTC` | 请购单单头信息档 | `PURTA` | 采购单单头信息档 | PUR |
| PURT | `PURTC` | 请购单单身信息档 | `PURTB` | 采购单单头信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTD` | 采购单单身信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTE` | 采购变更单头信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTF` | 采购变更单身信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTG` | 进货单单头档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTG2` | ~ | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTH` | 进货单单身档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTI` | 退货单单头档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTJ` | 退货单单身档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTK` | 验退件退回信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTL` | 核价单单头档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTM` | 核价单单身档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTN` | 核价单单身明细档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTO` | 询价单单头档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTP` | 询价单单身档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTQ` | 询价单单身明细档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTR` | 请购单子单身信息档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTS` | 供应商信息变更单头档 | PUR |
| PURT | `PURTC` | 采购单单头信息档 | `PURTT` | 供应商信息变更单身档 | PUR |
| QMSM | `QMSMC` | 品管控制参数设置档 | `QMSMA` | 抽查基础单身信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单头信息档 | `QMSMB` | 抽查基础单身信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMD` | 品管类别信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSME` | 检验项目信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMF` | 品号检验项目单头档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMG` | 品号检验项目单身档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMH` | 不良原因编号档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMI` | 文字/数值型品号检验项目信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSMK` | 计量抽查基础单头信息档 | QMS |
| QMSM | `QMSMC` | 抽查基础单身信息档 | `QMSML` | 计量抽查基础单身信息档 | QMS |
| QMST | `QMSTC` | 进货检验单单头档 | `QMSTA` | 进货检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单单身档 | `QMSTB` | 进货检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTD` | 委外进货检验单单头档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTE` | 委外进货检验单单身档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTF` | 委外进货检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTG` | 生产入库检验单单头档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTH` | 生产入库检验单单身档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTI` | 生产入库检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTJ` | 转移检验单单头档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTK` | 转移检验单单身档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTL` | 转移检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTM` | 销退检验单单头档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTN` | 销退检验单单身档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTO` | 销退检验单不良原因档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTP` | 数值型检验项目检测信息档 | QMS |
| QMST | `QMSTC` | 进货检验单不良原因档 | `QMSTQ` | 数值型检验项目检测单身信息档 | QMS |
| RGRT | `RGRTC` | 报表工具人员权限单头档 | `RGRTA` | 报表工具角色权限单头档 | RGR |
| RGRT | `RGRTC` | 报表工具人员权限单身档 | `RGRTB` | 报表工具角色权限单头档 | RGR |
| RGRT | `RGRTC` | 报表工具角色权限单头档 | `RGRTD` | 报表工具角色权限单身档 | RGR |
| RMAM | `RMAMC` | 维修服务站信息档 | `RMAMA` | 维修问题/解决方法单头档 | RMA |
| RMAM | `RMAMC` | 维修人员编号信息档 | `RMAMB` | 维修问题/解决方法单头档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMD` | 维修问题/解决方法单身档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAME` | 维修项目信息档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMF` | 维修零件价格信息档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMG` | 维修站目标设置档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMH` | 维修品号类别信息档 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMI` | 产品序号信息单头 | RMA |
| RMAM | `RMAMC` | 维修问题/解决方法单头档 | `RMAMJ` | 产品序号信息单身 | RMA |
| RMAT | `RMATC` | 叫修单单头档 | `RMATA` | 维修单单头档 | RMA |
| RMAT | `RMATC` | 叫修单单身档 | `RMATB` | 维修单单头档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATD` | 维修单单身档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATE` | 维修单单头明细档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATF` | 送厂维修单单头档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATG` | 送厂维修单单身档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATH` | 送厂归还单单头档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATI` | 送厂归还单单身档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATJ` | 单据产品序号维护单头档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATK` | 单据产品序号维护单身档 | RMA |
| RMAT | `RMATC` | 维修单单头档 | `RMATL` | 单据产品序号维护单身明细档 | RMA |
| SFCD | `SFCDC` | 工单工艺子单身信息档 | `SFCDA` | 报工单子单身信息档 | SFC |
| SFCD | `SFCDC` | 转移单子单身信息档 | `SFCDB` | 报工单子单身信息档 | SFC |
| SFCD | `SFCDC` | 报工单子单身信息档 | `SFCDD` | 工艺快速转移信息档 | SFC |
| SFCT | `SFCTC` | 工单工艺信息档 | `SFCTA` | 转移单单身档 | SFC |
| SFCT | `SFCTC` | 转移单单头档 | `SFCTB` | 转移单单身档 | SFC |
| SFCT | `SFCTC` | 转移单单身档 | `SFCTD` | 报工单单头档 | SFC |
| SFCT | `SFCTC` | 转移单单身档 | `SFCTE` | 报工单单身档 | SFC |
| SFCT | `SFCTC` | 转移单单身档 | `SFCTF` | 报工单班组成员档 | SFC |
| TIST | `TISTC` | 销项发票底稿单头档 | `TISTA` | 销项作废发票单头档 | TIS |
| TIST | `TISTC` | 销项发票底稿单身档 | `TISTB` | 销项作废发票单头档 | TIS |
| TIST | `TISTC` | 销项作废发票单头档 | `TISTD` | 销项作废发票单身档 | TIS |
| TIST | `TISTC` | 销项作废发票单头档 | `TISTE` | 进项发票底稿档 | TIS |
| TMCM | `TMCMC` | 业务流程档 | `TMCMA` | 业务流程单身档 | TMC |
| TMCM | `TMCMC` | 业务流程图形档 | `TMCMB` | 业务流程单身档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMD` | 业务流程条件信息档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCME` | 业务流程消息档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMF` | 收件人地址信息单头档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMG` | 收件人地址信息单身档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMH` | 收件人信息单头档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMI` | 收件人单身人员信息档 | TMC |
| TMCM | `TMCMC` | 业务流程单身档 | `TMCMJ` | 收件人品类人员单身档 | TMC |

## 三、高置信关联（25 组）

| 共享中文名 | 表 A | 字段 | 表 B | 字段 | 模块 |
|---|---|---|---|---|---|
| +/- | `ACTTI` | `TI005` | `ACTTI205` | `TI005` | ACT |
| Gird的Form名称 | `RPTGRIDFMT` | `EXTNAME` | `RPTGRIDFMTENG` | `EXTNAME` | RPT |
| 具体的格式 | `RPTGRIDFMT` | `FMTVALUE` | `RPTGRIDFMTENG` | `FMTVALUE` | RPT |
| 姓名 | `CMSMV` | `MV002` | `V_QIXUBING` | `MV002` | CMS |
| 报表名称 | `RPTGRIDFMT` | `RPTNAME` | `RPTGRIDFMTENG` | `RPTNAME` | RPT |
| 报表项目 | `ACTMT` | `MT002` | `ACTMT205` | `MT002` | ACT |
| 报表项目编号 | `ACTTH` | `TH003` | `ACTTH205` | `TH003` | ACT |
| 报表项目说明 | `ACTTH` | `TH004` | `ACTTH205` | `TH004` | ACT |
| 是否为开启时默认格式 | `RPTGRIDFMT` | `ISDEFAULT` | `RPTGRIDFMTENG` | `ISDEFAULT` | RPT |
| 是否处理缩排 | `RPTGRIDFMT` | `ISINDENT` | `RPTGRIDFMTENG` | `ISINDENT` | RPT |
| 是否引出firstkey为ST的资料 | `RPTGRIDFMT` | `ISShowST` | `RPTGRIDFMTENG` | `ISShowST` | RPT |
| 是否被保存 | `RPTGRIDFMT` | `ISSAVED` | `RPTGRIDFMTENG` | `ISSAVED` | RPT |
| 来源序号 | `ACTTI` | `TI002` | `ACTTI205` | `TI002` | ACT |
| 格式备注 | `RPTGRIDFMT` | `FMTMEMO` | `RPTGRIDFMTENG` | `FMTMEMO` | RPT |
| 格式档名称 | `RPTGRIDFMT` | `FMTNAME` | `RPTGRIDFMTENG` | `FMTNAME` | RPT |
| 格式档序号 | `RPTGRIDFMT` | `FMTNO` | `RPTGRIDFMTENG` | `FMTNO` | RPT |
| 现金流量表项目 | `ACTTH` | `TH007` | `ACTTH205` | `TH007` | ACT |
| 科目编号 | `ACTTI` | `TI006` | `ACTTI205` | `TI006` | ACT |
| 类别 | `ACTTG` | `TG001` | `ACTTG205` | `TG001` | ACT |
| 类别 | `ACTTH` | `TH001` | `ACTTH205` | `TH001` | ACT |
| 类别 | `ACTTI` | `TI001` | `ACTTI205` | `TI001` | ACT |
| 类别描述 | `ACTMS` | `MS002` | `ACTMS205` | `MS002` | ACT |
| 类别编号 | `ACTMS` | `MS001` | `ACTMS205` | `MS001` | ACT |
| 类别编号 | `ACTMT` | `MT001` | `ACTMT205` | `MT001` | ACT |
| 行次 | `ACTTH` | `TH005` | `ACTTH205` | `TH005` | ACT |

## 三、中置信关联（11718 组）

| 共享中文名 | 表 A | 字段 | 表 B | 字段 | 模块 |
|---|---|---|---|---|---|
| ABC类别 | `EQTMC` | `MC005` | `EQTMJ` | `MJ014` | EQT |
| AC | `GMPTJ` | `TJ007` | `GMPTM` | `TM007` | GMP |
| AC | `QMSTB` | `TB007` | `QMSTE` | `TE007` | QMS |
| AC | `QMSTB` | `TB007` | `QMSTH` | `TH007` | QMS |
| AC | `QMSTB` | `TB007` | `QMSTK` | `TK007` | QMS |
| AC | `QMSTB` | `TB007` | `QMSTN` | `TN007` | QMS |
| AC | `QMSTE` | `TE007` | `QMSTH` | `TH007` | QMS |
| AC | `QMSTE` | `TE007` | `QMSTK` | `TK007` | QMS |
| AC | `QMSTE` | `TE007` | `QMSTN` | `TN007` | QMS |
| AC | `QMSTH` | `TH007` | `QMSTK` | `TK007` | QMS |
| AC | `QMSTH` | `TH007` | `QMSTN` | `TN007` | QMS |
| AC | `QMSTK` | `TK007` | `QMSTN` | `TN007` | QMS |
| BOM序号 | `BOMTC` | `TC004` | `BOMTK` | `TK004` | BOM |
| BOM序号 | `BOMTC` | `TC004` | `BOMTL` | `TL004` | BOM |
| BOM序号 | `BOMTK` | `TK004` | `BOMTL` | `TL004` | BOM |
| BOM日期 | `MOCTA` | `TA004` | `MOCTU` | `TU004` | MOC |
| BOM日期 | `MOCTA` | `TA004` | `MOCTV` | `TV004` | MOC |
| BOM日期 | `MOCTU` | `TU004` | `MOCTV` | `TV004` | MOC |
| BOM版本 | `MOCTA` | `TA005` | `MOCTU` | `TU005` | MOC |
| BOM版本 | `MOCTA` | `TA005` | `MOCTV` | `TV005` | MOC |
| BOM版本 | `MOCTU` | `TU005` | `MOCTV` | `TV005` | MOC |
| BOM节点 | `MPSTB` | `TB037` | `MPSTC` | `TC005` | MPS |
| BOM节点 | `MPSTB` | `TB037` | `MPSTF` | `TF007` | MPS |
| BOM节点 | `MPSTC` | `TC005` | `MPSTF` | `TF007` | MPS |
| CONSIGNEE | `COPTC` | `TC032` | `COPTE` | `TE031` | COP |
| E-MAIL | `CMSML` | `ML010` | `CMSMV` | `MV020` | CMS |
| E-MAIL | `HRSMN` | `MN012` | `HRSTJ` | `TJ029` | HRS |
| E-Mail | `ASMMM` | `MM011` | `ASMMN` | `MN009` | ASM |
| E-Mail | `ASMMM` | `MM011` | `ASMMT` | `MT010` | ASM |
| E-Mail | `ASMMN` | `MN009` | `ASMMT` | `MT010` | ASM |
| E-Mail | `RMAMA` | `MA011` | `RMAMB` | `MB009` | RMA |
| E.T.A | `IPSTA` | `TA015` | `IPSTG` | `TG012` | IPS |
| E.T.D | `IPSTA` | `TA014` | `IPSTG` | `TG011` | IPS |
| EBC汇出码 | `ACPTA` | `TA073` | `ACPTI` | `TI033` | ACP |
| EBC汇出码 | `ACPTA` | `TA073` | `ACPTI` | `TI034` | ACP |
| EBC汇出码 | `ACRTA` | `TA073` | `ACRTI` | `TI033` | ACR |
| EBC汇出码 | `COPMA` | `MA113` | `COPTA` | `TA034` | COP |
| EBC汇出码 | `COPMA` | `MA113` | `COPTC` | `TC059` | COP |
| EBC汇出码 | `COPMA` | `MA113` | `COPTE` | `TE046` | COP |
| EBC汇出码 | `COPMA` | `MA113` | `COPTG` | `TG068` | COP |
| EBC汇出码 | `COPMA` | `MA113` | `COPTI` | `TI049` | COP |
| EBC汇出码 | `COPTA` | `TA034` | `COPTC` | `TC059` | COP |
| EBC汇出码 | `COPTA` | `TA034` | `COPTE` | `TE046` | COP |
| EBC汇出码 | `COPTA` | `TA034` | `COPTG` | `TG068` | COP |
| EBC汇出码 | `COPTA` | `TA034` | `COPTI` | `TI049` | COP |
| EBC汇出码 | `COPTC` | `TC059` | `COPTE` | `TE046` | COP |
| EBC汇出码 | `COPTC` | `TC059` | `COPTG` | `TG068` | COP |
| EBC汇出码 | `COPTC` | `TC059` | `COPTI` | `TI049` | COP |
| EBC汇出码 | `COPTE` | `TE046` | `COPTG` | `TG068` | COP |
| EBC汇出码 | `COPTE` | `TE046` | `COPTI` | `TI049` | COP |
| EBC汇出码 | `COPTG` | `TG068` | `COPTI` | `TI049` | COP |
| EBC汇出码 | `PURMA` | `MA076` | `PURTC` | `TC035` | PUR |
| EBC汇出码 | `PURMA` | `MA076` | `PURTE` | `TE028` | PUR |
| EBC汇出码 | `PURMA` | `MA076` | `PURTG` | `TG050` | PUR |
| EBC汇出码 | `PURMA` | `MA076` | `PURTI` | `TI040` | PUR |
| EBC汇出码 | `PURMA` | `MA076` | `PURTK` | `TK011` | PUR |
| EBC汇出码 | `PURMA` | `MA076` | `PURTL` | `TL014` | PUR |
| EBC汇出码 | `PURTC` | `TC035` | `PURTE` | `TE028` | PUR |
| EBC汇出码 | `PURTC` | `TC035` | `PURTG` | `TG050` | PUR |
| EBC汇出码 | `PURTC` | `TC035` | `PURTI` | `TI040` | PUR |
| EBC汇出码 | `PURTC` | `TC035` | `PURTK` | `TK011` | PUR |
| EBC汇出码 | `PURTC` | `TC035` | `PURTL` | `TL014` | PUR |
| EBC汇出码 | `PURTE` | `TE028` | `PURTG` | `TG050` | PUR |
| EBC汇出码 | `PURTE` | `TE028` | `PURTI` | `TI040` | PUR |
| EBC汇出码 | `PURTE` | `TE028` | `PURTK` | `TK011` | PUR |
| EBC汇出码 | `PURTE` | `TE028` | `PURTL` | `TL014` | PUR |
| EBC汇出码 | `PURTG` | `TG050` | `PURTI` | `TI040` | PUR |
| EBC汇出码 | `PURTG` | `TG050` | `PURTK` | `TK011` | PUR |
| EBC汇出码 | `PURTG` | `TG050` | `PURTL` | `TL014` | PUR |
| EBC汇出码 | `PURTI` | `TI040` | `PURTK` | `TK011` | PUR |
| EBC汇出码 | `PURTI` | `TI040` | `PURTL` | `TL014` | PUR |
| EBC汇出码 | `PURTK` | `TK011` | `PURTL` | `TL014` | PUR |
| FAX_NO | `ASMMM` | `MM010` | `ASMMT` | `MT009` | ASM |
| FAX_NO | `COPMA` | `MA008` | `COPMD` | `MD010` | COP |
| FAX_NO | `RMAMA` | `MA010` | `RMATA` | `TA034` | RMA |
| INVOICE_NO | `EPSTA` | `TA042` | `EPSTE` | `TE006` | EPS |
| INVOICE_NO | `EPSTA` | `TA042` | `EPSTI` | `TI004` | EPS |
| INVOICE_NO | `EPSTE` | `TE006` | `EPSTI` | `TI004` | EPS |
| INVOICE备注 | `COPTC` | `TC037` | `COPTE` | `TE036` | COP |
| L/C单号 | `IPSTA` | `TA004` | `IPSTC` | `TC006` | IPS |
| L/C单号 | `IPSTA` | `TA004` | `IPSTG` | `TG029` | IPS |
| L/C单号 | `IPSTC` | `TC006` | `IPSTG` | `TG029` | IPS |
| LC收状金额比率 | `COPMA` | `MA090` | `COPMH` | `MH003` | COP |
| NOTIFY | `COPTC` | `TC033` | `COPTE` | `TE032` | COP |
| PACKING-LIST备注 | `COPTC` | `TC038` | `COPTE` | `TE037` | COP |
| PACKING审核码 | `EPSTA` | `TA033` | `EPSTC` | `TC023` | EPS |
| PDM识别码 | `BOMMF` | `MF032` | `BOMMG` | `MG010` | BOM |
| RE | `GMPTJ` | `TJ008` | `GMPTM` | `TM008` | GMP |
| RE | `QMSTB` | `TB008` | `QMSTE` | `TE008` | QMS |
| RE | `QMSTB` | `TB008` | `QMSTH` | `TH008` | QMS |
| RE | `QMSTB` | `TB008` | `QMSTK` | `TK008` | QMS |
| RE | `QMSTB` | `TB008` | `QMSTN` | `TN008` | QMS |
| RE | `QMSTE` | `TE008` | `QMSTH` | `TH008` | QMS |
| RE | `QMSTE` | `TE008` | `QMSTK` | `TK008` | QMS |
| RE | `QMSTE` | `TE008` | `QMSTN` | `TN008` | QMS |
| RE | `QMSTH` | `TH008` | `QMSTK` | `TK008` | QMS |
| RE | `QMSTH` | `TH008` | `QMSTN` | `TN008` | QMS |
| RE | `QMSTK` | `TK008` | `QMSTN` | `TN008` | QMS |
| S/INO单别 | `EPSTD` | `TD001` | `EPSTE` | `TE001` | EPS |
| S/INO单号 | `EPSTD` | `TD002` | `EPSTE` | `TE002` | EPS |
| S/I单号 | `IPSTE` | `TE001` | `IPSTF` | `TF001` | IPS |
| S/I单号 | `IPSTE` | `TE001` | `IPSTG` | `TG028` | IPS |
| S/I单号 | `IPSTF` | `TF001` | `IPSTG` | `TG028` | IPS |
| SQL | `RGRTA` | `TA004` | `RGRTC` | `TC004` | RGR |
| TEL_NO(一) | `ASMMM` | `MM008` | `ASMMT` | `MT007` | ASM |
| TEL_NO(二) | `ASMMM` | `MM009` | `ASMMT` | `MT008` | ASM |
| sMES产生 | `MOCTC` | `TC032` | `MOCTF` | `TF034` | MOC |
| sMES产生 | `MOCTC` | `TC032` | `MOCTH` | `TH048` | MOC |
| sMES产生 | `MOCTF` | `TF034` | `MOCTH` | `TH048` | MOC |
| sMES单号 | `MOCTC` | `TC033` | `MOCTF` | `TF035` | MOC |
| sMES单号 | `MOCTC` | `TC033` | `MOCTH` | `TH049` | MOC |
| sMES单号 | `MOCTF` | `TF035` | `MOCTH` | `TH049` | MOC |
| sQMS检验单号 | `MOCTG` | `TGS02` | `MOCTI` | `TIS02` | MOC |
| sQMS检验码 | `MOCTG` | `TGS01` | `MOCTI` | `TIS01` | MOC |
| 上下半月 | `PALMQ` | `MQ002` | `PALMR` | `MR002` | PAL |
| 上次发行日期 | `KBSMI` | `MI008` | `KBSMK` | `MK008` | KBS |
| 上次张数 | `KBSMI` | `MI009` | `KBSMK` | `MK009` | KBS |
| 上次故障日期时间 | `EQTMJ` | `MJ035` | `EQTTN` | `TN015` | EQT |
| 上次盘点日 | `INVMC` | `MC011` | `INVME` | `ME004` | INV |
| 上次盘点日 | `INVMC` | `MC011` | `INVML` | `ML008` | INV |
| 上次盘点日 | `INVME` | `ME004` | `INVML` | `ML008` | INV |
| 上次计量周期次数 | `EQTMJ` | `MJ025` | `EQTTD` | `TD036` | EQT |
| 上次重估汇率 | `ACPLE` | `LE009` | `ACPTA` | `TA050` | ACP |
| 上次重估汇率 | `ACPLE` | `LE009` | `ACPTI` | `TI026` | ACP |
| 上次重估汇率 | `ACPLE` | `LE009` | `ACPTK` | `TK037` | ACP |
| 上次重估汇率 | `ACPTA` | `TA050` | `ACPTI` | `TI026` | ACP |
| 上次重估汇率 | `ACPTA` | `TA050` | `ACPTK` | `TK037` | ACP |
| 上次重估汇率 | `ACPTI` | `TI026` | `ACPTK` | `TK037` | ACP |
| 上次重估汇率 | `ACRLE` | `LE009` | `ACRTA` | `TA058` | ACR |
| 上次重估汇率 | `ACRLE` | `LE009` | `ACRTI` | `TI026` | ACR |
| 上次重估汇率 | `ACRLE` | `LE009` | `ACRTK` | `TK039` | ACR |
| 上次重估汇率 | `ACRTA` | `TA058` | `ACRTI` | `TI026` | ACR |
| 上次重估汇率 | `ACRTA` | `TA058` | `ACRTK` | `TK039` | ACR |
| 上次重估汇率 | `ACRTI` | `TI026` | `ACRTK` | `TK039` | ACR |
| 上阶主件 | `COPDB` | `DB004` | `COPTR` | `TR004` | COP |
| 上阶品号 | `LRPTA` | `TAC02` | `LRPTB` | `TB011` | LRP |
| 上阶品号 | `LRPTA` | `TAC02` | `LRPTC` | `TCC02` | LRP |
| 上阶品号 | `LRPTB` | `TB011` | `LRPTC` | `TCC02` | LRP |
| 下发功能解析 | `ACTMA` | `MA033` | `ACTMF` | `MF017` | ACT |
| 下发功能解析 | `ACTMA` | `MA033` | `ACTMR` | `MR004` | ACT |
| 下发功能解析 | `ACTMF` | `MF017` | `ACTMR` | `MR004` | ACT |
| 下发功能解析 | `CMSME` | `ME010` | `CMSMF` | `MF015` | CMS |
| 下发功能解析 | `CMSME` | `ME010` | `CMSMQ` | `MQ074` | CMS |
| 下发功能解析 | `CMSME` | `ME010` | `CMSMV` | `MV078` | CMS |
| 下发功能解析 | `CMSMF` | `MF015` | `CMSMQ` | `MQ074` | CMS |
| 下发功能解析 | `CMSMF` | `MF015` | `CMSMV` | `MV078` | CMS |
| 下发功能解析 | `CMSMQ` | `MQ074` | `CMSMV` | `MV078` | CMS |
| 下发功能解析 | `OMSMB` | `MB011` | `OMSMC` | `MC013` | OMS |
| 下发功能解析 | `OMSMB` | `MB011` | `OMSME` | `ME003` | OMS |
| 下发功能解析 | `OMSMB` | `MB011` | `OMSMG` | `MG006` | OMS |
| 下发功能解析 | `OMSMC` | `MC013` | `OMSME` | `ME003` | OMS |
| 下发功能解析 | `OMSMC` | `MC013` | `OMSMG` | `MG006` | OMS |
| 下发功能解析 | `OMSME` | `ME003` | `OMSMG` | `MG006` | OMS |
| 下次检验日 | `GMPME` | `ME011` | `GMPMF` | `MF007` | GMP |
| 下次检验日 | `GMPME` | `ME011` | `GMPTH` | `TH021` | GMP |
| 下次检验日 | `GMPMF` | `MF007` | `GMPTH` | `TH021` | GMP |
| 下次计划维护日期 | `EQTML` | `ML017` | `EQTTE` | `TE044` | EQT |
| 下次计划维护运行量 | `EQTML` | `ML018` | `EQTTE` | `TE045` | EQT |
| 下次计划计量日期 | `EQTMJ` | `MJ026` | `EQTTD` | `TD029` | EQT |
| 下游供应商 | `MTPMB` | `MB003` | `MTPTB` | `TB003` | MTP |
| 下游供应商 | `MTPMB` | `MB003` | `MTPTC` | `TC003` | MTP |
| 下游供应商 | `MTPMB` | `MB003` | `MTPTD` | `TD004` | MTP |
| 下游供应商 | `MTPMB` | `MB003` | `MTPTE` | `TE004` | MTP |
| 下游供应商 | `MTPTB` | `TB003` | `MTPTC` | `TC003` | MTP |
| 下游供应商 | `MTPTB` | `TB003` | `MTPTD` | `TD004` | MTP |
| 下游供应商 | `MTPTB` | `TB003` | `MTPTE` | `TE004` | MTP |
| 下游供应商 | `MTPTC` | `TC003` | `MTPTD` | `TD004` | MTP |
| 下游供应商 | `MTPTC` | `TC003` | `MTPTE` | `TE004` | MTP |
| 下游供应商 | `MTPTD` | `TD004` | `MTPTE` | `TE004` | MTP |
| 下站编号 | `RMAMA` | `MA013` | `RMATA` | `TA032` | RMA |
| 下站编号 | `RMAMA` | `MA013` | `RMATC` | `TC019` | RMA |
| 下站编号 | `RMATA` | `TA032` | `RMATC` | `TC019` | RMA |
| 下阶成本 | `ACMMJ` | `MJ006` | `ACMTM` | `TM006` | ACM |
| 不良包装数量 | `PURLB` | `LB015` | `PURLC` | `LC015` | PUR |
| 不良原因编号 | `GMPTK` | `TK005` | `GMPTN` | `TN005` | GMP |
| 不良原因编号 | `PSMMF` | `MF001` | `PSMTD` | `TD003` | PSM |
| 不良原因编号 | `QMSMH` | `MH001` | `QMSTC` | `TC005` | QMS |
| 不良原因编号 | `QMSMH` | `MH001` | `QMSTF` | `TF005` | QMS |
| 不良原因编号 | `QMSMH` | `MH001` | `QMSTI` | `TI005` | QMS |
| 不良原因编号 | `QMSMH` | `MH001` | `QMSTL` | `TL005` | QMS |
| 不良原因编号 | `QMSMH` | `MH001` | `QMSTO` | `TO005` | QMS |
| 不良原因编号 | `QMSTC` | `TC005` | `QMSTF` | `TF005` | QMS |
| 不良原因编号 | `QMSTC` | `TC005` | `QMSTI` | `TI005` | QMS |
| 不良原因编号 | `QMSTC` | `TC005` | `QMSTL` | `TL005` | QMS |
| 不良原因编号 | `QMSTC` | `TC005` | `QMSTO` | `TO005` | QMS |
| 不良原因编号 | `QMSTF` | `TF005` | `QMSTI` | `TI005` | QMS |
| 不良原因编号 | `QMSTF` | `TF005` | `QMSTL` | `TL005` | QMS |
| 不良原因编号 | `QMSTF` | `TF005` | `QMSTO` | `TO005` | QMS |
| 不良原因编号 | `QMSTI` | `TI005` | `QMSTL` | `TL005` | QMS |
| 不良原因编号 | `QMSTI` | `TI005` | `QMSTO` | `TO005` | QMS |
| 不良原因编号 | `QMSTL` | `TL005` | `QMSTO` | `TO005` | QMS |
| 不良数量 | `GMPTJ` | `TJ009` | `GMPTM` | `TM009` | GMP |
| 不良数量 | `PURLB` | `LB010` | `PURLC` | `LC009` | PUR |
| 不良数量 | `QMSTB` | `TB009` | `QMSTE` | `TE009` | QMS |
| 不良数量 | `QMSTB` | `TB009` | `QMSTH` | `TH009` | QMS |
| 不良数量 | `QMSTB` | `TB009` | `QMSTK` | `TK009` | QMS |
| 不良数量 | `QMSTB` | `TB009` | `QMSTN` | `TN009` | QMS |
| 不良数量 | `QMSTE` | `TE009` | `QMSTH` | `TH009` | QMS |
| 不良数量 | `QMSTE` | `TE009` | `QMSTK` | `TK009` | QMS |
| 不良数量 | `QMSTE` | `TE009` | `QMSTN` | `TN009` | QMS |

> 仅显示前 200 组（共 11718 组），全量见 `ER-relations.csv`

## 四、低置信关联

跨模块同中文名，共 **27670 组**。跨业务边界，**误判率高**，仅作线索。

| 共享中文名 | 表 A | 表 B | 模块 A | 模块 B |
|---|---|---|---|---|
| ABC等级 | `INVMB` | `PURMA` | INV | PUR |
| AC | `GMPTJ` | `QMSTB` | GMP | QMS |
| AC | `GMPTJ` | `QMSTE` | GMP | QMS |
| AC | `GMPTJ` | `QMSTH` | GMP | QMS |
| AC | `GMPTJ` | `QMSTK` | GMP | QMS |
| AC | `GMPTJ` | `QMSTN` | GMP | QMS |
| AC | `GMPTM` | `QMSTB` | GMP | QMS |
| AC | `GMPTM` | `QMSTE` | GMP | QMS |
| AC | `GMPTM` | `QMSTH` | GMP | QMS |
| AC | `GMPTM` | `QMSTK` | GMP | QMS |
| AC | `GMPTM` | `QMSTN` | GMP | QMS |
| BOM序号 | `BOMTC` | `INTLK` | BOM | INT |
| BOM序号 | `BOMTK` | `INTLK` | BOM | INT |
| BOM序号 | `BOMTL` | `INTLK` | BOM | INT |
| BOM日期 | `COPTQ` | `LRPTA` | COP | LRP |
| BOM日期 | `COPTQ` | `MOCTA` | COP | MOC |
| BOM日期 | `COPTQ` | `MOCTU` | COP | MOC |
| BOM日期 | `COPTQ` | `MOCTV` | COP | MOC |
| BOM日期 | `LRPTA` | `MOCTA` | LRP | MOC |
| BOM日期 | `LRPTA` | `MOCTU` | LRP | MOC |
| BOM日期 | `LRPTA` | `MOCTV` | LRP | MOC |
| BOM版本 | `MOCTA` | `MRPTA` | MOC | MRP |
| BOM版本 | `MOCTU` | `MRPTA` | MOC | MRP |
| BOM版本 | `MOCTV` | `MRPTA` | MOC | MRP |
| E-MAIL | `CMSML` | `GSPMB` | CMS | GSP |
| E-MAIL | `CMSML` | `HRSMN` | CMS | HRS |
| E-MAIL | `CMSML` | `HRSTJ` | CMS | HRS |
| E-MAIL | `CMSML` | `PALMU` | CMS | PAL |
| E-MAIL | `CMSML` | `PURMA` | CMS | PUR |
| E-MAIL | `CMSML` | `TMCMG` | CMS | TMC |
| E-MAIL | `CMSMV` | `GSPMB` | CMS | GSP |
| E-MAIL | `CMSMV` | `HRSMN` | CMS | HRS |
| E-MAIL | `CMSMV` | `HRSTJ` | CMS | HRS |
| E-MAIL | `CMSMV` | `PALMU` | CMS | PAL |
| E-MAIL | `CMSMV` | `PURMA` | CMS | PUR |
| E-MAIL | `CMSMV` | `TMCMG` | CMS | TMC |
| E-MAIL | `GSPMB` | `HRSMN` | GSP | HRS |
| E-MAIL | `GSPMB` | `HRSTJ` | GSP | HRS |
| E-MAIL | `GSPMB` | `PALMU` | GSP | PAL |
| E-MAIL | `GSPMB` | `PURMA` | GSP | PUR |
| E-MAIL | `GSPMB` | `TMCMG` | GSP | TMC |
| E-MAIL | `HRSMN` | `PALMU` | HRS | PAL |
| E-MAIL | `HRSMN` | `PURMA` | HRS | PUR |
| E-MAIL | `HRSMN` | `TMCMG` | HRS | TMC |
| E-MAIL | `HRSTJ` | `PALMU` | HRS | PAL |
| E-MAIL | `HRSTJ` | `PURMA` | HRS | PUR |
| E-MAIL | `HRSTJ` | `TMCMG` | HRS | TMC |
| E-MAIL | `PALMU` | `PURMA` | PAL | PUR |
| E-MAIL | `PALMU` | `TMCMG` | PAL | TMC |
| E-MAIL | `PURMA` | `TMCMG` | PUR | TMC |

> 仅显示前 50 组（共 27670 组）

## 五、因无区分度被排除的中文名（TOP 20）

| 中文名 | 出现表数 |
|---|---|
| 审核码 | 314 |
| 序号 | 298 |
| 品号 | 231 |
| 审核者 | 173 |
| 币种 | 155 |
| 单别 | 155 |
| 项目编号 | 153 |
| 单号 | 148 |
| 单据日期 | 147 |
| 打印次数 | 144 |
| 传送次数 | 136 |
| 签核状态码 | 136 |
| 单位 | 117 |
| 规格 | 113 |
| 品名 | 104 |
| 数量 | 94 |
| 批号 | 91 |
| 汇率 | 84 |
| 部门 | 75 |
| 类型 | 74 |

> 这些中文名因出现在过多表中（>40），两两配对会产生海量无意义组合，故排除。

## 六、信息缺失与存疑清单

| # | 缺失项 | 影响 | 处理建议 |
|---|---|---|---|
| 1 | **外键约束** | 无法确定真实关联关系 | 本文档推断需人工核验；建议向易飞索取规格文档 |
| 2 | **主键/索引** | 无法确定唯一性约束 | 需从单据定义或真机行为推断 |
| 3 | **默认值** | 插入新记录时不知默认行为 | 需真机实验或规格文档 |
| 4 | **枚举码值** | 元数据**不含枚举定义**（`MD008` 实为格式掩码，非代码表） | 需真机采集（T-07） |
| 5 | **类型码 Z / I** | 23 个字段类型不明 | 标 `UNKNOWN`，待确认 |
| 6 | **字段长度** | `MD005` 仅单字母 | 已从 `s:datatype` 的 `maxLength` 补入字典 |
| 7 | **4 张孤儿表** | `INVLK` `INVLL` `YFMXB` `YSMXB` 在字段表存在但表清单无 | 可能已删表残留 |
| 8 | **1 张空字段表** | `PMSTA` 在表清单但无字段记录 | 需确认 |
