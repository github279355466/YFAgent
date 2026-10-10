/**
 * yf_analysis_meta —— 查询语义视图（LLM 面向的元数据）。
 *
 * list=true 返回所有数据源索引。
 * type_key 返回单个数据源的语义字段视图。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface AnalysisMetaParams {
  type_key?: string;
  list?: boolean;
}

async function handleAnalysisMeta(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as AnalysisMetaParams;

  if (typed.list || !typed.type_key) {
    // 返回所有 type_key 列表
    const typeKeys = context.catalog.listTypeKeys();
    return {
      data_source_count: typeKeys.length,
      sources: typeKeys.map((tk) => {
        const entry = context.catalog.findEntry(tk);
        return {
          type_key: tk,
          label: entry?.title ?? tk,
        };
      }),
      hint: "传入 type_key 获取单源字段视图，如 { type_key: 'sales.order' }",
    };
  }

  // 单源视图：从 catalog 获取信息
  const entry = context.catalog.findEntry(typed.type_key);
  if (!entry) {
    return {
      error: `Unknown type_key: '${typed.type_key}'`,
      hint: 'Use list:true to see all available data sources',
    };
  }

  return {
    type_key: entry.typeKey,
    label: entry.title,
    primary_keys: entry.primaryKey,
    detail_nodes: entry.detailNodes,
    services: entry.services,
  };
}

export const analysisMetaTool: ToolDefinition = {
  name: 'yf_analysis_meta',
  description:
    'Query the semantic view of an ERP data source (LLM-facing metadata).\n' +
    'Returns logical field names + Chinese labels ONLY.\n' +
    'list -> { list: true } -> all data sources index\n' +
    'single -> { type_key: "sales.order" } -> semantic field view',
  inputSchema: {
    type: 'object',
    properties: {
      type_key: {
        type: 'string',
        description: "data source type_key, e.g. 'sales.order'",
      },
      list: {
        type: 'boolean',
        description: 'list all data sources as a compact index (type_key + label)',
      },
    },
  },
  handler: handleAnalysisMeta,
};
