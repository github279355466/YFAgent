/**
 * scan-secrets.mjs 规则级回归测试
 *
 * 背景（2026-10-09 门禁重构）：门禁脚本此前**零测试覆盖**，
 * 导致「门禁悄悄失效」无人发现（例如行尾门禁误报 16 个合规文件、
 * 域归属解析器静默解析出 0 个对象）。
 *
 * ⚠️ 本文件自身会被 scan-secrets 扫描，因此**不得写入任何字面量样本**：
 *    所有测试用值都由片段拼接生成，避免「测试文件把规则样本变成新的命中源」。
 */
import { describe, it, expect } from 'vitest';
import { RULES, maskHit, scanAll } from '../scan-secrets.mjs';

/** 按名称取规则 */
const rule = (name) => {
  const r = RULES.find((x) => x.name === name);
  if (!r) throw new Error(`规则不存在：${name}`);
  return r;
};

/** 用某条规则扫描文本，返回去重命中列表 */
const scan = (name, text) => [...new Set(text.match(rule(name).re) ?? [])];

// ── 样本一律拼接生成，避免本文件成为命中源 ──────────────────────────
const IP_192 = ['192', '168', '1', '10'].join('.');
const IP_10 = ['10', '20', '30', '40'].join('.');
const IP_172 = ['172', '16', '0', '5'].join('.');
const IP_PUB_A = ['8', '138', '1', '2'].join('.');
const IP_PUB_B = ['47', '95', '3', '4'].join('.');
const TOKEN48 = 'A'.repeat(48);
const TOKEN47 = 'A'.repeat(47);
const COMPANY = 'SD' + 'DEMO' + '93';
const COMPANY_SHORT = 'DEMO' + '93';
const PK_HEADER = ['-----BEGIN', 'RSA', 'PRIVATE', 'KEY-----'].join(' ');
const PUB_HEADER = ['-----BEGIN', 'PUBLIC', 'KEY-----'].join(' ');
const PW_KEY = 'pass' + 'word';

describe('规则表完整性', () => {
  it('应有 7 条规则，且每条含 name / re / desc', () => {
    expect(RULES).toHaveLength(7);
    for (const r of RULES) {
      expect(r.name).toBeTruthy();
      expect(r.re).toBeInstanceOf(RegExp);
      expect(r.desc).toBeTruthy();
    }
  });
});

describe('规则 1：内网 IP', () => {
  it('命中 192.168 / 10.x / 172.16', () => {
    expect(scan('内网 IP', `host=${IP_192}`)).toHaveLength(1);
    expect(scan('内网 IP', `host=${IP_10}`)).toHaveLength(1);
    expect(scan('内网 IP', `host=${IP_172}`)).toHaveLength(1);
  });

  it('不误伤普通版本号', () => {
    expect(scan('内网 IP', 'version 1.2.3.4.5')).toHaveLength(0);
  });
});

describe('规则 2：公网 IP', () => {
  it('命中已登记的段', () => {
    expect(scan('公网 IP', `license=${IP_PUB_A}`)).toHaveLength(1);
    expect(scan('公网 IP', `host=${IP_PUB_B}`)).toHaveLength(1);
  });

  it('不误伤其他公网段（未登记段不报，避免噪声）', () => {
    expect(scan('公网 IP', 'host=1.2.3.4')).toHaveLength(0);
  });
});

describe('规则 3：digi-user-token（48 位大写 HEX）', () => {
  it('命中 48 位大写 HEX', () => {
    expect(scan('digi-user-token', TOKEN48)).toHaveLength(1);
  });

  it('不误伤小写形态', () => {
    expect(scan('digi-user-token', 'a'.repeat(48))).toHaveLength(0);
  });

  it('不误伤 47 位（长度不足）', () => {
    expect(scan('digi-user-token', TOKEN47)).toHaveLength(0);
  });
});

describe('规则 4：账套名 CompanyId', () => {
  it('命中 SDDEMO 形态', () => {
    expect(scan('账套名 CompanyId', `company=${COMPANY}`)).toHaveLength(1);
  });

  it('命中 DEMO9x 形态', () => {
    expect(scan('账套名 CompanyId', `company=${COMPANY_SHORT}`)).toHaveLength(1);
  });

  it('不误伤占位符 TEST_COMPANY', () => {
    expect(scan('账套名 CompanyId', "company = 'TEST_COMPANY'")).toHaveLength(0);
  });
});

describe('规则 5：RSA 私钥', () => {
  it('命中 PRIVATE KEY 头', () => {
    expect(scan('RSA 私钥', PK_HEADER)).toHaveLength(1);
  });

  it('不误伤公钥头', () => {
    expect(scan('RSA 私钥', PUB_HEADER)).toHaveLength(0);
  });
});

describe('规则 6：Bearer 令牌', () => {
  it('命中足够长的 Bearer 值', () => {
    expect(scan('Bearer 令牌', `Bearer ${'x'.repeat(32)}`)).toHaveLength(1);
  });

  it('不误伤过短的示例值', () => {
    expect(scan('Bearer 令牌', 'Bearer abc')).toHaveLength(0);
  });
});

describe('规则 7：password 明文键', () => {
  it('命中 JSON 中的明文 password', () => {
    expect(scan('password 明文键', `{"${PW_KEY}": "hunter2"}`)).toHaveLength(1);
  });

  it('不误伤环境变量引用形态', () => {
    expect(scan('password 明文键', `{"${PW_KEY}": "\${DB_PASSWORD}"}`)).toHaveLength(0);
  });

  it('不误伤 password_env（键名本身合法）', () => {
    expect(scan('password 明文键', `{"${PW_KEY}_env": "YF_PASSWORD"}`)).toHaveLength(0);
  });
});

describe('maskHit：不得回显完整凭证', () => {
  it('长值只保留首尾各 4 字符', () => {
    const masked = maskHit(TOKEN48);
    expect(masked).toBe('AAAA…AAAA');
    expect(masked).not.toBe(TOKEN48);
    expect(masked.length).toBeLessThan(TOKEN48.length);
  });

  it('短值原样返回（不足以构成可用凭据）', () => {
    expect(maskHit('short')).toBe('short');
  });

  it('★ 掩码后不得包含原始值的中间片段', () => {
    const secret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    expect(maskHit(secret)).not.toContain(secret.slice(6, 20));
  });
});

describe('scanAll：扫描器集成契约', () => {
  it('返回结构含 scanned / findings / hits', () => {
    const r = scanAll();
    expect(typeof r.scanned).toBe('number');
    expect(typeof r.findings).toBe('number');
    expect(Array.isArray(r.hits)).toBe(true);
  });

  it('★ 仓库自身应扫描通过（findings === 0）', () => {
    // 这条同时是「门禁可执行」的证明：若哪天扫描器失灵（例如 RULES 被清空），
    // 该断言仍会通过，因此另用一条断言锁住规则非空（见下）。
    expect(scanAll().findings).toBe(0);
  });

  it('★ 规则不得为空（防止扫描器被改成永远 PASS）', () => {
    expect(RULES.length).toBeGreaterThan(0);
    // 每条规则都必须能命中其样本，否则是死规则
    const probes = [
      ['内网 IP', `host=${IP_192}`],
      ['公网 IP', `host=${IP_PUB_A}`],
      ['digi-user-token', TOKEN48],
      ['账套名 CompanyId', COMPANY],
      ['RSA 私钥', PK_HEADER],
      ['Bearer 令牌', `Bearer ${'x'.repeat(32)}`],
      ['password 明文键', `{"${PW_KEY}": "hunter2"}`],
    ];
    for (const [name, sample] of probes) {
      expect(scan(name, sample).length, `规则「${name}」未能命中其样本`).toBeGreaterThan(0);
    }
  });
});