-- vw_ai_collection：收款金额视图
-- 物理表映射：ACRTK（收款单头档）
-- 字段：TK001 单别 / TK002 单号 / TK003 日期 / TK004 客户 / TK033 本币实收金额 / TK020 审核码
-- 不带 COMPANY 过滤

CREATE VIEW dbo.vw_ai_collection AS
SELECT
  tk.TK001 AS doc_type,        -- 收款单别
  tk.TK002 AS doc_no,          -- 收款单号
  tk.TK003 AS doc_date,        -- 收款日期 YYYYMMDD
  tk.TK004 AS customer_code,   -- 客户编号
  tk.TK020 AS approve_status,  -- 审核码 Y/N/V
  tk.TK033 AS local_amount     -- 本币实收金额
FROM dbo.ACRTK tk;
GO

GRANT SELECT ON dbo.vw_ai_collection TO PUBLIC;
GO