-- vw_ai_inventory_cost：库存成本视图
-- 物理表映射：INVMC（品号仓库档）
-- 字段：MC001 品号 / MC002 仓库 / MC007 现有库存量 / MC008 现有库存成本
-- ✅ 字段名和含义已确认正确
-- 不带 COMPANY 过滤

IF OBJECT_ID('dbo.vw_ai_inventory_cost', 'V') IS NOT NULL DROP VIEW dbo.vw_ai_inventory_cost;
GO

CREATE VIEW dbo.vw_ai_inventory_cost AS
SELECT
  mc.MC001 AS item_no,         -- 品号
  mc.MC002 AS warehouse,       -- 仓库代号
  mc.MC007 AS quantity,        -- 现有库存量
  mc.MC008 AS cost             -- 现有库存成本
FROM dbo.INVMC mc;
GO

-- ⚠ 授权主体由客户 DBA 按环境指定，**默认不授权给 PUBLIC**。
--    分析层只读账号（本项目实测环境为 `ai`）建成后，取消下一行注释并执行：
-- GRANT SELECT ON dbo.vw_ai_inventory_cost TO ai;
GO