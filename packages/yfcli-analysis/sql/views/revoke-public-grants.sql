-- ════════════════════════════════════════════════════════════════════════
-- revoke-public-grants.sql —— 撤销 vw_ai_* 视图对 PUBLIC 的 SELECT 授权
--
-- 用途：9 个 vw_ai_* 只读视图的初版 DDL 曾以 `GRANT SELECT ... TO PUBLIC`
--       执行（2026-10-09 由 DBA 在客户环境落地）。`PUBLIC` 是所有登录的
--       隐含角色，等于把应收/应付/总账/毛利数据开放给库内任意账号。
--       本脚本用于**已在真机执行过旧版 DDL 的环境**做补救。
--
-- 执行账号：需对目标视图有 GRANT/REVOKE 权限（如 db_owner）。
-- 幂等性：REVOKE 对「本无授权」的视图不报错，可重复执行。
--
-- 执行顺序建议：
--   ① 先建只读账号（若尚未建，见本文件末「只读账号创建」）
--   ② 执行本脚本撤销 PUBLIC
--   ③ 对每个视图执行 GRANT SELECT ... TO <只读账号>
--   ④ 用只读账号连库，验证 `SELECT TOP 1 * FROM dbo.vw_ai_<x>` 可返回数据
--
-- ⚠ 只读账号名因客户环境而异（本项目实测环境为 `ai`）。执行前请把下方
--   所有 `<只读账号>` 替换为实际账号名。
-- ════════════════════════════════════════════════════════════════════════

REVOKE SELECT ON dbo.vw_ai_sales_margin     FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_inventory_cost   FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_purchase_summary FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_ar_balance       FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_ap_balance       FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_production_cost  FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_gl_balance       FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_collection       FROM PUBLIC;
REVOKE SELECT ON dbo.vw_ai_payment          FROM PUBLIC;
GO

-- ── 授予只读账号（取消注释并替换 <只读账号>）──────────────────────────
-- GRANT SELECT ON dbo.vw_ai_sales_margin     TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_inventory_cost   TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_purchase_summary TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_ar_balance       TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_ap_balance       TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_production_cost  TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_gl_balance       TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_collection       TO <只读账号>;
-- GRANT SELECT ON dbo.vw_ai_payment          TO <只读账号>;
-- GO

-- ── 权限收口建议（可选，按客户安全策略决定）──────────────────────────
-- 只读账号应**只能**读视图，不能读底层物理表。若客户允许最小权限模型：
--   ① 不授予只读账号任何物理表的 SELECT
--   ② 视图所有权归 dbo；SQL Server 的所有权链（ownership chaining）会
--      自动放行「视图 → 底表」的读取，无需额外授权
--   ③ 若因权限不足报错，说明所有权链断裂（视图属主 ≠ 底表属主），
--      此时需：ALTER AUTHORIZATION ON dbo.vw_ai_<x> TO dbo;
--
-- ── 只读账号创建参考（若尚不存在，由客户 DBA 按安全策略执行）──────────
-- CREATE LOGIN ai WITH PASSWORD = N'<强密码>', CHECK_POLICY = ON;
-- USE <目标账套库>;
-- CREATE USER ai FOR LOGIN ai;
-- -- 仅授予「连接」与「读视图」所需的最小权限
-- GRANT CONNECT TO ai;

-- ── 验证（用只读账号执行）────────────────────────────────────────────
-- 1) 确认 PUBLIC 已无授权：应返回 0 行
-- SELECT pr.name AS principal, p.permission_name, p.state_desc
-- FROM sys.database_permissions p
-- JOIN sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
-- WHERE p.class_desc = 'OBJECT_OR_COLUMN' AND pr.name = 'public';
--
-- 2) 确认只读账号有授权：应返回 9 行
-- SELECT OBJECT_NAME(p.major_id) AS view_name, p.permission_name
-- FROM sys.database_permissions p
-- JOIN sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
-- WHERE pr.name = N'<只读账号>' AND p.permission_name = 'SELECT';
--
-- 3) 逐视图取数：9 个视图均应能返回数据
-- SELECT TOP 1 * FROM dbo.vw_ai_sales_margin;
-- SELECT TOP 1 * FROM dbo.vw_ai_inventory_cost;
-- SELECT TOP 1 * FROM dbo.vw_ai_purchase_summary;
-- SELECT TOP 1 * FROM dbo.vw_ai_ar_balance;
-- SELECT TOP 1 * FROM dbo.vw_ai_ap_balance;
-- SELECT TOP 1 * FROM dbo.vw_ai_production_cost;
-- SELECT TOP 1 * FROM dbo.vw_ai_gl_balance;
-- SELECT TOP 1 * FROM dbo.vw_ai_collection;
-- SELECT TOP 1 * FROM dbo.vw_ai_payment;