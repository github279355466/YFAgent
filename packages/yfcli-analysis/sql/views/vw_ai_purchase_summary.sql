-- vw_ai_purchase_summary：采购汇总视图
-- 物理表映射：PURTC（采购单头）× PURTD（采购单身）
-- 字段：TC001 单别 / TC002 单号 / TC003 日期 / TC004 供应商 / TC014 审核码
--       TD004 品号 / TD008 数量 / TD011 金额
-- JOIN：PURTD.TD001=PURTC.TC001 AND PURTD.TD002=PURTC.TC002
-- 不带 COMPANY 过滤

IF OBJECT_ID('dbo.vw_ai_purchase_summary', 'V') IS NOT NULL DROP VIEW dbo.vw_ai_purchase_summary;
GO

CREATE VIEW dbo.vw_ai_purchase_summary AS
SELECT
  h.TC001 AS doc_type,         -- 采购单别
  h.TC002 AS doc_no,           -- 采购单号
  h.TC003 AS doc_date,         -- 采购日期 YYYYMMDD
  h.TC004 AS supplier_code,    -- 供应商代号
  h.TC014 AS approve_status,   -- 审核码 Y/N/V
  b.TD004 AS product_no,       -- 品号
  b.TD008 AS quantity,         -- 采购数量
  b.TD011 AS amount            -- 采购金额
FROM dbo.PURTC h
JOIN dbo.PURTD b ON b.TD001 = h.TC001 AND b.TD002 = h.TC002;
GO

-- ⚠ 授权主体由客户 DBA 按环境指定，**默认不授权给 PUBLIC**。
--    分析层只读账号（本项目实测环境为 `ai`）建成后，取消下一行注释并执行：
-- GRANT SELECT ON dbo.vw_ai_purchase_summary TO ai;
GO