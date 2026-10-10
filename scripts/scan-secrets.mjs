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

/**
 * 命中值的掩码化：只保留首尾各 4 字符，避免日志/CI 输出回显完整凭证。
 * 短值（<=10）直接返回，因为本身不足以构成可用的凭据。
 * @param {string} h 命中的原始文本
 * @returns {string}
 */
export function maskHit(h) {
  return h.length <= 10 ? h : `${h.slice(0, 4)}…${h.slice(-4)}`;
}

/**
 * 规则表：每条含名称、正则、说明。
 * 导出供 __tests__ 做规则级回归（门禁脚本自身也必须有测试守护）。
 */
export const RULES = [
  {
    name: '内网 IP',
    // ⚠️ 段数必须按前缀补齐：`10` 占 1 段 → 再补 3 段；`172.16` / `192.168` 占 2 段 → 再补 2 段。
    // 历史缺陷：原写法统一补 3 段，导致 `192.168.x.x` 与 `172.16.x.x` 这两种最常见的
    // 内网形态**完全不被检测**（只有 4 段的 10.x 能命中）。已由 __tests__ 锁定。
    re: /\b(?:(?:172\.16|192\.168)(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3})\b/g,
    desc: '内网地址（易飞测试环境 / 客户账套地址）',
  },
  {
    name: '公网 IP',
    // 同「内网 IP」：前缀占 2 段（8.138 / 47.95），故只再补 2 段。
    // 历史缺陷同上 —— 原写法补 3 段，导致已登记的 license-server 地址不被检测。
    re: /\b(?:8\.138|47\.95)(?:\.\d{1,3}){2}\b/g,
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

/**
 * 白名单（按文件）：这些文件天然包含示例 IP/token 占位，不报警。
 * 优先用「值级豁免」而非「文件级豁免」，见 EXEMPT_VALUES。
 */
const WHITELIST = new Set([
  'scripts/scan-secrets.mjs', // 规则自身
  '.gitignore',
]);

/**
 * 值级豁免：文档/类型注释里的**通用示例地址**，不指向任何真实环境。
 *
 * 与「真实内网地址」的区别是判断准则：示例地址用网段内最小可辨识值
 * （`192.168.1.100` / `10.0.0.1`），真实环境地址带具体子网与主机位
 * （如 `172.16.2.86`）。后者**必须**改为 `{内网IP}` 占位符，不得豁免。
 *
 * 采用值级而非文件级豁免，是为了让「同一文件里的其他真实地址」仍会被拦下。
 */
const EXEMPT_VALUES = new Set([
  '192.168.1.100', // 类型注释与测试夹具的惯例示例（如 `http://192.168.1.100`）
]);

/**
 * 列出待扫描文件。
 * @param {boolean} [staged] true=只扫暂存区；缺省取进程参数 --staged
 * @returns {string[]} 相对仓库根的文件路径
 */
function listFiles(staged = STAGED) {
  let out = '';
  if (staged) {
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

/**
 * 执行一次全仓扫描。
 *
 * 抽成函数（而非顶层直跑）有两个目的：
 *   1. 被 __tests__ import 时不产生副作用（否则测试进程会被 process.exit 干掉）
 *   2. 便于断言「扫描器本身能发现注入的样例」，而不是只测规则正则
 *
 * @param {{ staged?: boolean }} [opts] staged=true 时只扫暂存区
 * @returns {{ scanned: number, findings: number, hits: Array<{file:string,rule:string,masked:string}> }}
 */
export function scanAll(opts = {}) {
  const staged = opts.staged ?? STAGED;
  const files = listFiles(staged);
  const hits = [];

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
      const found = [...new Set(text.match(rule.re) ?? [])].filter(
        (h) => !EXEMPT_VALUES.has(h),
      );
      if (found.length) {
        console.log(`[scan-secrets] ❌ ${f}`);
        console.log(`   规则：${rule.name} —— ${rule.desc}`);
        for (const h of found) {
          const masked = maskHit(h);
          hits.push({ file: f, rule: rule.name, masked });
          console.log(`   命中：${masked}${h.length > 10 ? ` (长度 ${h.length})` : ''}`);
        }
      }
    }
  }

  return { scanned: files.length, findings: hits.length, hits };
}

/** CLI 入口：编排输出与退出码 */
function runCli() {
  const { scanned, findings } = scanAll();
  console.log(`[scan-secrets] 扫描 ${scanned} 个文件（模式：${STAGED ? '暂存区' : '工作区未忽略文件'}）`);

  if (findings) {
    console.error(`\n[FAIL] 发现 ${findings} 处疑似敏感信息，禁止提交。`);
    console.error('处理方式：① 值本身无问题→ 在文件顶部加白名单注释并说明理由；');
    console.error('         ② 确为敏感→ 用占位符替换（如 {IP} / {用户令牌} / {CompanyId}）。');
    process.exit(1);
  }

  console.log('[PASS] 未发现敏感信息。');
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runCli();
}