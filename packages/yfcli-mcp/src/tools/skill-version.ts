/**
 * yf_skill_version —— 返回当前 skill 版本号。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function findSkillVersion(): string {
  // 从多个候选位置查找 SKILL.md
  const candidates = [
    // 相对于当前文件（dist/tools/ 或 src/tools/）向上找 packages/yfcli-skill-openapi/SKILL.md
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'yfcli-skill-openapi', 'SKILL.md'),
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'yfcli-skill-openapi', 'SKILL.md'),
    // 项目根目录
    resolve(process.cwd(), 'packages', 'yfcli-skill-openapi', 'SKILL.md'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const content = readFileSync(candidate, 'utf8');
      const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
      if (!normalized.startsWith('---')) continue;
      const end = normalized.indexOf('\n---', 3);
      if (end < 0) continue;
      const frontmatter = normalized.slice(3, end);
      const match = frontmatter.match(/^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m);
      if (match?.[1]) return match[1];
    } catch { /* try next */ }
  }
  return 'unknown';
}

async function handleSkillVersion(
  _params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  return { version: findSkillVersion() };
}

export const skillVersionTool: ToolDefinition = {
  name: 'yf_skill_version',
  description:
    'Check the current skill version. Returns { version: string }. ' +
    'Use this to verify the skill is up to date.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: handleSkillVersion,
};
