-- vw_ai_sales_margin：销货毛利视图
-- 物理表映射：COPTG（销货单头）× COPTH（销货单身）× INVLA（交易明细/出库成本）× CMSMQ（单据性质）
-- 口径：收入 = COPTG.TG045 本币销货金额；成本 = INVLA.LA013 出库成本金额
-- 关联路径：INVLA.LA006(单别) → CMSMQ.MQ001, CMSMQ.MQ003='23'(销货单)
--           INVLA.LA007(单号) → COPTG.TG002, INVLA.LA001(品号) → COPTH.TH004
-- 审核码：COPTG.TG023 (Y/N/V)
-- ⚠ DBA 确认项：LA005=-1 是否覆盖所有销货出库场景（交易别 LA014=2 可能更精确）
-- 不带 COMPANY 过滤；审核码只筛 Y（已审核，V=作废）

CREATE VIEW dbo.vw_ai_sales_margin AS
SELECT
  g.TG001 AS doc_type,         -- 销货单别
  g.TG002 AS doc_no,           -- 销货单号
  g.TG003 AS doc_date,         -- 销货日期 YYYYMMDD
  g.TG004 AS customer_code,    -- 客户编号
  g.TG023 AS approve_status,   -- 审核码 Y/N/V
  g.TG045 AS revenue,          -- 本币销货金额
  c.cost AS cost,              -- 销货成本（INVLA 出库异动）
  CASE WHEN c.cost IS NULL THEN 0 ELSE 1 END AS cost_covered
FROM dbo.COPTG g
JOIN dbo.COPTH h ON h.TH001 = g.TG001 AND h.TH002 = g.TG002
OUTER APPLY (
  SELECT SUM(la.LA013) AS cost
  FROM dbo.INVLA la
  JOIN dbo.CMSMQ mq ON mq.MQ001 = la.LA006
  WHERE mq.MQ003 = '23'
    AND la.LA006 = g.TG001
    AND la.LA007 = g.TG002
    AND la.LA001 = h.TH004
    AND la.LA005 = -1
) c;
GO

GRANT SELECT ON dbo.vw_ai_sales_margin TO PUBLIC;
GO
