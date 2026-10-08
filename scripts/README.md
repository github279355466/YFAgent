# scripts/ — 抽取与校验脚本

两个脚本均从 `docs/易飞OpenAPI.json`（46.5 MB，不入库）机械抽取知识产物，**无第三方依赖**，仅需 Node 20+。

## 用法

```bash
# 生成
node scripts/extract-typekey-map.mjs            # → knowledge/typekey/
node scripts/extract-field-metadata.mjs          # → knowledge/typekey-mapping/

# 只处理指定对象（调试用）
node scripts/extract-field-metadata.mjs --only sales.order,purchase.order,wo

# CI 门禁：内容指纹比对
node scripts/extract-typekey-map.mjs    --check
node scripts/extract-field-metadata.mjs  --check
```

npm 快捷方式：`npm run gen:all` / `npm run check:all`

## 脚本清单

| 脚本 | 行数 | 输出 | 关键能力 |
|---|---|---|---|
| `extract-typekey-map.mjs` | ~430 | `typekey_map.yaml`（80 KB） | 复合主键识别、`no_data_segment` 标记、title降噪 |
| `extract-field-metadata.mjs` | ~700 | 106 个 md（1.8 MB） | 单头/单身分层、必填三态、文档异常标注 |

## 关键实现要点（踩坑记录）

两个脚本共享 5 个已解决的陷阱，改动前请先读脚本头部注释：

1. **真实服务名在公共头 `digi-service` 里**，不在目录名 —— 目录名是中文标签且含`李加伟_测试目录` / `-OK` / `-范例` / 同名重复等噪声
2. **JSONC 容错解析** —— Apipost `raw` 含 `//` 注释，且注释可能出现在字符串值内（`"value": "USD" //注释`）
3. **`not_null` 无区分度** —— 全库均标记为 1（含只读与管理字段），不可作必填判据；改用「字段是否出现在 create/update 入参」这一客观事实
4. **同一服务名有多个重复节点**，多数 `raw_parameter` 为空 —— 合并必须「非空优先」
5. **`create` 只列必填字段，`update` 才是完整字段集** —— 必须取并集

## `--check` 门禁能力

| 场景 | 结果 |
|---|---|
| 产物为最新 | PASS |
| 产物过期（源文件或逻辑变更） | FAIL |
| 单个 md 被篡改 | FAIL + 列出文件名 |
| 产物缺失 | FAIL + 列出文件名 |

实现：FNV-1a32 内容指纹覆盖**索引 + 全部 md**，比对前过滤 `generated_at` 行以避免时间戳造成假失败。

## 扩展约定

新增抽取脚本时须遵守：

1. 头部注释写明**输入 / 输出 / 设计要点 / 已踩过的坑**
2. 产物头部写明「由 XXX 脚本从 YYY 机械抽取生成，请勿手工编辑」
3. 统计信息带溯源标记（源文件名、条目数、覆盖率）
4. **不确定的信息标 `~` 并在注释说明「这是事实，不是缺失」** —— 不臆造
5. 支持 `--check` 作 CI 门禁
6. 保持零第三方依赖（仅用 Node 内置模块）
