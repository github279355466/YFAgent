/**
 * yf_help —— 返回指定业务对象的字段说明。
 *
 * 数据源：knowledge/typekey-mapping/<type_key>.md
 * 这些文件由脚本从 OpenAPI.json 机械抽取，包含字段名、类型、主键等信息。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface HelpParams {
  type_key: string;
}

async function handleHelp(
  params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  const typed = params as unknown as HelpParams;

  if (!typed.type_key) {
    return { error: '缺少必填参数 type_key' };
  }

  // 将 type_key 中的点替换为点（文件名用点分隔）
  // 例如 sales.order -> sales.order.md
  const fileName = `${typed.type_key}.md`;

  const { readFile } = await import('node:fs/promises');
  const path = await import('node:path');

  const candidates = [
    path.resolve(process.cwd(), 'knowledge', 'typekey-mapping', fileName),
    path.resolve(process.cwd(), '..', '..', 'knowledge', 'typekey-mapping', fileName),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, 'utf-8');
      return {
        type_key: typed.type_key,
        documentation: content,
      };
    } catch {
      // try next
    }
  }

  return {
    error: `找不到 ${typed.type_key} 的字段说明文档`,
    hint: '运行 npm run gen:fields 生成字段对照表，或使用 yf_manifest 查看可用对象列表',
  };
}

export const helpTool: ToolDefinition = {
  name: 'yf_help',
  description:
    '获取指定易飞 ERP 业务对象的字段说明文档，包含字段名、类型、主键构成、可写性等信息。' +
    '在构造查询条件或写入数据前，建议先用此工具了解对象结构。',
  inputSchema: {
    type: 'object',
    properties: {
      type_key: {
        type: 'string',
        description: '业务对象标识，如 supplier / customer / sales.order',
      },
    },
    required: ['type_key'],
  },
  handler: handleHelp,
};
