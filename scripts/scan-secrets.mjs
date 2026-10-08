#!/usr/bin/env node
/**
 * scan-secrets.mjs — 提交前敏感信息门禁
 *
 * 目的：防止 token / 账套名 / 内网 IP / 云端密钥被误提交。
 * 用法：
 *   node scripts/scan-secrets.mjs            # 扫描已跟踪文件（提交前门禁）
 *   node scripts/scan-secrets.mjs --staged   # 只扫暂存区
 *
 * 退出码：0=通过  1=发现疑似敏感信息
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STAGED = process.argv.includes('--staged');

/** 规则表：每条含名称、正则、说明 */
const RULES = [
  {
    name: '内网 IP',
    re: /\b(?:172\.16|192\.168|10)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    desc: '内网地址（易飞测试环境 / 客户账套地址）',
  },
  {
    name: '公网 IP',
    re: /\b(?:8\.138|47\.95)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    desc: '公网服务地址（license-server / 公网测试环境）',
  },
  {
    name: 'digi-user-token',
    re: /\b[0-9A-F]{48}\b/g,
    desc: '易飞 digi-user-token 形态（48 位大写 HEX）',
  },
  {
    name: '账套名 CompanyId',
    re: /\bSDDEMO\d{2,3}\b|\bDEMO9[0-9]\b/g,
    desc: '易飞账套编号（客户标识）',
  },
  {
    name: 'RSA 私钥',
    re: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g,
    desc: '私钥，严禁入库',
  },
  {
    name: 'Bearer 令牌',
    re: /Bearer\s+[A-Za-z0-9._-]{30,}/g,
    desc: 'HTTP Bearer 令牌',
  },
  {
    name: 'password 明文键',
    re: /"(?:password|pwd|passwd|secret|api_?key|token)"\s*:\s*"[^"{$][^"]{3,}"/gi,
    desc: '配置文件中的明文凭据',
  },
];

/** 白名单：这些文件天然包含示例 IP/token 占位，不报警 */
const WHITELIST = new Set([
  'scripts/scan-secrets.mjs', // 规则自身
  '.gitignore',
]);

function listFiles() {
  let out = '';
  if (STAGED) {
    out = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT, encoding: 'utf-8' });
  } else {
    out = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf-8' });
  }
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => !WHITELIST.has(f.replace(/\\/g, '/')))
    .filter((f) => {
      const abs = path.join(ROOT, f);
      try {
        return fs.statSync(abs).isFile() && fs.statSync(abs).size < 8 * 1024 * 1024;
      } catch {
        return false;
      }
    });
}

const files = listFiles();
console.log(`[scan-secrets] 扫描 ${files.length} 个文件（模式：${STAGED ? '暂存区' : '工作区未忽略文件'}）`);

let findings = 0;
for (const f of files) {
  const abs = path.join(ROOT, f);
  let text;
  try {
    text = fs.readFileSync(abs, 'utf-8');
  } catch {
    continue;
  }
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    const hits = [...new Set(text.match(rule.re) ?? [])];
    if (hits.length) {
      findings += hits.length;
      console.error(`\n❌ ${f}`);
      console.error(`   规则：${rule.name} —— ${rule.desc}`);
      for (const h of hits.slice(0, 5)) {
        // 只显示首尾各 4 字符，避免回显完整凭证
        const masked = h.length <= 10 ? h : `${h.slice(0, 4)}…${h.slice(-4)}`;
        console.error(`   命中：${masked}${h.length > 10 ? ` (长度 ${h.length})` : ''}`);
      }
      if (hits.length > 5) console.error(`   …另有 ${hits.length - 5} 处`);
    }
  }
}

if (findings) {
  console.error(`\n[FAIL] 发现 ${findings} 处疑似敏感信息，禁止提交。`);
  console.error('处理方式：① 值本身无问题→ 在文件顶部加白名单注释并说明理由；');
  console.error('         ② 确为敏感→ 用占位符替换（如 {IP} / {用户令牌} / {CompanyId}）。');
  process.exit(1);
}

console.log('[PASS] 未发现敏感信息。');
