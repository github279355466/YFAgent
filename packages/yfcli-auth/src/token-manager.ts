/**
 * Token 生命周期管理。
 *
 * MVP 范围：获取 / 缓存 / 过期检测 / 清除。
 * 不做：自动刷新（文档未说明刷新语义，转 OPEN-DECISIONS.md）。
 *
 * 设计约束（AGENTS.md + task.json）：
 * - Token 必须由调用方显式注入（沿用 YZCLI 唯一正确约束）。
 * - token_expired 与 token_invalid 必须区分。
 * - 无 token 时 getToken() 抛 TokenExpiredError（fail-fast）。
 */

import type { TokenState } from './types.js';
import { TokenExpiredError } from './types.js';

/**
 * Token 管理器。
 *
 * 线程安全说明：Node.js 单线程模型下无需锁。
 * 若未来移植到 Worker 环境，需改用 SharedArrayBuffer 或消息传递。
 */
export class TokenManager {
  private state: TokenState | undefined;

  /**
   * 获取当前缓存的 token。
   *
   * @throws TokenExpiredError 无 token 或已过期时抛出。
   */
  getToken(): string {
    if (!this.state) {
      throw new TokenExpiredError('Token 未设置，请先调用 setToken()');
    }

    if (this.isExpired()) {
      throw new TokenExpiredError(
        `Token 已过期（过期时间: ${new Date(this.state.expiresAt!).toISOString()}）`,
      );
    }

    return this.state.token;
  }

  /**
   * 设置 token + 可选过期时间。
   *
   * @param token     Token 值。空字符串视为无效，抛错。
   * @param expiresAt 过期时间戳（毫秒）。undefined 表示未知过期时间。
   */
  setToken(token: string, expiresAt?: number): void {
    if (!token || token.trim().length === 0) {
      throw new Error('Token 不能为空');
    }

    this.state = {
      token,
      expiresAt,
      setAt: Date.now(),
    };
  }

  /**
   * 检查 token 是否已过期。
   *
   * - 无 token → true
   * - 无过期时间 → false（未知过期 ≠ 已过期）
   * - 过期时间 ≤ 当前时间 → true
   */
  isExpired(): boolean {
    if (!this.state) {
      return true;
    }

    if (this.state.expiresAt === undefined) {
      return false;
    }

    return this.state.expiresAt <= Date.now();
  }

  /** 清除缓存的 token。 */
  clearToken(): void {
    this.state = undefined;
  }

  /** 获取当前 token 状态快照（用于调试/日志）。不含 token 值本身。 */
  getState(): { hasToken: boolean; expired: boolean; setAt: number | undefined } {
    return {
      hasToken: this.state !== undefined,
      expired: this.isExpired(),
      setAt: this.state?.setAt,
    };
  }
}
