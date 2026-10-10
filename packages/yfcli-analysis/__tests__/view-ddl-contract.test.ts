/**
 * 视图 DDL 契约测试
 *
 * 背景（2026-10-10 OPEN-G2）：9 个 vw_ai_* 只读视图的 DDL 曾使用
 * `GRANT SELECT ... TO PUBLIC`，等于把应收/应付/总账/毛利开放给库内
 * 任意登录账号。本文件把「不得给 PUBLIC」与「必须可重复执行」两条
 * 契约锁死，防止回归。
 *
 * 说明：本测试只校验脚本**文本契约**，不连数据库 —— 真机权限状态
 * 需由 DBA 执行 revoke-public-grants.sql 后另行验证（见 OPEN-G2 待办）。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIEWS_DIR = path.resolve(HERE, '..', 'sql', 'views');

/** 9 个视图文件（排除补救脚本 revoke-public-grants.sql） */
const viewFiles = readdirSync(VIEWS_DIR)
  .filter((f) => f.startsWith('vw_ai_') && f.endsWith('.sql'))
  .sort();

const readView = (f) => readFileSync(path.join(VIEWS_DIR, f), 'utf-8');

describe('视图 DDL 集合', () => {
  it('应有 9 个 vw_ai_* 视图', () => {
    expect(viewFiles).toHaveLength(9);
  });
});

describe('★ 安全契约：不得授权给 PUBLIC（OPEN-G2）', () => {
  it.each(viewFiles)('%s 不得存在生效的 GRANT ... TO PUBLIC', (f) => {
    const sql = readView(f);
    // 去掉注释行后再检查，允许「注释掉的示例」存在
    const active = sql
      .split(/\r?\n/)
      .filter((l) => !/^\s*--/.test(l))
      .join('\n');
    expect(active).not.toMatch(/GRANT\s+SELECT[\s\S]*?TO\s+PUBLIC/i);
  });

  it.each(viewFiles)('%s 应保留「授权主体由 DBA 指定」的提示', (f) => {
    const sql = readView(f);
    expect(sql).toMatch(/GRANT\s+SELECT[\s\S]*?TO\s+ai/i);
    expect(sql).toMatch(/DBA/);
  });
});

describe('★ 幂等契约：DDL 必须可重复执行', () => {
  it.each(viewFiles)('%s 应在 CREATE VIEW 前先 DROP 旧视图', (f) => {
    const sql = readView(f);
    const dropIdx = sql.search(/IF\s+OBJECT_ID\([^)]*,\s*'V'\)\s+IS\s+NOT\s+NULL\s+DROP\s+VIEW/i);
    const createIdx = sql.search(/CREATE\s+VIEW\s+dbo\./i);
    expect(dropIdx, '缺少幂等 DROP 守卫').toBeGreaterThanOrEqual(0);
    expect(createIdx).toBeGreaterThan(dropIdx);
  });
});

describe('补救脚本 revoke-public-grants.sql', () => {
  const p = path.join(VIEWS_DIR, 'revoke-public-grants.sql');

  it('存在', () => {
    expect(() => readFileSync(p, 'utf-8')).not.toThrow();
  });

  it('★ 应对 9 个视图逐个 REVOKE PUBLIC', () => {
    const sql = readFileSync(p, 'utf-8');
    const active = sql
      .split(/\r?\n/)
      .filter((l) => !/^\s*--/.test(l))
      .join('\n');
    const revokes = [...active.matchAll(/REVOKE\s+SELECT\s+ON\s+dbo\.(vw_ai_\w+)\s+FROM\s+PUBLIC/gi)];
    expect(revokes).toHaveLength(9);
    // 且与视图文件集合一致
    const revokedNames = revokes.map((m) => `${m[1]}.sql`).sort();
    expect(revokedNames).toEqual(viewFiles);
  });
});