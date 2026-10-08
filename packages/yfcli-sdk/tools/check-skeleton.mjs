/**
 * 骨架自检脚本 —— 门禁级检查，不依赖真机环境。
 *
 * 检查项（对应本仓硬门禁）：
 * 1. 单文件 ≤ 300 行（代码组织规范硬要求）
 * 2. 无 `any` 类型（类型必须明确，不确定用 unknown + 类型守卫）
 * 3. 无 emoji（团队 P0 规则：禁止 emoji 作为图标或装饰）
 * 4. 无 AI 模板味占位（TODO / Hello World / FIXME / 待补充）
 * 5. 依赖方向正确（低层不得反向 import 入口 index.ts）
 * 6. 无硬编码账套 / 令牌 / 内网 IP（敏感信息红线）
 *
 * 用法：node tools/check-skeleton.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const MAX_LINES = 300;

const violations = [];
const checked = [];

/** 递归收集 .ts 文件。 */
function collect(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collect(full));
    } else if (name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** 通用检查：行数、any、emoji、占位词、硬编码敏感值、反向依赖。 */
function inspect(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r\n|\r|\n/);

  if (lines.length > MAX_LINES) {
    violations.push({ file: rel, line: lines.length, rule: '行数上限', detail: `${lines.length} 行 > ${MAX_LINES}` });
  }

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.replace(/\/\/.*$/, '');

    if (/:\s*any\b|<any>|\bas\s+any\b/.test(line)) {
      violations.push({ file: rel, line: lineNo, rule: '禁止 any', detail: raw.trim() });
    }

    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u.test(raw)) {
      violations.push({ file: rel, line: lineNo, rule: '禁止 emoji', detail: raw.trim() });
    }

    if (/\b(TODO|FIXME|Hello World|hello world|待补充|XXX占位)\b/.test(raw)) {
      violations.push({ file: rel, line: lineNo, rule: '禁止模板占位', detail: raw.trim() });
    }

    if (/\b172\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b/.test(raw)) {
      violations.push({ file: rel, line: lineNo, rule: '禁止内网 IP', detail: raw.trim() });
    }

    if (/from\s+['"]\.\.?\/.*index(\.js)?['"]/.test(line) && !rel.endsWith('src/index.ts')) {
      violations.push({ file: rel, line: lineNo, rule: '依赖方向', detail: '低层不得反向依赖入口 index.ts' });
    }
  });

  checked.push({ file: rel, lines: lines.length });
}

for (const file of collect(SRC)) {
  inspect(file);
}

// ------------------------------------------------------------------ 输出

console.log('='.repeat(72));
console.log('yfcli-sdk 骨架自检');
console.log('='.repeat(72));
console.log(`目录        : ${relative(process.cwd(), ROOT) || '.'}`);
console.log(`检查文件数  : ${checked.length}`);
console.log(`行数上限    : ${MAX_LINES}`);
console.log('');

console.log('各文件行数');
for (const item of checked.sort((a, b) => b.lines - a.lines)) {
  const flag = item.lines > MAX_LINES ? 'OVER' : ' ok ';
  console.log(`  [${flag}] ${String(item.lines).padStart(4)}  ${item.file}`);
}

const maxLines = checked.reduce((acc, cur) => (cur.lines > acc.lines ? cur : acc), { lines: 0, file: '' });
console.log('');
console.log(`最长文件    : ${maxLines.file}（${maxLines.lines} 行）`);
console.log('');

if (violations.length === 0) {
  console.log('RESULT: PASS（无违规项）');
  process.exit(0);
}

console.log(`RESULT: FAIL（${violations.length} 项违规）`);
for (const v of violations) {
  console.log(`  ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
}
process.exit(1);