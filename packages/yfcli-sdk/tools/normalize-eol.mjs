/**
 * 行尾与编码规范化 —— 统一为 UTF-8 无 BOM + CRLF。
 *
 * 依据 .gitattributes：仓库入库文件用 CRLF（Windows 开发环境）。
 * 本脚本幂等，可重复执行。
 *
 * 用法：node tools/normalize-eol.mjs [--check]
 *   无参数：就地改写
 *   --check：只报告不改写，供 CI 使用（有不合规文件时退出码1）
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_DIRS = ['src', 'tools'];
const EXTENSIONS = ['.ts', '.mjs', '.json', '.md'];

const checkOnly = process.argv.includes('--check');
/**
 * UTF-8 BOM 的**字节序列**（EF BB BF），而非码位。
 *
 * 注意：不可写成 `Buffer.from([0xfeff])` —— 单元素数组会被截断为 1 字节 0xff，
 * 产生错误标记。也不可用 `buf[0] === 0xfeff` 做比较 —— Buffer 索引返回单字节，
 * 永远不等于 0xfeff。故统一用字节序列比较。
 */
const BOM_BYTES = Buffer.from([0xef, 0xbb, 0xbf]);

/** 文件是否带 UTF-8 BOM。 */
function hasBom(buffer) {
  return buffer.length >= 3 && buffer.subarray(0, 3).equals(BOM_BYTES);
}

function collect(dir) {
  const out = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...collect(full));
    } else if (EXTENSIONS.some((ext) => name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

// 打包产物目录：若存在则一并纳入校验（build 产物同样要归一化）
const outDirs = ['dist', 'templates'].flatMap((dir) => collect(join(ROOT, dir)));

const files = [
  ...TARGET_DIRS.flatMap((dir) => collect(join(ROOT, dir))),
  ...outDirs,
  join(ROOT, 'package.json'),
  join(ROOT, 'tsconfig.json'),
  join(ROOT, 'README.md'),
];

const fixed = [];
const alreadyOk = [];

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const buffer = readFileSync(file);

  // 去 BOM（按字节判定，见 BOM_BYTES 注释）
  let text = buffer.toString('utf8');
  const hadBom = hasBom(buffer);
  if (hadBom) text = text.slice(1);

  // 统一 CRLF（先归一化再转换，避免重复）
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const crlf = normalized.replace(/\n/g, '\r\n');

  if (!hadBom && crlf === text) {
    alreadyOk.push(rel);
    continue;
  }

  fixed.push(rel);
  if (!checkOnly) {
    writeFileSync(file, Buffer.from(crlf, 'utf8'));
  }
}

/**
 * 自检：构造一个 BOM + LF 混合的脏文件，验证本脚本能识别并修正。
 *
 * 目的：门禁本身必须有被验证过的「失败路径」。
 * 若脚本对脏文件静默通过，它就成了摆设。
 * 自检在系统临时目录中进行，不触碰真实产物。
 */
function selfTest() {
  const os = process.getBuiltinModule('node:os');
  const tmpRoot = mkdtempSync(join(os.tmpdir(), 'yf-eol-selftest-'));
  const target = join(tmpRoot, 'dirty.ts');

  // 故意制造：UTF-8 BOM + 混合行尾（首行 CRLF，其余 LF）
  writeFileSync(
    target,
    Buffer.concat([
      BOM_BYTES,
      Buffer.from('const a = 1;\r\nconst b = 2;\nconst c = 3;\n', 'utf8'),
    ]),
  );

  const raw = readFileSync(target);
  const bomDetected = hasBom(raw);
  const crlfBefore = (raw.toString('utf8').match(/\r\n/g) ?? []).length;

  // 复用主流程的转换逻辑
  let text = raw.toString('utf8');
  if (hasBom(raw)) text = text.slice(1);
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  writeFileSync(target, Buffer.from(normalized.replace(/\n/g, '\r\n'), 'utf8'));

  const after = readFileSync(target);
  const afterText = after.toString('utf8');
  const bomAfter = hasBom(after);
  const crlfAfter = (afterText.match(/\r\n/g) ?? []).length;
  const lineFeedTotal = (afterText.match(/\n/g) ?? []).length;

  rmSync(tmpRoot, { recursive: true, force: true });

  return {
    bomDetected,
    bomAfter,
    crlfBefore,
    crlfAfter,
    lineFeedTotal,
    pass:
      bomDetected === true &&
      bomAfter === false &&
      crlfAfter === 3 &&
      crlfAfter === lineFeedTotal,
  };
}

const self = selfTest();

console.log('='.repeat(60));
console.log('行尾与编码规范化');
console.log('='.repeat(60));
console.log('自检（构造 BOM + 混合行尾脏文件）');
console.log(
  `  检出 BOM=${self.bomDetected}  修正后 BOM=${self.bomAfter}  ` +
    `CRLF 数 ${self.crlfBefore} -> ${self.crlfAfter}（总行 ${self.lineFeedTotal}）`,
);
console.log(`  自检结果  : ${self.pass ? 'PASS' : 'FAIL'}`);
console.log('');
console.log(`目标编码    : UTF-8 无 BOM + CRLF`);
console.log(`检查文件    : ${files.length}`);
console.log(`已合规      : ${alreadyOk.length}`);
console.log(`需处理      : ${fixed.length}`);

if (fixed.length > 0) {
  console.log('');
  for (const rel of fixed) console.log(`  ${checkOnly ? '需处理' : '已修正'}  ${rel}`);
}

console.log('');
if (self.pass && fixed.length === 0) {
  console.log('RESULT: PASS');
  process.exit(0);
}
if (checkOnly) {
  console.log('RESULT: FAIL（存在不合规文件或自检未通过）');
  process.exit(1);
}
console.log('RESULT: 已修正');
process.exit(0);