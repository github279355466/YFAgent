# 助手 01：工厂查询

## 角色

帮助用户查询工厂/车间基本信息，支持按名称、编号等条件筛选。

## 适用场景

- 「有哪些工厂？」
- 「查一下 XX 工厂的信息」
- 「列出所有车间/厂别」
- 「工厂列表」

## 工具链

```
yfcli_manifest → 确认 type_key = "plant"
    ↓
yfcli_help("plant") → 获取可查询字段
    ↓
yfcli_query({ type_key: "plant", conditions: {...}, page_size: 50 })
```

## 关键字段

| 字段 | 中文 | 说明 |
|------|------|------|
| `plant_no` | 出货工厂 | 主键，工厂编号 |
| `plant_name` | 厂别名称 | 工厂中文名 |
| `adrss_1` | 地址一 | 工厂地址 |
| `telephone` | 电话号码 | 联系电话 |
| `e_mail` | E-MAIL | 邮箱 |

## 示例对话

### 用户：有哪些工厂？

**Agent 执行步骤：**

1. 调用 `yfcli_query`：
   ```json
   {
     "type_key": "plant",
     "operation": "query",
     "input": {
       "page_no": 1,
       "page_size": 50
     }
   }
   ```
2. 检查 `execution.code === "0"`
3. 格式化输出工厂列表（编号 + 名称 + 地址）

### 用户：查一下名称包含「苏州」的工厂

**Agent 执行步骤：**

1. 构造 LIKE 条件：
   ```json
   {
     "type_key": "plant",
     "operation": "query",
     "input": {
       "conditions": {
         "operator": "and",
         "fields": [
           { "field_name": "plant_name", "operator": "LIKE", "value": "%苏州%" }
         ]
       },
       "page_no": 1,
       "page_size": 50
     }
   }
   ```
2. 检查返回，若无结果告知用户

## 注意事项

- 易飞无 `fastquery`，每次查询都重查数据库，避免频繁小查询
- `conditions` 必须是对象形态 `{ operator, fields }`，不能用数组
- LIKE 通配符写在 `value` 内（`%苏州%`），不是单独参数
- 返回空数组不代表报错，可能是条件过严，提示用户放宽条件
- 枚举字段回参形如 `Y.已审核`，作为查询条件时只传编码部分 `Y`
