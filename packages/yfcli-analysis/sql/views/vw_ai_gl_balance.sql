-- vw_ai_gl_balance：科目余额视图
-- 物理表映射：ACTLE（会计科目余额档）
-- 字段：LE001 会计科目 / LE002 会计年度 / LE003 期间 / LE014 借方本币 / LE017 贷方本币
-- 不带 COMPANY 过滤

CREATE VIEW dbo.vw_ai_gl_balance AS
SELECT
  le.LE001 AS account_code,    -- 会计科目
  le.LE002 AS fiscal_year,     -- 会计年度
  le.LE003 AS fiscal_period,   -- 期间
  le.LE014 AS debit_amount,    -- 借方本币
  le.LE017 AS credit_amount    -- 贷方本币
FROM dbo.ACTLE le;
GO

GRANT SELECT ON dbo.vw_ai_gl_balance TO PUBLIC;
GO