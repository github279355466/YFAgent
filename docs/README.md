# docs/ — 文档目录

## 目录职责

| 路径 | 内容 | 入库 |
|---|---|---|
| `plans/` | 方案与规划文档 | ✅ 入库 |
| `decisions/` | 决策记录（ADR + 开放项台账） | ✅ 入库 |
| `易飞OpenAPI.json` | Apipost 导出的官方接口文档原件 | ❌ **不入库** |

## 为什么源文件不入库

`易飞OpenAPI.json`（46.5 MB）含以下敏感信息，**一旦入库即视为凭证泄漏**：

| 类型 | 具体内容 |
|---|---|
| 内网 IP | 5 个测试环境地址（已脱敏为 `{内网IP}`） |
| 用户令牌明文 | `digi-user-token` 的真实值（已脱敏） |
| 账套名 | `CompanyId`（具体值已脱敏） |

`.gitignore` 已排除该文件。获取方式与校验方法见 `../README.md`。

## 派生文档

由源文件机械抽取的**可复现产物**已入库，无需担心敏感信息（抽取过程只取接口名、字段名、类型、描述，不取环境与令牌）：

| 产物 | 脚本 |
|---|---|
| `../knowledge/typekey/typekey_map.yaml` | `../scripts/extract-typekey-map.mjs` |
| `../knowledge/typekey-mapping/*.md` | `../scripts/extract-field-metadata.mjs` |
