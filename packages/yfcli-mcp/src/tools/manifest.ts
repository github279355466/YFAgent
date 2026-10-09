/**
 * yf_manifest —— 返回 106 个业务对象清单。
 *
 * 数据源：knowledge/typekey/typekey_map.yaml（由脚本机械抽取，禁止手编）。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

interface ManifestEntry {
  type_key: string;
  label: string;
  operations: string[];
  primary_keys: string[];
}

async function handleManifest(
  _params: Record<string, unknown>,
  context: ToolContext,
): Promise<unknown> {
  // TypeKeyCatalog 内部持有 entries map，但没有 list 方法
  // 需要从 YAML 重新读取（或者在 catalog 上扩展）
  // 这里用 catalog 的 findEntry 来遍历不太方便，直接读 YAML
  const { readFile } = await import('node:fs/promises');
  const { parse } = await import('yaml');
  const path = await import('node:path');

  const candidates = [
    path.resolve(process.cwd(), 'knowledge', 'typekey', 'typekey_map.yaml'),
    path.resolve(process.cwd(), '..', '..', 'knowledge', 'typekey', 'typekey_map.yaml'),
  ];

  let yamlText: string | undefined;
  for (const candidate of candidates) {
    try {
      yamlText = await readFile(candidate, 'utf-8');
      break;
    } catch {
      // try next
    }
  }

  if (!yamlText) {
    return { error: '找不到 typekey_map.yaml' };
  }

  const raw = parse(yamlText) as { typekeys?: Array<Record<string, unknown>> };
  const typekeys = raw.typekeys ?? [];

  const entries: ManifestEntry[] = [];
  for (const item of typekeys) {
    const typeKey = String(item['type_key'] ?? '');
    if (!typeKey) continue;

    const services = item['services'] as Record<string, unknown> | undefined;
    const operations: string[] = [];
    if (services) {
      for (const key of Object.keys(services)) {
        // services 的 key 格式如 "query.get" / "read.get" / "data.create"
        const op = key.split('.')[0];
        if (op && !operations.includes(op)) {
          operations.push(op);
        }
      }
    }

    const primaryKey = item['primary_key'];
    const primaryKeys: string[] = Array.isArray(primaryKey)
      ? primaryKey.map(String)
      : typeof primaryKey === 'string'
        ? [primaryKey]
        : [];

    entries.push({
      type_key: typeKey,
      label: String(item['title'] ?? typeKey),
      operations,
      primary_keys: primaryKeys,
    });
  }

  return {
    total: entries.length,
    objects: entries,
  };
}

export const manifestTool: ToolDefinition = {
  name: 'yf_manifest',
  description:
    '列出易飞 ERP 全部 106 个业务对象清单，包含 type_key、中文标签、支持的操作和主键字段。' +
    '用于发现可用的业务对象。',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: handleManifest,
};
