# 易飞(E10) 数据字典

> 本文件为机械抽取产物，请勿手工编辑。重新生成：`python scripts/gen_data_dictionary.py`
>
> 溯源：源文件：`.workbuddy/tmp/dict/tables.json`（1170 表）、`.workbuddy/tmp/dict/fields.json`（54842 字段）、`knowledge/typekey/typekey_map.yaml`（106 业务对象）
> 生成时间：2026-10-08 22:40:38

## 一、本目录内容

| 路径 | 内容 | 规模 |
|---|---|---|
| `README.md` | 字典总览、模块索引、检索指引、缺失声明 | 本文件 |
| `modules/{模块}.md` | 模块级字典，每表一张字段表 | 78 个文件 / 78426 行 |
| `field-index.csv` | 全量字段索引，供 SDK 消费 | 54842 行数据 |
| `format-mask-map.csv` | 数据编辑格式掩码清单（MD008），含推测数据类型 | 981 行数据 |
| `table-index.csv` | 全量表索引，含 OpenAPI 暴露实证 | 1174 行数据 |
| `node-table-map.csv` | 逻辑节点 -> 物理表真机反推结果（判定依据来源） | 149 行数据 |

## 二、数据来源与抽取链

```
knowledge/ADMMC-表名信息.xml   (1170 行)  ->  .workbuddy/tmp/dict/tables.json
knowledge/ADMMD-字段信息.xml   (54842 行)  ->  .workbuddy/tmp/dict/fields.json
knowledge/ADMMB-程序信息.xml   (2298 行)   ->  .workbuddy/tmp/dict/programs.json
knowledge/typekey/typekey_map.yaml (106 业务对象)  ->  OpenAPI 暴露推断
                                   ->  scripts/gen_data_dictionary.py
                                   ->  knowledge/data-dictionary/**
```

抽取质量（引自 `_extract-report.json`，行数与预期完全一致）：

| 实体 | 实际行数 | 预期行数 | 一致 |
|---|---|---|---|
| tables | 1170 | 1170 | 是 |
| fields | 54842 | 54842 | 是 |
| programs | 2298 | 2298 | 是 |

## 三、类型码归一化（MD005）

架构师已实证推断，本字典直接采用：

| 码 | 归一化 | 占比 | 推断依据 |
|---|---|---|---|
| `C` | char | 28.63% | precision 分布 1.0(26.79%)/4.0(15.46%)/8.0(14.30%)/10.0(12.16%)/20.0(10.25%), 定长且长度离散, 判定为定长字符串 |
| `N` | numeric | 40.07% | precision 分布 16.6(84.79%)/16.2(6.32%)/1.0/5.4/8.0, 含小数位, 判定为定点数值 |
| `V` | varchar | 30.90% | precision 分布 255.0(91.51%)/30.0(6.56%)/60.0/100.0/1000.0, 长度上限离散且远超定长, 判定为变长字符串 |
| `T` | text | 0.31% | precision .0 占 98.83%, 无长度约束, 判定为长文本 |
| `D` | date | 0.04% | precision .0 占 100%, 无长度约束, 判定为日期 |
| `Z` | UNKNOWN | 0.02% | precision 恒为 4.0, MD007 全为英文标识(TaskComplete/TaskIndex/EventType/Options 等), 全部集中于 DSCTK 工作流任务表, 无法从数据确证语义, 置 UNKNOWN |
| `I` | UNKNOWN | 0.02% | precision 恒为 .0, MD004 为图片内容/凭证内容/参数值/循环信息等大内容语义字段, 无法确证是 BLOB 还是长文本, 置 UNKNOWN |

**`Z` / `I` 共 23 个字段一律标为 `UNKNOWN`，不臆造语义。**

## 四、字段命名铁律与公共字段

字段名规律（实测 26330/26794 = 98.3%，排除 UDF）：`字段名 = 表名末2位 + 3位序号`

| 字段名长度 | 数量 |
|---|---|
| 5 | 54418 |
| 7 | 355 |
| 2 | 27 |
| 4 | 13 |
| 9 | 10 |
| 6 | 9 |
| 8 | 8 |
| 10 | 2 |

命名类别统计：

| 类别 | 表数 |
|---|---|
| 含标准命名字段 | 1146 |
| 含特殊命名字段 | 92 |

特殊命名典型（完整清单见 `docs/plans/yf-field-naming-convention.md` 第四节）：

| 表名 | 字段名 | 原因 |
|---|---|---|
| `ACTTI205` | `TI008` | 子表，表名含 4 位后缀 `TI205` |
| `GHXA` / `JCXA` / `JHXA` | `GHXA018` | 单据性质表，字段名带完整表名 |
| `EFJOBQUE` | `EF011` | 作业队列 |
| `RPTGRIDFMT` | `FMTMEMO` | 报表格式 |
| `TRANSQUEUE` | `JOBID` | 事务队列 |

### 管理字段 vs 物理字段（重要，勿踩坑）

易飞每张业务表在**运行时**都有 7 个管理字段（`COMPANY` `CREATOR` `USR_GROUP` `CREATE_DATE` `MODIFIER` `MODI_DATE` `FLAG`）+ 24 个自定义字段（`UDF01~UDF12` 文本 / `UDF51~UDF62` 数值）。

**但这两类字段的性质完全不同**，实测证据如下：

| 类别 | 是否物理列 | ADMMD 登记实况 | 真机 query 回参 |
|---|---|---|---|
| 7 个管理字段 | **否**（网关层注入） | 几乎不登记：`COMPANY` 0 次、`CREATOR` 3 次、`USR_GROUP` 0 次、`CREATE_DATE` 0 次、`MODIFIER` 0 次、`MODI_DATE` 0 次、`FLAG` 0 次 | **返回** |
| 24 个 UDF 自定义字段 | **是**（真实物理列） | 1168 张表 x 24 = 28008 行 | 返回 |

**结论（直接影响 SDK 与查表方式）：**

1. 管理字段由 **OpenAPI 网关层自动注入**，不是物理列，所以在本字典（乃至 `ADMMD` 元数据）里**查不到** `COMPANY` 等列——这是正常现象，不是字典缺失。查「表字段」时不要期待看到 `COMPANY`。
2. UDF 则是**货真价实的物理列**，已在字典中完整登记，SDK 可直接建基类属性。
3. 真正的坑：真机 query 回参会**额外带回**这 7 个管理字段（如 `CREATE_DATE` 值形如 `20250305181000333`，长度 17，带毫秒与毫秒精度时间戳）。SDK 反序列化时若未声明这 7 个属性，多余字段会被静默丢弃（通常无害）；但若声明了却按物理列去数据库核对，会发现库里根本没有该列。
4. `field-index.csv` 的 `is_mgmt` 列**全表为 `0`**——因为 ADMMD 里唯一登记的 3 处管理字段名（`CREATOR`）经核验实为独立业务字段（见下节冲突表），已按业务字段处理。**该列不能用来判断一张表「有没有管理字段」（答案：每张表运行时都有）**，它只表示「本字段是真管理字段」，而本字典中不存在这样的字段行。

**管理字段名冲突的完整清单与 SDK 处理约束见下文「管理字段列名冲突」一节。**

UDF 覆盖细目：

| 情形 | 表数 | 表 |
|---|---|---|
| 完整 24 个 UDF | 1166 | — |
| UDF 不足 24 个 | 2 | `COPTL`(12 个)、`PMSXI`(12 个) |
| 完全无 UDF | 5 | `DXL`、`INVLK`、`INVLL`、`PURTG2`、`V_QIXUBING` |

UDF 字段行的类型分布为 **V 14004 / N 14004**（各半）：`UDF01~UDF12` 全为 varchar、`UDF51~UDF62` 全为 numeric(16.6)。中文名统一为「用户自定义字段1..24」。SDK 可生成泛型 `UdfSlot` 而非 24 个独立属性。

另注：`ADMMC` / `ADMMD` / `ADMMB` 三张元数据表自身也登记在 `fields.json` 中（分别 32 / 35 / 41 个字段），这是 1173 与 1170 相差 3 的原因。做「业务表 vs 元数据表」区分或统计时须先剔除这 3 张。

### 管理字段列名冲突（3 张表，SDK 基类硬约束）

`CREATOR` 作为列名（MD003）在 **3 张业务表**中被登记，且中文名各异，证明是独立业务列而非公共管理字段混入：

| 表 | 序号 | 中文名 | 类型 |
|---|---|---|---|
| `MOCTX` | 0068 | LURUZ | char(16) |
| `PURCD` | 0068 | AAAA | varchar(10) |
| `PURTC` | 0073 | 录入者 | char(10) |

三者的序号均靠尾（0068 / 0068 / 0073）且排在 UDF 之后，属后期追加的独立列。其余 6 个管理字段（`COMPANY` / `USR_GROUP` / `CREATE_DATE` / `MODIFIER` / `MODI_DATE` / `FLAG`）出现次数均为 0。

**对 SDK 的硬约束**：若无条件把 7 个管理字段混入基类，这 3 张表的 `CREATOR` 会被基类同名属性**静默覆盖**。其中 `PURTC.CREATOR` 中文名为「录入者」，与基类「创建者」语义不同——覆盖后写入的是错误数据且不报错。**基类混入必须按表白名单跳过这 3 张表，或走alias 映射。**本字典已在 `field-index.csv` 的 `is_mgmt` 列把这 3 行标为 `0`，并在各模块 md 中显式标注。

> **更正说明**：字典旧版称「7 个管理字段仅在元数据表 `ADMMC`/`ADMMD`/`ADMMB` 自身出现」。经本次逐字段核验，该表述与数据不符——三张元数据表的字段清单（`ADMMC` 32 个、`ADMMD` 35 个、`ADMMB` 41 个）中**均不含**这 7 个字段。管理字段在 ADMMD 中的登记几乎为零，仅 `CREATOR` 出现 3 次，且这 3 次全部落在上表所列的业务表上。

### 运行时字段数（字典数 + 7 管理字段）

字典登记的字段数**不等于**运行时实际列数：运行时每表另有 7 个管理字段。SDK 做「每表最小可用字段数」「分页/批量上限」类估算时须用运行时口径。

| 表 | 字典字段数 | 运行时字段数 |
|---|---|---|
| `INVMB` 品号基本信息档 | 287 | 294 |
| `CMSMA` 共用参数设置档 | 188 | 195 |
| `MOCTO` 工单变更单头档 | 187 | 194 |
| `COPTE` 订单变更单头信息档 | 155 | 162 |
| `COPMA` 客户基本信息档 | 141 | 148 |
| `DXL` DXL测试 | 2 | 9 |
| `PURTG2` （无中文名） | 2 | 9 |
| `V_QIXUBING` （无中文名） | 2 | 9 |

**统计口径提示**：`DXL` / `PURTG2` / `V_QIXUBING` 三张表字段名退化（`PURTG2` 列名仅 `01` / `02`，中文名全空），叠加 7 个管理字段后运行时 9 个字段里 7 个是管理字段，业务字段近乎为零。做字段数分布统计时建议排除这 3 张异常表。
自定义字段占比：28008 / 54842 = 51.07%；业务字段 26834 个。

## 五、模块索引

模块中文名**全部为推断**（由该模块下代表性表的中文名归纳），非官方模块字典。

| 模块代码 | 中文名（推断） | 表数 | 字段数 | 字典文件 |
|---|---|---|---|---|
| `ACM` | 成本管理 | 23 | 918 | [`modules/ACM.md`](modules/ACM.md) |
| `ACP` | 应付管理 | 20 | 1148 | [`modules/ACP.md`](modules/ACP.md) |
| `ACR` | 应收管理 | 26 | 1414 | [`modules/ACR.md`](modules/ACR.md) |
| `ACT` | 会计 | 46 | 1891 | [`modules/ACT.md`](modules/ACT.md) |
| `ADM` | 系统管理 | 43 | 1550 | [`modules/ADM.md`](modules/ADM.md) |
| `AJS` | 自动分录 | 8 | 375 | [`modules/AJS.md`](modules/AJS.md) |
| `AMS` | 考勤管理 | 6 | 327 | [`modules/AMS.md`](modules/AMS.md) |
| `AQS` | 报价权限 | 2 | 74 | [`modules/AQS.md`](modules/AQS.md) |
| `ASM` | 售后服务 | 48 | 2518 | [`modules/ASM.md`](modules/ASM.md) |
| `AST` | 资产管理 | 28 | 1352 | [`modules/AST.md`](modules/AST.md) |
| `BMS` | 条码管理 | 10 | 575 | [`modules/BMS.md`](modules/BMS.md) |
| `BOM` | 物料清单 | 35 | 1692 | [`modules/BOM.md`](modules/BOM.md) |
| `CMS` | 共用信息设置 | 55 | 2272 | [`modules/CMS.md`](modules/CMS.md) |
| `COP` | 合同管理 | 74 | 4155 | [`modules/COP.md`](modules/COP.md) |
| `CST` | 标准成本 | 15 | 714 | [`modules/CST.md`](modules/CST.md) |
| `CUS` | 合约管理 | 30 | 1301 | [`modules/CUS.md`](modules/CUS.md) |
| `DHQ` | 电子发票队列 | 1 | 32 | [`modules/DHQ.md`](modules/DHQ.md) |
| `DSC` | 系统安全 | 10 | 337 | [`modules/DSC.md`](modules/DSC.md) |
| `EFJ` | 电子凭证队列 | 1 | 39 | [`modules/EFJ.md`](modules/EFJ.md) |
| `EFS` | 电子签核 | 3 | 113 | [`modules/EFS.md`](modules/EFS.md) |
| `EIS` | 决策分析 | 10 | 544 | [`modules/EIS.md`](modules/EIS.md) |
| `EPS` | 出口贸易 | 13 | 693 | [`modules/EPS.md`](modules/EPS.md) |
| `EQT` | 设备管理 | 39 | 1752 | [`modules/EQT.md`](modules/EQT.md) |
| `FAC` | 财务银行 | 9 | 381 | [`modules/FAC.md`](modules/FAC.md) |
| `FCS` | 合并报表 | 15 | 557 | [`modules/FCS.md`](modules/FCS.md) |
| `FTS` | 文件传输 | 3 | 119 | [`modules/FTS.md`](modules/FTS.md) |
| `GFC` | 集团财务 | 25 | 1127 | [`modules/GFC.md`](modules/GFC.md) |
| `GHX` | 借出入归还中间表 | 1 | 51 | [`modules/GHX.md`](modules/GHX.md) |
| `GMP` | GMP质量管理 | 21 | 1090 | [`modules/GMP.md`](modules/GMP.md) |
| `GSP` | 医药GSP | 26 | 1178 | [`modules/GSP.md`](modules/GSP.md) |
| `HRS` | 人力资源 | 43 | 1932 | [`modules/HRS.md`](modules/HRS.md) |
| `INT` | 接口记录 | 12 | 439 | [`modules/INT.md`](modules/INT.md) |
| `INV` | 库存管理 | 50 | 2621 | [`modules/INV.md`](modules/INV.md) |
| `IPS` | 预付采购 | 10 | 532 | [`modules/IPS.md`](modules/IPS.md) |
| `ITM` | 指标管理 | 13 | 517 | [`modules/ITM.md`](modules/ITM.md) |
| `IWC` | 集成工作中心 | 2 | 73 | [`modules/IWC.md`](modules/IWC.md) |
| `JCX` | 借出入中间表 | 1 | 51 | [`modules/JCX.md`](modules/JCX.md) |
| `JHX` | 采购进货中间表 | 1 | 45 | [`modules/JHX.md`](modules/JHX.md) |
| `KBS` | 看板管理 | 26 | 1071 | [`modules/KBS.md`](modules/KBS.md) |
| `LLJ` | 销货检核中间表 | 1 | 34 | [`modules/LLJ.md`](modules/LLJ.md) |
| `LLX` | 领料中间表 | 1 | 47 | [`modules/LLX.md`](modules/LLX.md) |
| `LRP` | 产销计划 | 9 | 466 | [`modules/LRP.md`](modules/LRP.md) |
| `MES` | MES集成 | 1 | 37 | [`modules/MES.md`](modules/MES.md) |
| `MOC` | 制造管理 | 35 | 2241 | [`modules/MOC.md`](modules/MOC.md) |
| `MPS` | 主生产计划 | 9 | 401 | [`modules/MPS.md`](modules/MPS.md) |
| `MRP` | 物料需求计划 | 9 | 373 | [`modules/MRP.md`](modules/MRP.md) |
| `MTF` | 建档格式 | 1 | 31 | [`modules/MTF.md`](modules/MTF.md) |
| `MTP` | 多角贸易 | 9 | 346 | [`modules/MTP.md`](modules/MTP.md) |
| `NOT` | 银行票据 | 32 | 1419 | [`modules/NOT.md`](modules/NOT.md) |
| `OMS` | 费用预算 | 30 | 1365 | [`modules/OMS.md`](modules/OMS.md) |
| `PAL` | 薪资福利 | 69 | 2976 | [`modules/PAL.md`](modules/PAL.md) |
| `PDX` | 盘点中间表 | 1 | 42 | [`modules/PDX.md`](modules/PDX.md) |
| `PMS` | 产品管理 | 2 | 41 | [`modules/PMS.md`](modules/PMS.md) |
| `PSM` | 生产序列管理 | 21 | 839 | [`modules/PSM.md`](modules/PSM.md) |
| `PUR` | 采购管理 | 33 | 1866 | [`modules/PUR.md`](modules/PUR.md) |
| `QMS` | 质量管理 | 28 | 1348 | [`modules/QMS.md`](modules/QMS.md) |
| `RGR` | 报表工具 | 6 | 179 | [`modules/RGR.md`](modules/RGR.md) |
| `RMA` | 维修服务 | 22 | 974 | [`modules/RMA.md`](modules/RMA.md) |
| `RPT` | 报表格式 | 2 | 68 | [`modules/RPT.md`](modules/RPT.md) |
| `SAS` | 销售分析 | 2 | 123 | [`modules/SAS.md`](modules/SAS.md) |
| `SCX` | 生产入库中间表 | 1 | 44 | [`modules/SCX.md`](modules/SCX.md) |
| `SFC` | 车间作业 | 11 | 650 | [`modules/SFC.md`](modules/SFC.md) |
| `TAX` | 税务申报 | 1 | 47 | [`modules/TAX.md`](modules/TAX.md) |
| `TBX` | 调拨中间表 | 1 | 46 | [`modules/TBX.md`](modules/TBX.md) |
| `THX` | 采购退货中间表 | 1 | 49 | [`modules/THX.md`](modules/THX.md) |
| `TIS` | 税务发票 | 6 | 304 | [`modules/TIS.md`](modules/TIS.md) |
| `TLX` | 退料中间表 | 1 | 46 | [`modules/TLX.md`](modules/TLX.md) |
| `TMC` | 流程管理 | 10 | 359 | [`modules/TMC.md`](modules/TMC.md) |
| `TRA` | 传输队列 | 1 | 36 | [`modules/TRA.md`](modules/TRA.md) |
| `UPD` | 数据库升级 | 2 | 61 | [`modules/UPD.md`](modules/UPD.md) |
| `WAR` | 凭证格式 | 1 | 30 | [`modules/WAR.md`](modules/WAR.md) |
| `WTX` | 委外退货中间表 | 1 | 49 | [`modules/WTX.md`](modules/WTX.md) |
| `WWX` | 委外进货中间表 | 1 | 44 | [`modules/WWX.md`](modules/WWX.md) |
| `XHJ` | 销货检核中间表 | 1 | 34 | [`modules/XHJ.md`](modules/XHJ.md) |
| `XHX` | 销货中间表 | 1 | 49 | [`modules/XHX.md`](modules/XHX.md) |
| `XTX` | 销退中间表 | 1 | 49 | [`modules/XTX.md`](modules/XTX.md) |
| `YBX` | 一般交易中间表 | 1 | 43 | [`modules/YBX.md`](modules/YBX.md) |
| `ZXX` | 装箱中间表 | 1 | 40 | [`modules/ZXX.md`](modules/ZXX.md) |

合计：78 个模块 / 1170 张表 / 54842 个字段。

字段数勾稽：模块文件字段合计 54766 + 无模块归属的孤儿表字段 76（`YFMXB`、`YSMXB`）= 54842，与 `fields.json` 总数一致。

模块代码与表名前缀的关系：`module` = 表名**前 3 位**，实测 1168 / 1170 = 99.83% 成立；2 张例外为 `DXL`（module=`COP`）、`V_QIXUBING`（module=`CMS`）。

## 六、OpenAPI 暴露判定（实证优先）

### 6.1 主判定依据：真机反推的物理表映射（高置信）

`knowledge/data-dictionary/node-table-map.csv` 由 `scripts/build-node-table-map.mjs` 对 149 个逻辑节点逐个做真机反推得到，其中 **31 条为 `confidence=HIGH`**，即该节点的请求回参中直接出现了对应物理表名（如 `customer_basic_data_file_data` -> `COPMA`）。这是本字典判定暴露的**唯一硬证据**。

`table-index.csv` 的 `is_openapi_exposed` 取值规则：

| 取值 | 含义 | 表数 |
|---|---|---|
| `是` | 该物理表被 `confidence=HIGH` 的真机反推命中，回参中直接出现物理表名（**硬证据**） | 24 |
| `待确认` | 实体未映射到物理表，但关联 type_key 存在**可用节点**（`ACCEPTED_NO_TABLE`：节点名有效、接口能调通，回参未含物理表名） | 40 |
| `否` | 未被任何 type_key 引用，或关联 type_key 的节点均不可用（`MA012`/`NONE`） | 1110 |

**`否` 与 `待确认` 的 SDK 消费约定（关键）**：

- 二者都**不得**被当作「可调用」。`否` 覆盖了「表未被 type_key 引用」与「表被引用但节点不可用」两种情形，性质不同但同样不可作为可调用依据，合并为保守默认值是安全的。
- `待确认` 额外附带的 `openapi_services` 服务名**仅供试探**，接口能调通但无法证明返回的就是本表数据。
- `否` **不等于**「该表在易飞里不存在」或「无法通过其他途径访问」，只代表当前这149 个反推节点未覆盖到它。

节点反推置信度分布（149 条）：`HIGH` 31 条（已反推出物理表名）、`ACCEPTED_NO_TABLE` 67 条（节点有效但无物理表名）、其余 51 条为 `MA012`（节点未注册）/ `NONE`。

`openapi_services` 列的取值**直接抄自** `knowledge/typekey/typekey_map.yaml` 中对应 type_key 的 `query:` 服务名，未做任何拼接或臆造。

已确证暴露的物理表与业务对象对应关系：

| 物理表 | type_key | query 服务名 | 置信度 |
|---|---|---|---|
| `BOMMA` | `replace.substitute.item` | `yf.oapi.replace.substitute.item.data.query.get` | HIGH |
| `BOMME` | `product.process` | `yf.oapi.product.process.data.query.get` | HIGH |
| `BOMMI` | `engineering.item` | `yf.oapi.engineering.item.data.query.get` | HIGH |
| `CMSMB` | `plant` | `yf.oapi.plant.data.query.get` | HIGH |
| `CMSMC` | `warehouse` | `yf.oapi.warehouse.data.query.get` | HIGH |
| `CMSMD` | `workstation` | `yf.oapi.workstation.data.query.get` | HIGH |
| `CMSMW` | `operation` | `yf.oapi.operation.data.query.get` | HIGH |
| `CMSNA` | `receive.payment.term` | `yf.oapi.receive.payment.term.data.query.get` | HIGH |
| `CMSNO` | `project` | `yf.oapi.project.data.query.get` | HIGH |
| `COPMA` | `customer` | `yf.oapi.customer.data.query.get` | HIGH |
| `COPMB` | `item.customer.price` | `yf.oapi.item.customer.price.query.get` | HIGH |
| `COPME` | `sales.forecast` | `yf.oapi.sales.forecast.data.query.get` | HIGH |
| `COPMG` | `customer.item` | `yf.oapi.customer.item.data.query.get` | HIGH |
| `COPTI` | `sales.return` | `yf.oapi.sales.return.data.query.get` | HIGH |
| `INVMA` | `item.classification` | `yf.oapi.item.classification.data.query.get` | HIGH |
| `INVMB` | `item` | `yf.oapi.item.data.query.get` | HIGH |
| `INVMQ` | `unit` | `yf.oapi.unit.data.query.get` | HIGH |
| `MOCMA` | `outsourcing.price` | `yf.oapi.outsourcing.price.data.query.get` | HIGH |
| `MOCTA` | `wo` | `yf.oapi.wo.data.query.get` | HIGH |
| `MOCTO` | `wo.change` | `yf.oapi.wo.change.data.query.get` | HIGH |
| `PALNO` | `team.personnel` | `yf.oapi.team.personnel.data.query.get` | HIGH |
| `PURMA` | `supplier` | `yf.oapi.supplier.query.get` | HIGH |
| `PURMB` | `item.supplier.price` | `yf.oapi.item.supplier.price.query.get` | HIGH |
| `SFCTA` | `wo.routing` | `yf.oapi.wo.routing.data.query.get` | HIGH |

### 6.2 辅助参考：中文名启发式匹配（不作为判定依据）

`knowledge/typekey/typekey_map.yaml` 的 106 个业务对象使用**逻辑节点名**（如 `purchase_order_detail_data`），**不含任何物理表名**。`knowledge/typekey-mapping/_index.json` 记录 `fields_with_physical_name: 42` / `fields_total: 12893`，即 12893 个 API 字段中仅 42 个给出了大写物理列名（且这 42 个多为 `CONSIGNEE` / `FAX_NO` 等未翻译占位描述，非 `XX001` 式列名）。

因此本字典另做了一轮**中文名启发式匹配**（剥离 `单头档`/`单身档`/`信息档` 等后缀后比对 type_key 标题，必要时用子串 + 长度差 ≤ 6 做唯一命中），结果仅作人工参考，在各模块 md 中以「对应业务对象（启发式参考）」单独列出，**不参与** `is_openapi_exposed` 的取值：

| 判定方式 | 命中表数 | 置信度 |
|---|---|---|
| 中文名归一化精确匹配 | 106 | 中 |
| 中文名归一化子串唯一匹配 | 2 | 低 |
| 未匹配 | 1062 | — |

未被反向匹配到物理表的 type_key 数量：43（共 106 个业务对象）。

**局限声明**：`is_openapi_exposed` 非 `是` 的表共 1150 张（`否` 1110 + `待确认` 40），只代表「本次真机反推未覆盖或节点不可用」，**不代表这些表无法通过 OpenAPI 访问**。`node-table-map.csv` 仅覆盖 149 个逻辑节点，覆盖面有限。SDK 应用该列做「能否直接走 API」的初筛，但不得据此断言某表**不可**访问；要确证需扩大反推覆盖或取得易飞官方接口-表结构对照文档。

## 七、信息缺失声明

以下项**确实无法从现有材料获取**，本字典一律标UNKNOWN / 待确认，未做任何臆造：

| # | 缺失项 | 影响范围 | 现状标注 |
|---|---|---|---|
| 1 | `Z` / `I` 类型码语义 | 23 个字段 | 类型列填 `UNKNOWN(Z)` / `UNKNOWN(I)` |
| 2 | 字段可空性 | 全部 54842 字段 | ADMMD 未登记 nullable，**故字典不设「可空」列**（不做无依据填充） |
| 3 | 字段主键/索引 | 全部表 | 键列留空，仅元数据表自身标 `PK(元数据表)` |
| 4 | 表级业务主键 | 全部表 | 仅 `table-index.csv` 可与 type_key 的业务主键做语义对照 |
| 5 | 模块官方中文名 | 78 个模块 | 由代表性表中文名推断，标注「推断」 |
| 6 | OpenAPI 与物理表对应 | 1170 张表 | 以真机反推为硬证据（见第六节）；标 `否` 者仅表示无实证，非不可访问 |
| 7 | 字段枚举码值 | 全部 54842 字段 | **本字典不含任何枚举定义**：MD008 经实证为格式掩码而非代码表，元数据本身不含枚举表，枚举须真机采集（T-07） |
| 8 | `ADMMC.MC005` / `MC007` / `MC008` 语义 | 表分类信息 | MC005 覆盖率 0.09%（仅表 `DXL` 有值），MC007/MC008 覆盖率 0%，全部 UNKNOWN |
| 9 | `ADMMB.MB003` / `MB005~MB017` 语义 | 程序分类与开关位 | 取值字母数字混合或 Y/N 掩码，无法确证控制行为，全部 UNKNOWN |
| 10 | `ADMMD.MD010` / `MD011` 语义 | 字段属性 | 覆盖率 0%，UNKNOWN |

### 已知异常清单

| 类别 | 明细 |
|---|---|
| 孤儿表（在 `fields.json` 不在 `tables.json`） | `INVLK`、`INVLL`、`YFMXB`、`YSMXB` |
| 其中无对应模块前缀的孤儿表 | `YFMXB`、`YSMXB`（前3 位 `YFM` / `YSM` 不在 78 个模块中，无法归入任何模块字典文件，仅列于本表与 `table-index.csv`） |
| 空字段表（在 `tables.json` 无字段记录） | `PMSTA` |
| 表无中文名 | `PURTG2`、`V_QIXUBING` |
| 字段无中文注释 | 2 个（`PURTG2.01`、`PURTG2.02`） |
| char 类型掩码位数偏离众数 | 6 个（见下方「掩码一致性校验：众数基准法」） |
| 掩码语法待补充 | 4 个（`HHMMSSMMM`，第二个 M 为毫秒位） |
| 非 char 类型挂日期掩码 | 11 个（date/numeric 的 MD006 是 scale，不适用位数校验） |
| 文本类型却带长度 | 2 个（`BOMCB.CB021`=255、`BOMMF.MF008`=8000） |
| 字段名长度非 5 | 421 个（长度口径；与下方「列名体系偏离」的形态口径 711 条不同，勿混用） |
| 序号 MD002 重复 | 33 组（排序/去重须以 `(table, column)` 为准） |

### MD008 语义定案：数据编辑格式掩码（非代码表）

`ADMMD.MD008` **不是**代码表关联，而是**数据编辑格式掩码**（date/format mask）。三条互相独立的证据链：

1. **元数据自证**：979 行的 `ADMMD.MD009`（中文名备注）直接带 `[FORMATE:YM]` 字样，官方元数据自己就把该列称作 FORMATE（格式）。
2. **英文名语义**：`ADMMD.MD007` 为 `Year/Month`、`Effective Date`、`Approve Time`、`Accounting Year` 等日期时间语义，无一处为枚举含义。
3. **位数自洽**：同`(type_raw, mask)` 分组下precision 高度一致（`C/YMD` 830 条中 825 条为 8.0，`C/YM` 82 条中 81 条为 6.0，`C/YMK`、`C/Y` 100% 一致）。

取值分布与推测数据类型（981 个字段带掩码）：

| 掩码 | 字段数 | 掩码种类 | 推测数据类型 | 判定依据 |
|---|---|---|---|---|
| `YMD` | 841 | 符号掩码 | `yyyymmdd` | 展开后 8 位，与precision=8 吻合 |
| `YM` | 82 | 符号掩码 | `yyyymm` | 展开后 6 位，与 precision=6 吻合 |
| `YMK` | 29 | 符号掩码 | `yyyymmdd` | 与 precision=8 吻合；后缀 K 语义未确证，按日期处理 |
| `Y` | 22 | 符号掩码 | `yyyy` | 展开后 4 位，与 precision=4 吻合 |
| `HHMMSSMMM` | 4 | 显式掩码 | `hhmmssmmm` | 字符数 9 == precision=9 |
| `YYYY/MM/DD` | 2 | 显式掩码 | `yyyy/mm/dd` | 字符数 10 == precision=10 |
| `YYMMDDHHMM` | 1 | 显式掩码 | `yymmddhhmm` | 字符数 10 == precision=10 |

> 全部 7 种掩码取值均已归入已知语义，**无未确证项**。

**下游消费约定（务必遵守）**：

- `field-index.csv` 的列名已由 `code_table` 更名为 **`format_mask`**，并新增 `inferred_type` 列给出推测数据类型。
- 原 `code-table-map.csv` 已重命名为 **`format-mask-map.csv`**，列改为 `table,column,column_cn,format_mask,inferred_type,mask_kind,inferred_basis,enum_applicability`。
- `enum_applicability` 统一为 **`不适用（非枚举，日期/时间格式掩码）`**。**下游不得按代码表/枚举关联消费这些字段**，也不得期待通过本字典查到码值。
- 若某字段确为枚举（如标注「1.增、-1.减」），其码值同样不在元数据中，须真机采集。

### 掩码一致性校验：众数基准法

**校验基准为何不能用「掩码位数 == precision 绝对值」**——这是本字典走过的一段弯路，记录在此避免重犯。根因是 `MD006`（precision）在不同 `MD005` 下语义完全不同：

| MD005 | MD006 实际语义 | 能否与掩码位宽比对 |
|---|---|---|
| `C` char | 字符长度 | 能 |
| `D` date | 数值精度 scale，**恒为 `.0`**（实测 22/22 条） | 不能 |
| `N` numeric | 数值精度 scale，如 `16.6` | 不能 |

用绝对值比对，等于把 `D` 类型的 `.0` 当成「长度缺失」，凭空造出 **9 条假异常**（2 条 `D/YMD` + 若干挂掩码的 numeric 字段）。

**众数基准法**：按 `(type_raw, mask)` 分组，取该组 `precision` 的**众数**为基准，仅当 `type_raw == 'C'` 且该字段偏离众数时才计为真异常。依据是「同组同类型同掩码的字段应当同长」这一数据事实，而非外部假设的展开规则。

各组众数分布：

| 类型 | 掩码 | 组内字段数 | precision 众数 | 众数占比 |偏离者 |
|---|---|---|---|---|---|
| `C` | `YMD` | 830 | `8.0` | 99.4% | 5 |
| `C` | `YM` | 82 | `6.0` | 98.8% | 1 |
| `C` | `YMK` | 29 | `8.0` | 100.0% | 0 |
| `C` | `Y` | 22 | `4.0` | 100.0% | 0 |
| `D` | `YMD` | 9 | `.0` | 100.0% | 0 |
| `C` | `HHMMSSMMM` | 4 | `9.0` | 100.0% | 0 |
| `C` | `YYYY/MM/DD` | 2 | `10.0` | 100.0% | 0 |
| `N` | `YMD` | 2 | `1.0` | 100.0% | 0 |
| `C` | `YYMMDDHHMM` | 1 | `10.0` | 100.0% | 0 |

#### 真异常清单：偏离众数的 char 字段（6 个）

| 表 | 列 | 中文名 | 掩码 | 组内众数 | 实际 precision | 英文名 |
|---|---|---|---|---|---|---|
| `ASMTS` | `TS008` | 处理日期 | `YMD` | `8.0` | `12.0` | Process Date |
| `CMSMA` | `MA169` | 固定资产现行年月 | `YM` | `6.0` | `10.0` | Year/Month |
| `HRSTC` | `TC015` | 工作年月起 | `YMD` | `8.0` | `6.0` | Employment Date From |
| `HRSTC` | `TC016` | 工作年月迄 | `YMD` | `8.0` | `6.0` | Year/Month To |
| `PALNF` | `NF014` | 服务年月起 | `YMD` | `8.0` | `6.0` | Service Year Month From |
| `PALNF` | `NF015` | 服务年月迄 | `YMD` | `8.0` | `6.0` | Service Year Month To |

按**偏离方向**分为两类。「方向」是可观测事实，「成因」是推断，二者须分开表述：

| 方向 | 数量 | 表 | 掩码 | 期望位数 | 实际 | 判定 |
|---|---|---|---|---|---|---|
| 偏小 | 4 | `HRSTC`、`PALNF` | `YMD`、`YMD`、`YMD`、`YMD` | 8、8、8、8 | 6.0、6.0、6.0、6.0 | 疑挂错掩码（掩码要求位数 > 列宽，装不下） |
| 偏大 | 2 | `ASMTS`、`CMSMA` | `YMD`、`YM` | 8、6 | 12.0、10.0 | 列宽预留过大（掩码本身可能正确） |

**长度偏小的 4 条最可能是挂错掩码**（掩码要求 8 位但列宽只有 6 位，语义上装不下）。

**长度偏大的 2 条成因不同** —— 列宽大于掩码位数，属预留过多，掩码本身未必错，不应与「挂错掩码」混为一谈。

> 判定依据是**偏离方向**，不使用中文名关键词。
> `CMSMA.MA169` 中文名含「年月」但挂的是正确的 `YM`，若按关键词归类会被误判为挂错掩码。

#### 不计入异常的两类形态（仅供人工参考）

**其一，掩码语法待确证（4 个）**：`HHMMSSMMM` 的 `precision=9` 与 `HH+MM+SS+MMM`（2+2+2+3=9）自洽，且该组众数占比 100%，**不是异常**。但其第二个 `M` 是毫秒位，与年月掩码中的 `M`（月）语义不同，展开规则未确证：

| 表 | 列 | 中文名 | 掩码 | precision |
|---|---|---|---|---|
| `INVLA` | `LA022` | 审核时间 | `HHMMSSMMM` | `9.0` |
| `INVLF` | `LF018` | 入库时间 | `HHMMSSMMM` | `9.0` |
| `INVLG` | `LG008` | 出库时间 | `HHMMSSMMM` | `9.0` |
| `INVLG` | `LG016` | 入库时间 | `HHMMSSMMM` | `9.0` |

**其二，非 char 类型挂日期掩码（11 个）**：`date` / `numeric` 列挂 `YMD` 属类型-掩码脱节，但因 MD006 是 scale 而非字符长度，**不适用位数校验**，故不计入异常：

| 表 | 列 | 中文名 | 类型 | 掩码 | precision |
|---|---|---|---|---|---|
| `EISLB` | `LB008` | 日期 | D | `YMD` | `.0` |
| `EISLC` | `LC008` | 日期 | D | `YMD` | `.0` |
| `EISLD` | `LD012` | 日期 | D | `YMD` | `.0` |
| `EISLE` | `LE010` | 日期 | D | `YMD` | `.0` |
| `EISLF` | `LF002` | 日期 | D | `YMD` | `.0` |
| `EISLG` | `LG006` | 日期 | D | `YMD` | `.0` |
| `EISLH` | `LH012` | 日期 | D | `YMD` | `.0` |
| `EISLJ` | `LJ001` | 日期 | D | `YMD` | `.0` |
| `SASLA` | `LA015` | 日期 | D | `YMD` | `.0` |
| `YFMXB` | `出入` | 出入 | N | `YMD` | `1.0` |
| `YSMXB` | `出入` | 出入 | N | `YMD` | `1.0` |

其中 2 个即孤儿表的 `出入` 字段（`numeric(1,0)` 挂 `YMD`），见下节。

### 列名体系偏离 E10 规范的全量清单

口径：业务字段 26798（剔除 3 张元数据表、剔除 UDF）中，不符合「`XX001` 式5 字符编码」的数量。

**判据**：形态为 `^[A-Z]{2}\d{3}$`，且前缀命中表名中的**实体位**。实体位有两种位置，必须都接受：

| 表名结构 | 例 | 实体位 | 字段前缀 |
|---|---|---|---|
| 模块3 + 实体2 | `PURTC` | `table[-2:]` = `TC` | `TC001` |
| 模块3 + 实体2 + 版本后缀 | `ACTMS205` | `table[3:5]` = `MS` | `MS001` |
| 模块3 + 长实体名 | `DSCINTMA` | `table[-2:]` = `MA` | `MA001` |

因此判据取「`table[-2:]` **或** `table[3:5]` 任一命中」，标准 26087 条。

**不可只用单侧**：仅用 `table[-2:]` 会把 `*205` 子表的 50 个字段误判为非标准；仅用 `table[3:5]` 会把 `DSCINTMA` / `WARRANT` 的 11 个字段误判为非标准。

仅按形态（2 字母 + 3 数字）判定会把 26114 条算成标准，低估非标准数 27 条。

表级口径（同样剔除 UDF 与管理字段）：全部业务字段均非标准 **27 张**；含至少一个非标准字段 **92 张**（= 27 全非标准 + 65 部分非标准）。

| 类别 | 数量 | 定性 |
|---|---|---|
| 7 位完整表名式（`GHXA001`） | 338 | 正常，单据性质表惯例 |
| 表别名前缀式（`TAI01`） | 257 | 正常，3 字母+2 位分区编号 |
| 形态标准但前缀不符 | 27 | 正常，跨表克隆 / 队列表 / 视图 |
| 纯字母（`ID` `STATUS`） | 65 | 正常，队列表语义化命名 |
| 含中文 | 20 | 异常，孤儿表（见下节） |
| 纯数字 | 2 | 异常，字段名退化 |
| 其他（长度 6） | 2 | 正常，语义化命名 |
| **非标准合计** | **711** | — |

逐类说明：

1. **7 位完整表名式（338 条）** —— `GHXA001` / `JCXA001` 等。单据性质类表的字段名带完整表名，是E10 既定设计惯例，**非异常**。
2. **表别名前缀式（257 条）** —— `TAI01` / `TKI01` / `TCK01` 等，形态为 3 字母 + 2 位数字。同样遵循「表前缀 + 序号」规则，只是列名前缀取的是**表别名**而非表名后 2 位（如 `ACRTA` 表用 `TAI` 前缀），用于同表内分区编号避免冲突。**非异常**。
3. **形态标准但前缀不符（27 条）** —— 形态为 `XXnnn` 但前缀不命中实体位，逐条可解释，**无一条属异常**：
   - `EFJOBQUE`（15 条）：表名本身是 `EF`+`JOBQUE` 混合命名，前缀判据不适用
   - `YFMXB` / `YSMXB`（8 条）：孤儿表，字段抄自 `INVMA`（客户）/ `INVTA`（单据）
   - `V_QIXUBING`（2 条）：`V_` 前缀视图，字段抄自员工表
   - `INTLB.LA007` / `PSMMC.LB012`（2 条）：中文名均为「预留字段」，建表时克隆其他表模板留下的痕迹
4. **纯字母列名（65 条）** —— `ID` / `STATUS` / `ISShowST` 等。队列表（`IWCTRANSQUEUE` / `TRANSQUEUE`）与报表格式表（`RPTGRIDFMT`）采用语义化命名，**非异常**。
5. **含中文列名（20 条）** —— 仅 `YFMXB`(9) / `YSMXB`(11)，全库仅这两张表用中文列名。属**孤儿表架构异常**，见下节。
6. **纯数字列名（2 条）** —— `PURTG2.01` / `.02`，字段名退化且中文名全空，**是唯一需要关注的真退化项**。
7. **其他（长度 6，2 条）** —— `FMTNO` / `JOBID` 等，语义化命名，**非异常**。

**结论：非标准 711 条中，仅 2 条（`PURTG2.01/.02`）是真退化，20 条（孤儿表中文列名）需连表整体排除，其余 689 条均属 E10 设计惯例。**

### 孤儿表架构异常（`YFMXB` / `YSMXB`）

全库 54842 个字段中，**只有 20 个使用中文列名**，且全部集中在这两张表：

| 表 | 列数 | 中文列名 | 具体列名 |
|---|---|---|---|
| `YFMXB` | 38 | 9 | `币种`、`单据性质`、`出入`、`日期`、`进货金额`、`开票金额`、`其他应付`、`付款金额`、`应付退款` |
| `YSMXB` | 38 | 11 | `币种`、`单据性质`、`出入`、`单别`、`单号`、`日期`、`销货金额`、`开票金额`、`其他应收`、`收款金额`、`退款金额` |

这两张表的异常特征（三重）：

1. **不在 `tables.json` 中** —— 无 module 归属、无中文表名、无英文表名
2. **列名体系与全库不同** —— 用中文列名，而 E10 正规表全部是 `XX001` 式编码
3. **掩码与列类型脱节** —— `YFMXB.出入` / `YSMXB.出入` 是 `numeric(1,0)` 却挂日期掩码 `YMD`

结论：这两张表**很可能不是 E10 标准元数据表**，而是外部系统导入或手工维护的表。建议 SDK 与统计口径**整体排除**这两张表，不要把它们当E10 业务表处理。

## 八、检索指引

| 场景 | 用法 |
|---|---|
| 已知表名查字段 | 直接打开 `modules/{模块}.md`，检索 `` `表名` `` |
| 已知字段名反查表 | `grep` `field-index.csv` 的 `column` 列 |
| 按中文名找表 | `grep` `field-index.csv` 的 `column_cn` 列 |
| 查某模块全部表 | `grep` `table-index.csv` 的 `module` 列 |
| 查日期/时间格式掩码 | `format-mask-map.csv`（981 行，含推断类型与依据） |
| 查 OpenAPI 服务 | `table-index.csv` 的 `is_openapi_exposed` / `openapi_services`，`是`/`部分` 为真机实证，`否` 仅表示无实证 |
| 找类型定义 | `field-index.csv` 的 `type_norm` 列，`UNKNOWN` 者需人工判定 |

## 九、与 `knowledge/typekey-mapping/` 的关系

| 目录 | 面向对象 | 键| 字段命名 |
|---|---|---|---|
| `knowledge/data-dictionary/`（本目录） | **物理表** | 物理表名（`PURTC`） | `XX001` 编码制，**无语义**，须查中文名 |
| `knowledge/typekey/` | **业务对象** | type_key（`purchase.order`） | 服务名 `yf.oapi.*` |
| `knowledge/typekey-mapping/` | **API 字段** | type_key + 逻辑节点名 | `ac_no` 语义化命名 |

三层之间**缺少权威的物理层映射**，这是当前材料的最大缺口：

- 上层（`ac_no` 等语义名）到中层（`TC005` 等物理列名）**无官方对照**
- 中层到下层（物理表）**无官方对照**

因此 SDK 无法自动生成「语义字段名 -> 物理列名」的映射，现阶段只能靠本字典的 `field-index.csv` 做**人工对齐**。补齐该映射的可靠途径：真机调用 OpenAPI 抓取实际返回的列名，或取得易飞官方提供的接口-表结构对照文档。

## 十、生成信息

| 项 | 值 |
|---|---|
| 生成命令 | `python scripts/gen_data_dictionary.py` |
| 生成时间 | 2026-10-08 22:40:38 |
| 编码 | UTF-8 无BOM|
| 换行 | CRLF |
| 模块文件数 | 78 |
| 模块文件总行数 | 78426 |
| 字段总数 | 54842（业务 26834 + UDF 28008） |
| 表总数 | 1170（tables.json）+ 4（孤儿表） |
| 带格式掩码字段 | 981 |

本文件为机械抽取产物，请勿手工编辑。

