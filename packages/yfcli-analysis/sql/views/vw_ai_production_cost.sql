-- vw_ai_production_cost：生产成本视图
-- 物理表映射：MOCTG（生产入库单身档）× INVLA（交易明细信息档）
-- 关联路径：MOCTG.TG001(入库单别)+TG002(入库单号)+TG003(序号) → INVLA.LA006(单别)+LA007(单号)+LA008(序号)
-- 成本字段：INVLA.LA017(材料) + LA018(人工) + LA019(制费) + LA020(加工)
-- 工单关联：MOCTG.TG014(工单单别) + TG015(工单单号)
-- 审核码：MOCTG.TG022 (Y/N/V)
-- 不带 COMPANY 过滤

IF OBJECT_ID('dbo.vw_ai_production_cost', 'V') IS NOT NULL DROP VIEW dbo.vw_ai_production_cost;
GO

CREATE VIEW dbo.vw_ai_production_cost AS
SELECT
  tg.TG014 AS wo_doc_type,     -- 工单单别
  tg.TG015 AS wo_doc_no,       -- 工单单号
  tg.TG001 AS receipt_doc_type,-- 入库单别
  tg.TG002 AS receipt_doc_no,  -- 入库单号
  tg.TG003 AS seq_no,          -- 序号
  tg.TG004 AS product_no,      -- 产品品号
  tg.TG011 AS inbound_qty,     -- 入库数量
  tg.TG022 AS approve_status,  -- 审核码 Y/N/V
  ISNULL(la.LA017, 0) AS material_cost,   -- 材料成本
  ISNULL(la.LA018, 0) AS labor_cost,      -- 人工成本
  ISNULL(la.LA019, 0) AS overhead_cost,   -- 制造费用
  ISNULL(la.LA020, 0) AS outsourcing_cost,-- 委外/加工成本
  ISNULL(la.LA017, 0) + ISNULL(la.LA018, 0) + ISNULL(la.LA019, 0) + ISNULL(la.LA020, 0) AS total_cost
FROM dbo.MOCTG tg
LEFT JOIN dbo.INVLA la ON la.LA006 = tg.TG001 AND la.LA007 = tg.TG002 AND la.LA008 = tg.TG003;
GO

-- ⚠ 授权主体由客户 DBA 按环境指定，**默认不授权给 PUBLIC**。
--    分析层只读账号（本项目实测环境为 `ai`）建成后，取消下一行注释并执行：
-- GRANT SELECT ON dbo.vw_ai_production_cost TO ai;
GO
