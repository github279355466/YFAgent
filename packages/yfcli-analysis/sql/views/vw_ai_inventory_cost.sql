-- vw_ai_inventory_cost：库存成本视图
-- 物理表映射：INVMC（品号仓库档）
-- 字段：MC001 品号 / MC002 仓库 / MC007 现有库存量 / MC008 现有库存成本
-- ✅ 字段名和含义已确认正确
-- 不带 COMPANY 过滤

CREATE VIEW dbo.vw_ai_inventory_cost AS
SELECT
  mc.MC001 AS item_no,         -- 品号
  mc.MC002 AS warehouse,       -- 仓库代号
  mc.MC007 AS quantity,        -- 现有库存量
  mc.MC008 AS cost             -- 现有库存成本
FROM dbo.INVMC mc;
GO

GRANT SELECT ON dbo.vw_ai_inventory_cost TO PUBLIC;
GO