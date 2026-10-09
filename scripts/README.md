# scripts/ — 产物生成与真机探测脚本

本目录共**11 个脚本**（10 个可执行脚本 + 本说明文件），按**两类**组织：

| 类别 | 数量 | 能否离线重跑 | 产物去向 | 是否进 CI 门禁 |
|---|---|---|---|---|
| **产物生成脚本** | 6 | ✅ 可离线重跑 | 入库（`knowledge/`） | ✅ 进 `check:all` |
| **真机探测脚本** | 4 | ❌ 需内网真机环境 | `runs/`（已 gitignored） | ❌ 不进 CI |
| **敏感信息门禁** | 1 | ✅ 全仓扫描 | — | ✅ 进 `verify` |

**运行环境**：Node 20+，**零第三方依赖**（仅用 Node 内置模块；`gen_data_dictionary.py` 需 Python 3）。

**源文件**：`docs/易飞OpenAPI.json` —— 实际大小 **50,401,916 字节（约 48 MiB）**，**不入库**（含内网 IP / token 明文 / 账套名）。需单独获取，见 README「本地环境准备」。

---

## 一、产物生成脚本（6 个）

可离线重跑，产物入库，**改动会被 `npm run check:all` 拦住**。

| 脚本 | 一句话用途 | 产出物 | npm script 引用 |
|---|---|---|---|
| `extract-typekey-map.mjs` | 从OpenAPI JSON 抽取业务对象 → 服务名映射 | `knowledge/typekey/typekey_map.yaml`（106 对象 / 595 服务名） | ✅ `gen:typekey` / `check:typekey` |
| `extract-field-metadata.mjs` | 抽取各对象的字段清单与必填三态 | `knowledge/typekey-mapping/*.md`（106 份 / 12,893 字段） | ✅ `gen:fields` / `check:fields` |
| `gen_data_dictionary.py` | 生成 78 个模块级字典 + 3 份 CSV（**最大脚本**，约 115 KB） | `knowledge/data-dictionary/modules/*.md` + `field-index` / `table-index` / `format-mask-map` CSV（另**读取** `node-table-map.csv` / `sdd-*.csv` 作高置信证据） | ✅ `gen:dictionary` / `check:dictionary` |
| `gen-domain-map.mjs` | 由typekey_map 推断业务域归属草案 | `knowledge/official/menus/domain-map-draft.{md,csv}` + `_report.json` | ✅ `gen:domain` / `check:domain` |
| `extract-sdd-metadata.mjs` | 从 GBK 编码 `.SDD` 规格文件抽取主键与索引 | `sdd-table-meta.csv`（每表一行）/ `sdd-index.csv`（每索引一行） | ❌ **无入口，见下方缺口** |
| `gen-er-overview.py` | 推断表间ER 关联（**明示为推断非声明**） | `ER-OVERVIEW.md` + `ER-relations.csv` + `ER-relations._report.json` | ❌ **无入口，见下方缺口** |

### ⚠️ 已知缺口（待补）

`extract-sdd-metadata.mjs` 与 `gen-er-overview.py` **目前无 `npm run`入口、也无 `--check` 守护**：

- 两者均**产出真实入库产物**，不是死代码，**不能删**
- 但产物被手工改动或过期时，`npm run check:all` **不会FAIL** —— CI 存在盲区
- **待补**：① 各加一个 `gen:*` npm 入口；② 各加 `--check` 指纹校验并接入 `check:all`

`gen_data_dictionary.py` 虽已接入 `check:dictionary`，但其 `_gen-stats.json` 尚未接 CI（见 `OPEN-F7` 防复发机制）。

---

## 二、真机探测脚本（4 个）

**需内网真机环境**（`YF_BASE_URL` / `YF_COMPANY_ID` / `YF_USER_TOKEN`经环境变量注入），只读探测，产物写`runs/`（已 gitignored）。**均无 npm script 入口，需手动执行。**

| 脚本 | 一句话用途 | 产出物 | npm script 引用 |
|---|---|---|---|
| `probe-live-env.mjs` | 15 项只读环境连通性探测（15/15 PASS） | `runs/probe-live-env-report.md` | ❌ 手动 |
| `probe-unknown-pk.mjs` | 对 `primary_key` 为空的对象，用「query 首行 + 唯一性过滤」反推候选主键 | 主键候选结论（打印 + 报告） | ❌ 手动 |
| `build-node-table-map.mjs` | 从真机错误消息反推「逻辑节点名 → 物理表名」（v2：从字段字典取探测字段提高命中率） | `knowledge/data-dictionary/node-table-map.csv`（**入库**）+ `runs/node-table-map.json` | ❌ 手动 |
| `verify-node-names.mjs` | 批量验证 175 个单身节点名，分 ACCEPT / OTHER / MA012 三类 | `runs/node-name-verify.{md,json}` | ❌ 手动 |

> `build-node-table-map.mjs` 虽属真机探测，但其 CSV 产物**入库**并被 `gen_data_dictionary.py`当作高置信证据读取，故不可随意重跑覆盖。
>
> ⚠️ `probe-unknown-pk.mjs` 产出的是**当前数据下的候选唯一键**，不等于业务主键；正式主键须由易飞规格文档确认。

---

## 三、敏感信息门禁（1 个）

| 脚本 | 一句话用途 | 产出物 | npm script 引用 |
|---|---|---|---|
| `scan-secrets.mjs` | 全仓 7 类敏感信息扫描（token / 账套名 / 内网 IP 等） | — | ✅ `scan:secrets` / `scan:secrets:staged`（并入 `verify`） |

---

## 四、用法

```bash
# 生成全部入库产物（4 类，有 npm 入口的）
npm run gen:all      # = gen:typekey + gen:fields + gen:domain + gen:dictionary

# 校验产物是否为最新（CI 门禁，比对内容指纹）
npm run check:all    # = check:typekey + check:fields + check:domain + check:dictionary

# 提交前必跑
npm run verify       # = scan:secrets + check:all

# 调试：只处理指定对象
node scripts/extract-field-metadata.mjs --only sales.order,purchase.order,wo

# 单独校验某脚本（需已生成过产物）
node scripts/extract-typekey-map.mjs --check

# 无 npm 入口的两个脚本：只能手动跑，无 --check 守护
python scripts/gen_data_dictionary.py --verify-stats   # 这个有接check:dictionary
node  scripts/extract-sdd-metadata.mjs# ⚠️ 无 --check
python scripts/gen-er-overview.py                      # ⚠️ 无 --check
```

---

## 五、关键实现要点（踩坑记录）

`extract-typekey-map.mjs` 与 `extract-field-metadata.mjs` 共享 5 个已解决的陷阱，改动前请先读脚本头部注释：

1. **真实服务名在公共头 `digi-service` 里**，不在目录名 —— 目录名是中文标签且含 `李加伟_测试目录` / `-OK` / `-范例` / 同名重复等噪声
2. **JSONC 容错解析** —— Apipost `raw` 含 `//` 注释，且注释可能出现在字符串值内（`"value": "USD" //注释`）
3. **`not_null` 无区分度** —— 全库均标记为 1（含只读与管理字段），不可作必填判据；改用「字段是否出现在 create/update 入参」这一客观事实
4. **同一服务名有多个重复节点**，多数 `raw_parameter` 为空 —— 合并必须「非空优先」
5. **`create` 只列必填字段，`update` 才是完整字段集** —— 必须取并集

> **服务名须用自己作键** —— `bom.query` 等操作名下有 2 个服务名，按操作名单键记录会后写覆盖先写（`OPEN-F8`）。产物已改用 `services_by_name`（键=完整服务名）+ `service_conflicts` 标记。

---

## 六、`--check` 门禁能力

适用于已接入 npm 的 4 个产物生成脚本：

| 场景 | 结果 |
|---|---|
| 产物为最新 | PASS |
| 产物过期（源文件或逻辑变更） | FAIL |
| 单个 md 被篡改 | FAIL + 列出文件名 |
| 产物缺失 | FAIL + 列出文件名 |

实现：FNV-1a32 内容指纹覆盖**索引 + 全部 md**，比对前过滤 `generated_at` 行以避免时间戳造成假失败。

> ⚠️ **盲区**：`extract-sdd-metadata.mjs` / `gen-er-overview.py` 的产物**不在指纹覆盖范围内** —— 见第一节「已知缺口」。

---

## 七、扩展约定

新增抽取脚本时须遵守：

1. 头部注释写明**输入 / 输出 / 设计要点 / 已踩过的坑**
2. 产物头部写明「由 XXX 脚本从 YYY 机械抽取生成，请勿手工编辑」
3. 统计信息带溯源标记（源文件名、条目数、覆盖率）
4. **不确定的信息标 `~` 并在注释说明「这是事实，不是缺失」** —— 不臆造
5. **支持 `--check` 作 CI 门禁，并接入 `npm run check:all`**（`extract-sdd-metadata.mjs` / `gen-er-overview.py` 尚未做到，是待补缺口）
6. 保持零第三方依赖（仅用 Node 内置模块）
7. 产物写`knowledge/` 或 `runs/` 时统一 **CRLF + UTF-8 无 BOM**
