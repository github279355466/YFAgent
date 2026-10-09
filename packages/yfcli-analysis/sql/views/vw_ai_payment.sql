-- vw_ai_payment：付款金额视图
-- 物理表映射：ACPTK（付款单头档）
-- 字段：TK001 单别 / TK002 单号 / TK003 日期 / TK004 应付对象 / TK031 本币实付金额 / TK020 审核码
-- 不带 COMPANY 过滤

CREATE VIEW dbo.vw_ai_payment AS
SELECT
  tk.TK001 AS doc_type,        -- 付款单别
  tk.TK002 AS doc_no,          -- 付款单号
  tk.TK003 AS doc_date,        -- 付款日期 YYYYMMDD
  tk.TK004 AS supplier_code,   -- 应付对象编号
  tk.TK020 AS approve_status,  -- 审核码 Y/N/V
  tk.TK031 AS local_amount     -- 本币实付金额
FROM dbo.ACPTK tk;
GO

GRANT SELECT ON dbo.vw_ai_payment TO PUBLIC;
GO