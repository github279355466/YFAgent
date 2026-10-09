import { describe, it, expect, beforeEach } from 'vitest';
import { TokenManager } from '../src/token-manager.js';
import { TokenExpiredError } from '../src/types.js';

describe('TokenManager', () => {
  let manager: TokenManager;

  beforeEach(() => {
    manager = new TokenManager();
  });

  // -----------------------------------------------------------------------
  // setToken / getToken
  // -----------------------------------------------------------------------

  describe('setToken / getToken', () => {
    it('设置后可获取', () => {
      manager.setToken('my-token');
      expect(manager.getToken()).toBe('my-token');
    });

    it('空字符串抛错', () => {
      expect(() => manager.setToken('')).toThrow('Token 不能为空');
    });

    it('纯空白字符串抛错', () => {
      expect(() => manager.setToken('   ')).toThrow('Token 不能为空');
    });

    it('覆盖旧 token', () => {
      manager.setToken('old');
      manager.setToken('new');
      expect(manager.getToken()).toBe('new');
    });

    it('带过期时间的 token 未过期时可获取', () => {
      const future = Date.now() + 60_000;
      manager.setToken('valid', future);
      expect(manager.getToken()).toBe('valid');
    });
  });

  // -----------------------------------------------------------------------
  // isExpired
  // -----------------------------------------------------------------------

  describe('isExpired', () => {
    it('无 token 时返回 true', () => {
      expect(manager.isExpired()).toBe(true);
    });

    it('无过期时间时返回 false', () => {
      manager.setToken('tok');
      expect(manager.isExpired()).toBe(false);
    });

    it('未来过期时间返回 false', () => {
      manager.setToken('tok', Date.now() + 60_000);
      expect(manager.isExpired()).toBe(false);
    });

    it('过去过期时间返回 true', () => {
      manager.setToken('tok', Date.now() - 1000);
      expect(manager.isExpired()).toBe(true);
    });

    it('过期时间恰好等于当前时间返回 true', () => {
      const now = Date.now();
      manager.setToken('tok', now);
      // expiresAt <= Date.now() → true
      expect(manager.isExpired()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getToken 过期行为
  // -----------------------------------------------------------------------

  describe('getToken 过期检测', () => {
    it('token 过期时抛 TokenExpiredError', () => {
      manager.setToken('expired', Date.now() - 1000);
      expect(() => manager.getToken()).toThrow(TokenExpiredError);
    });

    it('无 token 时抛 TokenExpiredError', () => {
      expect(() => manager.getToken()).toThrow(TokenExpiredError);
    });

    it('TokenExpiredError 携带 code 字段', () => {
      manager.setToken('expired', Date.now() - 1000);
      try {
        manager.getToken();
        expect.fail('should throw');
      } catch (err) {
        expect((err as TokenExpiredError).code).toBe('TOKEN_EXPIRED');
      }
    });
  });

  // -----------------------------------------------------------------------
  // clearToken
  // -----------------------------------------------------------------------

  describe('clearToken', () => {
    it('清除后 getToken 抛错', () => {
      manager.setToken('tok');
      manager.clearToken();
      expect(() => manager.getToken()).toThrow(TokenExpiredError);
    });

    it('清除后 isExpired 返回 true', () => {
      manager.setToken('tok');
      manager.clearToken();
      expect(manager.isExpired()).toBe(true);
    });

    it('重复清除不抛错', () => {
      manager.clearToken();
      manager.clearToken();
      expect(manager.isExpired()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getState
  // -----------------------------------------------------------------------

  describe('getState', () => {
    it('初始状态 hasToken=false', () => {
      const state = manager.getState();
      expect(state.hasToken).toBe(false);
      expect(state.expired).toBe(true);
      expect(state.setAt).toBeUndefined();
    });

    it('设置后 hasToken=true', () => {
      manager.setToken('tok');
      const state = manager.getState();
      expect(state.hasToken).toBe(true);
      expect(state.expired).toBe(false);
      expect(state.setAt).toBeTypeOf('number');
    });
  });
});
