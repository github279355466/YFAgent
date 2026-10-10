/**
 * yf_skill_version —— 返回当前 skill 版本号。
 */

import type { ToolDefinition } from '../registry.js';
import type { ToolContext } from '../session.js';

async function handleSkillVersion(
  _params: Record<string, unknown>,
  _context: ToolContext,
): Promise<unknown> {
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const { homedir } = await import('node:os');

    const candidates = [
      path.join(homedir(), '.codex', 'skills', 'yzcli-erp', 'SKILL.md'),
      path.join(homedir(), '.workbuddy', 'skills', 'yzcli-erp', 'SKILL.md'),
      path.join(homedir(), '.claude', 'skills', 'yzcli-erp', 'SKILL.md'),
    ];

    for (const candidate of candidates) {
      try {
        const content = await readFile(candidate, 'utf-8');
        const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
        if (!normalized.startsWith('---')) continue;
        const end = normalized.indexOf('\n---', 3);
        if (end < 0) continue;
        const frontmatter = normalized.slice(3, end);
        const match = frontmatter.match(/^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m);
        if (match?.[1]) {
          return { version: match[1] };
        }
      } catch {
        // try next
      }
    }

    return { version: 'unknown' };
  } catch {
    return { version: 'unknown' };
  }
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
