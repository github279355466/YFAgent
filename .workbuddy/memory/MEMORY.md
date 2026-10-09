# MEMORY.md — 记忆层入口索引

> **本文件是记忆层的唯一入口。** 新会话先读这里，再按需打开 `YYYY-MM-DD.md` 日志或 `docs/`。
> 体量硬上限：**200 行 / 25 KB**（超出部分会话开始时静默不加载）。当前目标 ≤100 行 / ≤18 KB。
>
> **记忆层原则（反膨胀）**：记忆**只增不改**，`docs/` **就地编辑**。
> 稳定的机制知识**毕业进 `docs/`**，记忆层只留**指针**。
> 判断标准——这是「系统怎么工作」还是「当天发生了什么」？前者进 docs，后者留记忆。

---

## 一、记忆文件索引

| 文件 | 一句话说明 |
|---|---|
| `MEMORY.md` | 本文件 —— 入口索引：权威规则摘要 + 文档地图 + 硬约束 |
| `2026-10-09.md` | 知识库同步 + Phase 1 收尾：双通道架构裁决、字段级映射 85 项、库存月档期末公式定稿 |
| `2026-10-08.md` | YFCLI 立项：易飞 OpenAPI 规则实测、命名铁律、真机硬约束、事故记录 |

**已删除（知识已毕业，无需重建）**：

- `2026-10-08-github-sync-attempt.md` → 全部关键知识已进 `docs/GITHUB-SETUP.md`；提交历史见 `git log`
- `2026-10-09.md` 第十一章「YZCLI 架构实证核查」→ 已毕业进 `docs/plans/yzcli-architecture-reference.md`

---

## 二、关键项目指针（跨会话快速定位）

| 主题 | 权威文档 |
|---|---|
| **工程纪律铁律**（4 条，违反即返工） | `AGENTS.md` |
| **统计口径规范**（数字必带标签，禁止裸数字/跨口径相减） | `docs/decisions/STATISTICS-SPEC.md` |
| **开放项台账** | `docs/decisions/OPEN-DECISIONS.md` |
| **任务计划**（D-01~D-14，含依赖与工作量） | `docs/TODO-PLAN.md` |
| **易飞 OpenAPI 规则**（含真机实测） | `docs/plans/yf-openapi-rules.md` |
| **易飞 vs 易助 31 维度差异** | `docs/plans/yf-vs-yizhu-openapi-diff.md` |
| **架构裁决：双通道**（CRUD 走 OpenAPI + 分析走直连） | `docs/TODO-PLAN.md` §一之二 · `docs/plans/yf-db-direct-connect-probe.md` |
| **YZCLI 架构对标参考**（能抄什么/ 必须重写什么） | `docs/plans/yzcli-architecture-reference.md` |
| **库存月档规格**（期末公式，T-14/D-14 视图 DDL 依据） | `docs/plans/inv-monthly-stats-spec.md` |
| **字段映射结果**（85 项，含待裁决 Sheet） | `docs/plans/analysis-table-mapping.xlsx` |
| **GitHub 配置与推送解法** | `docs/GITHUB-SETUP.md` |
| **协作与文件所有权** | `docs/COLLABORATION.md` |

**知识产物**（`knowledge/`，全部由脚本生成，**禁止手工编辑**）：
`data-dictionary/`（78 模块 + 4 CSV）· `typekey/typekey_map.yaml`（106 对象 / 595 服务名）· `typekey-mapping/`（106 份）· `official/`

---

## 三、动手前必须知道的硬约束

### 3.1 工程纪律（违反必返工，本项目已踩坑 5 次）

1. **含反引号的中文文本必须落文件再执行**，禁止 `python -c` / `bash -c` 内联
   （bash 把反引号当命令替换；曾把 46 MB `易飞OpenAPI.json` 当脚本逐行跑，孤儿进程报错 57 分钟）
2. **写文件禁止 `(CR+LF).join(str)` 逐字符拼接**；先在内存拼好再一次性写
3. **统计数字必须带口径标签**，格式如 `711 [严格][字段级]`；禁止裸数字与跨口径相减
   （曾产生 9 个版本的同一数字）
4. **破坏性验证（篡改/转换/批量替换）只在副本上做**，改完校验 sha1 还原

补充：临时脚本放 `.workbuddy/tmp/`，**不要用 `.cache/` 或 `.tmp/`**（`.gitignore` 规则会误伤）。

### 3.2 产物与门禁

- 所有文件统一 **CRLF 行尾 + UTF-8 无 BOM**
- `knowledge/**` **禁止手工编辑** —— 跑 `npm run gen:all` 覆盖
- **提交前必跑 `npm run verify`**（敏感扫描 + 四类产物校验）
- 修改抽取脚本后：`npm run gen:all && npm run check:all`

### 3.3 文件所有权（2026-10-08 定，避免并发返工）

`scripts/gen_data_dictionary.py` = **单一 owner**（其他角色只提 issue）·`scripts/*.mjs` 与 `packages/yfcli-sdk/src/**` = 开发侧可改 · 校验脚本（`qa_*.py` / `_verify_*.py`）= QA 与架构师**只读**

### 3.4 易飞OpenAPI 真机硬约束（违反不报错但会出错数据）

| 约束 | 后果 |
|---|---|
| 枚举查询只传编码（回参是`Y.已审核`，条件只认`Y`） | 传回参值 → **静默返回空集** |
| `conditions` 必须是**对象**形态 | 数组形态 → 显式报错 `conditions not found.` |
| `node_name` 用逻辑 `*_data` 名，不用物理表名 | 传物理表名 → `MA012未定義` |
| 字段名无语义（`TC001` 非 `doc_type_no`），必须查字典 | 猜字段名 → 空结果 |
| 成功判据用 `execution.code === "0" \| "-0"` | 禁止字符串匹配 description（繁简混用） |
| 主键全错返回 `code=0` + 空数组 | 不能用 `code` 判断「查到了」 |
| 错误 token 返回 HTTP 500 + HTML（非 JSON） | 先判 HTTP 状态码，别解析 body |

### 3.5 数据层口径陷阱

- **审核码**：易飞为 **Y/N/V 三值**，`V` = 作废，统计**只筛 `Y`**（易助为 `'T'`，勿混用）
- **哨兵值必须转NULL**：`LA016`/`ML004`（批号）= `********************`，`LA023`/`ML003`（库位）= `########__`
- **`COMPANY` 是预留管理字段**，无业务含义；视图**不带 `COMPANY` 过滤**（独立公司账套）
- **库表名与字典表名 100% 同名**（3 位前缀交叉比对 52 组，52 组一致 / 0 组不同）→ **无需映射层**
- **`INVLC`/`INVLE` 的权威字段定义在 `knowledge/表结构信息/INV2-003.SDD`**（GBK/ANSI 编码 + CRLF，非 UTF-8），
  因 `field-index.csv` 未收录这批表、`column_cn` 全空
- **单别 ≠ 单据类型**：须经 `CMSMQ` 关联取 `MQ003`；**易助/易飞单据编码同码不同义**（如 33：易飞=采购单，易助=销货单）
- **不要臆测**：文档未说明的信息（频率限制 / Token 有效期 / 超时 / 版本差异等）→ 记入 `docs/decisions/OPEN-DECISIONS.md`，不要编造

---

## 四、记忆层维护规则

1. **不新增机制细节到本文件** —— 细节属于 `YYYY-MM-DD.md` 或 `docs/`
2. **单个日志文件超~100 行** → 主动把稳定知识毕业进 `docs/`，日志只留指针
3. **每日增量写新文件**，不往旧文件追加（`2026-10-09.md` 曾达 383 行即因未及时毕业）
4. **相对时间必须改绝对日期**（「今天」「昨天」「最近」→「2026-10-09」）
5. **开放项须带处置结论**：已落地 → 链接 commit 并删；未落地 → 标「未决，未排期，触发条件=X」；已放弃 → 删。
   **禁止让未排期事项冒充已排期承诺**
6. **与 `AGENTS.md` 冲突时以 `AGENTS.md` 为准**（它是规则真身）
6. **与 `AGENTS.md` 冲突时以 `AGENTS.md` 为准**（它是规则真身）