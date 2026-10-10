/**
 * 路由表加载器 — 从 _routes.yaml 加载助手路由表，启动时读一次缓存。
 * service-route.ts 和 analysis-prompt.ts 共享此加载器。
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export interface AssistantRoute {
  id: string;
  name: string;
  keywords: string[];
  exclude: string[];
  service: string;
  status?: string;
  note?: string;
}

let cachedRoutes: AssistantRoute[] | null = null;

export async function loadRoutes(): Promise<AssistantRoute[]> {
  if (cachedRoutes) return cachedRoutes;

  const candidates = [
    // 从 dist/tools/ 向上找 yfcli-sdk/src/data
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'yfcli-sdk', 'src', 'data', '_routes.yaml'),
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'yfcli-sdk', 'dist', 'data', '_routes.yaml'),
    // 从项目根找
    resolve(process.cwd(), 'packages', 'yfcli-sdk', 'src', 'data', '_routes.yaml'),
    resolve(process.cwd(), 'data', '_routes.yaml'),
  ];

  for (const p of candidates) {
    try {
      const content = readFileSync(p, 'utf8');
      const parsed = parseYaml(content) as { assistants?: AssistantRoute[] };
      cachedRoutes = parsed.assistants ?? [];
      console.error(`[route-loader] Loaded ${cachedRoutes.length} routes from ${p}`);
      return cachedRoutes;
    } catch {
      /* try next */
    }
  }

  console.error('[route-loader] WARNING: No _routes.yaml found, using empty route table');
  cachedRoutes = [];
  return cachedRoutes;
}

/** 同步版本（已缓存后使用） */
export function getRoutes(): AssistantRoute[] {
  return cachedRoutes ?? [];
}