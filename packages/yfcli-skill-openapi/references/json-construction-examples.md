# JSON 组装示例（易飞版）

> 本文档提供易飞 ERP 各操作类型的完整 JSON 组装示例。
> 所有字段名均来自 `typekey_map.yaml` 真实数据，可直接复制使用。

## 易飞 vs 易助关键差异

| 维度 | 易飞 (YF) ✅ | 易助 (YZ) ❌ |
|------|-------------|-------------|
| conditions 结构 | **对象** `{ operator: "AND", fields: [...] }` | 嵌套数组 `[{ groups: [{ fields }] }]` |
| 写操作容器 | **容器名直接作为 parameter 子节点** `{ plant_data: [...] }` | `cdsMaster` 包裹 |
| 字段命名 | **语义名** `plant_no` / `doc_type_no` | 编号 `IBA001` / `IBB003` |
| 枚举传值 | **只传编码** `Y` | 可传 `Y.已审核` |
| 服务名获取 | **只能查表**（`typekey_map.yaml` / `yf_manifest`） | 可按规则拼接 |
| 分页起始 | `page_no` 从 **1** 开始 | 从 0 开始 |
| fastquery | **无**（所有查询重查数据库） | 有 |
| node_name | 用**逻辑节点名** `*_data` | 不需要 |

---

## 查询 (query.get)

### 基础搜索（无条件）

```json
{
  "type_key": "plant",
  "operation": "query",
  "input": {
    "page_no": 1,
    "page_size": 20
  }
}
```

### 条件搜索（单条件）

```json
{
  "type_key": "customer",
  "operation": "query",
  "input": {
    "page_no": 1,
    "page_size": 20,
    "conditions": {
      "operator": "AND",
      "fields": [
        { "field_name": "customer_no", "operator": "=", "value": "C0092" }
      ]
    }
  }
}
```

### 条件搜索（多条件 AND + 日期范围）

```json
{
  "type_key": "sales.order",
  "operation": "query",
  "input": {
    "page_no": 1,
    "page_size": 50,
    "conditions": {
      "operator": "AND",
      "fields": [
        { "field_name": "doc_date", "operator": "BETWEEN", "value": "'20260101' AND '20260331'" },
        { "field_name": "approve_status", "operator": "=", "value": "Y" }
      ]
    }
  }
}
```

> ⚠️ **枚举字段只传编码**：`approve_status` 回参是 `Y.已审核`，但查询条件必须只传 `Y`。

### 模糊搜索 + 排序

```json
{
  "type_key": "item",
  "operation": "query",
  "input": {
    "page_no": 1,
    "page_size": 10,
    "conditions": {
      "operator": "AND",
      "fields": [
        { "field_name": "item_name", "operator": "LIKE", "value": "%电阻%" }
      ]
    },
    "order_by": "item_no ASC"
  }
}
```

### IN 条件

```json
{
  "type_key": "purchase.order",
  "operation": "query",
  "input": {
    "page_no": 1,
    "page_size": 20,
    "conditions": {
      "operator": "AND",
      "fields": [
        { "field_name": "supplier_no", "operator": "IN", "value": "(N'SUP001',N'SUP002',N'SUP003')" }
      ]
    }
  }
}
```

### 组合字段条件

```json
{
  "conditions": {
    "operator": "AND",
    "fields": [
      { "field_name": "doc_type_no+doc_no", "operator": "=", "value": "5301SO20260001" }
    ]
  }
}
```

### 条件操作符速查

| 操作符 | value 格式 | 示例 |
|--------|-----------|------|
| `=` / `!=` | 纯值 | `"C0092"` |
| `LIKE` | 通配符写在 value 内 | `"00%"` / `"%00%"` |
| `BETWEEN` | `'<起>' AND '<止>'` | `"'20260101' AND '20260331'"` |
| `IN` / `NOT IN` | `(N'v1',N'v2')` | `"(N'000',N'001')"` |
| `>` / `>=` / `<` / `<=` | 纯值 | `"20260101"` |
| `EXISTS` / `NOT EXISTS` | SQL 子查询，`field_name` 留空 | `"(SELECT ...)"` |
| `IN` + 子查询 | `$$表名` 前缀 + 必须起别名 | `"(SELECT MB001 FROM $$INVMB WHERE ...)"` |

---

## 读取 (read.get)

> **read 返回单头 + 单身明细**，适合查看详情。query 只返回单头。

### 按主键读取（单主键）

```json
{
  "type_key": "plant",
  "operation": "read",
  "input": {
    "datakeys": [
      { "plant_no": "01" }
    ]
  }
}
```

### 按复合主键读取

```json
{
  "type_key": "sales.order",
  "operation": "read",
  "input": {
    "datakeys": [
      { "doc_type_no": "5301", "doc_no": "SO20260001" }
    ]
  }
}
```

> ⚠️ **复合主键必须包含全部字段**。缺一个就定位不到记录，且返回 `code=0` + 空数组（不报错）。

### 读取含单身明细的单据

```json
{
  "type_key": "purchase.order",
  "operation": "read",
  "input": {
    "datakeys": [
      { "doc_type_no": "5301", "doc_no": "PO20260001" }
    ]
  }
}
```

返回结果中包含 `purchase_order_data`（单头）和 `purchase_order_detail_data`（单身明细行）。

### 查单身字段必须用 read

```text
❌ query + node_name → MA012未定義
✅ read + datakeys → 返回完整单身数据
```

---

## 创建 (create)

> ⚠️ **易飞不使用 cdsMaster**。容器名直接作为 `parameter` 的子节点，值为数组。

### 创建基础资料（工厂）

```json
{
  "type_key": "plant",
  "operation": "create",
  "input": {
    "plant_data": [
      {
        "plant_no": "TEST01",
        "plant_name": "测试工厂"
      }
    ]
  }
}
```

### 创建客户

```json
{
  "type_key": "customer",
  "operation": "create",
  "input": {
    "customer_address_data": [
      {
        "customer_no": "C9999",
        "customer_name": "测试客户",
        "address": "上海市浦东新区"
      }
    ]
  }
}
```

> 📌 容器名 `customer_address_data` 来自 `typekey_map.yaml` 的 `detail_nodes[0]`。

### 创建交易单据（含单身明细）

```json
{
  "type_key": "sales.order",
  "operation": "create",
  "input": {
    "sales_order_data": [
      {
        "doc_type_no": "5301",
        "doc_no": "",
        "doc_date": "20261010",
        "customer_no": "C0092",
        "currency": "CNY"
      }
    ],
    "sales_order_detail_data": [
      {
        "doc_type_no": "5301",
        "doc_no": "",
        "seq": 1,
        "item_no": "ITEM001",
        "quantity": 100,
        "unit_price": 25.5
      },
      {
        "doc_type_no": "5301",
        "doc_no": "",
        "seq": 2,
        "item_no": "ITEM002",
        "quantity": 50,
        "unit_price": 18.0
      }
    ]
  }
}
```

**注意事项**：
- 单号 `doc_no` 传空字符串 `""`，ERP 自动编号
- 日期格式 `YYYYMMDD`（不是 ISO 格式）
- 单头和单身的 `doc_type_no` + `doc_no` 必须一致
- 数值字段用数字类型，不用字符串
- 容器名从 `typekey_map.yaml` 查表获取，禁止硬编码

### 容器名确定优先级

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1️⃣ | `container_name_verified` | 真机实测确认（仅 5 个文档错误对象有此字段） |
| 2️⃣ | `detail_nodes[0]` | 大多数对象的正确容器名 |
| 3️⃣ | 按规则推测 | `{type_key}_data`（需真机验证） |

---

## 更新 (update)

> **推荐流程：先 read → 修改目标字段 → update**。避免遗漏必填字段。

### 完整更新流程

```text
Step 1: read 获取当前完整数据
  yf_read("plant", datakeys=[{plant_no:"01"}])

Step 2: 展示给用户确认变更内容

Step 3: 构造 update 请求体（传入完整字段，修改目标字段）
```

```json
{
  "type_key": "plant",
  "operation": "update",
  "input": {
    "plant_data": [
      {
        "plant_no": "01",
        "plant_name": "上海总部"
      }
    ]
  }
}
```

### 更新交易单据

```json
{
  "type_key": "sales.order",
  "operation": "update",
  "input": {
    "sales_order_data": [
      {
        "doc_type_no": "5301",
        "doc_no": "SO20260001",
        "doc_date": "20261010",
        "customer_no": "C0092",
        "remark": "加急订单"
      }
    ],
    "sales_order_detail_data": [
      {
        "doc_type_no": "5301",
        "doc_no": "SO20260001",
        "seq": 1,
        "item_no": "ITEM001",
        "quantity": 200,
        "unit_price": 25.5
      }
    ]
  }
}
```

> ⚠️ update 时单身「存在则更新、不存在则新增」，但**不支持删除单身行**。

---

## 删除 (delete)

### 删除基础资料

```json
{
  "type_key": "plant",
  "operation": "delete",
  "input": {
    "datakeys": [
      { "plant_no": "TEST01" }
    ]
  }
}
```

### 删除交易单据（复合主键）

```json
{
  "type_key": "sales.order",
  "operation": "delete",
  "input": {
    "datakeys": [
      { "doc_type_no": "5301", "doc_no": "SO20260001" }
    ]
  }
}
```

---

## 审核 / 撤审 / 作废

### 审核 (approve)

```json
{
  "type_key": "sales.order",
  "operation": "approve",
  "input": {
    "datakeys": [
      { "doc_type_no": "5301", "doc_no": "SO20260001" }
    ]
  }
}
```

### 撤审 (disapprove)

```json
{
  "type_key": "sales.order",
  "operation": "disapprove",
  "input": {
    "datakeys": [
      { "doc_type_no": "5301", "doc_no": "SO20260001" }
    ]
  }
}
```

### 作废 (invalid)

```json
{
  "type_key": "accounting.voucher",
  "operation": "invalid",
  "input": {
    "datakeys": [
      { "doc_type_no": "1", "doc_no": "V20260001" }
    ]
  }
}
```

---

## 智能问数 (yf_ask)

自然语言提问，Agent 自动转换为聚合查询：

```text
用户："本月销售额比上月下降多少？"
→ yf_ask(question="本月销售额比上月下降多少")

用户："Top 10 客户的采购金额排名"
→ yf_ask(question="Top 10 客户的采购金额排名")
```

---

## 自检清单（组装 JSON 后必检）

- [ ] **conditions 是对象形态** `{ operator, fields }`，不是数组
- [ ] **枚举只传编码**（`Y` 不是 `Y.已审核`）
- [ ] **容器名从 typekey_map 查表**，不是硬编码或拼接
- [ ] **写操作用 `{ containerName: [...] }`**，不是 `{ cdsMaster: [...] }`
- [ ] **日期格式 YYYYMMDD**（不是 ISO 格式）
- [ ] **复合主键包含全部字段**（`doc_type_no + doc_no`）
- [ ] **字段名是语义名**（`plant_no`），不是编号（`IBA001`）
- [ ] **数值字段用数字类型**（不是字符串）
- [ ] **服务名从 typekey_map 查表**，不是拼接
- [ ] **node_name 用逻辑节点名**（`*_data`），不是物理表名
