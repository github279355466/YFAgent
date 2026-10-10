/**
 * gen-domain-map.mjs 解析器回归测试
 *
 * 背景（2026-10-09 门禁重构）：
 *   parseTypekeyMap 原先只认「顶格 + 流式」写法（`^- type_key: ` /
 *   `operations: [...]`），而入库的 typekey_map.yaml 是「2 空格缩进 + 块状列表」，
 *   导致静默解析出 **0 个业务对象**，门禁以「产物已过期」的形式误报。
 *
 * 本文件的职责：锁死「解析器必须兼容两种排版」这一契约，
 * 防止上游产物风格一变就再次静默失效。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  parseTypekeyMap,
  readYamlList,
  readYamlScalar,
  classify,
} from '../gen-domain-map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const REAL_YAML = path.join(REPO_ROOT, 'knowledge', 'typekey', 'typekey_map.yaml');

/** 顶格 + 流式（生成器当前输出的风格） */
const FLOW_STYLE = `
version: 1
typekeys:
- type_key: account
  title: 会计科目
  operations: [query, read]
  primary_key: [ac_no]
- type_key: employee
  title: 员工
  operations: [query]
  primary_key: [staff_no]
`;

/** 2 空格缩进 + 块状（入库产物当前的实际风格） */
const BLOCK_STYLE = `
version: 1
typekeys:
  - type_key: account
    title: 会计科目
    aliases:
      - 会计科目
    operations:
      - query
      - read
    primary_key:
      - ac_no
  - type_key: employee
    title: 员工
    operations:
      - query
    primary_key:
      - staff_no
`;

describe('readYamlList：流式与块状都要能取到值', () => {
  it('流式 [a, b] → 数组', () => {
    expect(readYamlList('  operations: [query, read]', 'operations')).toEqual(['query', 'read']);
  });

  it('块状 换行 + "- " 列表 → 数组', () => {
    const block = '  operations:\n    - query\n    - read';
    expect(readYamlList(block, 'operations')).toEqual(['query', 'read']);
  });

  it('键不存在 → 空数组（不得抛错）', () => {
    expect(readYamlList('  title: 会计科目', 'operations')).toEqual([]);
  });

  it('空块状列表 → 空数组', () => {
    expect(readYamlList('  primary_key:\n  service_name_shape: standard', 'primary_key')).toEqual([]);
  });

  it('只吃到同键的列表为止，不误吞后续键', () => {
    const block = '  primary_key:\n    - ac_no\n  service_name_shape: standard\n    - bogus';
    expect(readYamlList(block, 'primary_key')).toEqual(['ac_no']);
  });
});

describe('readYamlScalar：标量取值与去引号', () => {
  it('普通中文值', () => {
    expect(readYamlScalar('  title: 会计科目', 'title')).toBe('会计科目');
  });

  it('带引号的值应去掉引号', () => {
    expect(readYamlScalar('  title: "会计科目"', 'title')).toBe('会计科目');
  });

  it('键不存在 → null', () => {
    expect(readYamlScalar('  title: x', 'missing')).toBeNull();
  });
});

describe('parseTypekeyMap：两种排版必须解析出同样多的对象', () => {
  it('流式写法 → 2 个对象，字段正确', () => {
    const items = parseTypekeyMap(FLOW_STYLE);
    expect(items).toHaveLength(2);
    expect(items[0].type_key).toBe('account');
    expect(items[0].title).toBe('会计科目');
    expect(items[0].operations).toEqual(['query', 'read']);
    expect(items[0].primary_key).toBe('ac_no');
  });

  it('块状写法 → 2 个对象，字段正确（这是原先失效的路径）', () => {
    const items = parseTypekeyMap(BLOCK_STYLE);
    expect(items).toHaveLength(2);
    expect(items[0].type_key).toBe('account');
    expect(items[0].operations).toEqual(['query', 'read']);
    expect(items[0].primary_key).toBe('ac_no');
  });

  it('★ 两种排版解析结果一致（除 aliases 等无关字段）', () => {
    const pick = (x) => x.map((o) => [o.type_key, o.title, o.operations.join('|'), o.primary_key]);
    expect(pick(parseTypekeyMap(BLOCK_STYLE))).toEqual(pick(parseTypekeyMap(FLOW_STYLE)));
  });

  it('★ 对真实入库产物必须解析出 107 个对象（回归：曾静默解析出 0 个）', () => {
    const items = parseTypekeyMap(readFileSync(REAL_YAML, 'utf-8'));
    expect(items.length).toBe(107);
  });

  it('★ 真实产物中 account 的 operations / primary_key 必须非空', () => {
    const items = parseTypekeyMap(readFileSync(REAL_YAML, 'utf-8'));
    const account = items.find((o) => o.type_key === 'account');
    expect(account).toBeDefined();
    expect(account.operations.length).toBeGreaterThan(0);
    expect(account.primary_key).toBeTruthy();
  });

  it('★ 真机探测出的主键必须被读到（employee → staff_no）', () => {
    // 该主键由 scripts/probe-unknown-pk.mjs 真机反推后写入 yaml 的块状列表，
    // 正是旧解析器漏读、导致草案显示「—」的那 4 个对象之一。
    const items = parseTypekeyMap(readFileSync(REAL_YAML, 'utf-8'));
    const employee = items.find((o) => o.type_key === 'employee');
    expect(employee).toBeDefined();
    expect(employee.primary_key).toBe('staff_no');
  });
});

describe('classify：域归属判定', () => {
  it('首段精确匹配 → 高置信', () => {
    const r = classify('employee');
    expect(r.confidence).toBe('high');
    expect(r.code).toBe('base');
  });

  it('无规则命中 → 低置信（不猜）', () => {
    const r = classify('combination.order');
    expect(r.confidence).toBe('none');
  });
});