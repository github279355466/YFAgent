-- vw_ai_ap_balance：应付账款余额视图
-- 物理表映射：ACPLB（应付账款异动明细档）
-- 字段：LB005 应付对象编号 / LB004 交易日期 / LB011 方向(-1=借/1=贷) / LB014 本币金额 / LB016 本币已核销金额
-- ⚠ 注意：应付方向与应收相反（-1=借方减项，1=贷方增项）
-- 不带 COMPANY 过滤

CREATE VIEW dbo.vw_ai_ap_balance AS
SELECT
  lb.LB005 AS supplier_code,   -- 应付对象编号
  lb.LB004 AS doc_date,        -- 交易日期 YYYYMMDD
  lb.LB011 AS direction,       -- -1=借方(减项) / 1=贷方(增项)
  lb.LB014 AS local_amount,    -- 本币金额
  lb.LB016 AS writeoff_amount  -- 本币已核销金额
FROM dbo.ACPLB lb;
GO

GRANT SELECT ON dbo.vw_ai_ap_balance TO PUBLIC;
GO