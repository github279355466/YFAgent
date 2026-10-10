-- vw_ai_ar_balance：应收账款余额视图
-- 物理表映射：ACRLB（应收账款异动明细档）
-- 字段：LB005 客户编号 / LB004 交易日期 / LB011 方向(1=借/-1=贷) / LB014 本币金额 / LB016 本币已核销金额
-- 不带 COMPANY 过滤

IF OBJECT_ID('dbo.vw_ai_ar_balance', 'V') IS NOT NULL DROP VIEW dbo.vw_ai_ar_balance;
GO

CREATE VIEW dbo.vw_ai_ar_balance AS
SELECT
  lb.LB005 AS customer_code,   -- 客户编号
  lb.LB004 AS doc_date,        -- 交易日期 YYYYMMDD
  lb.LB011 AS direction,       -- 1=借方(增项) / -1=贷方(减项)
  lb.LB014 AS local_amount,    -- 本币金额
  lb.LB016 AS writeoff_amount  -- 本币已核销金额
FROM dbo.ACRLB lb;
GO

-- ⚠ 授权主体由客户 DBA 按环境指定，**默认不授权给 PUBLIC**。
--    分析层只读账号（本项目实测环境为 `ai`）建成后，取消下一行注释并执行：
-- GRANT SELECT ON dbo.vw_ai_ar_balance TO ai;
GO