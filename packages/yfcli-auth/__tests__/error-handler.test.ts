import { describe, it, expect } from 'vitest';
import {
  classifyHttpError,
  isHtmlResponse,
} from '../src/error-handler.js';
import {
  TokenExpiredError,
  TokenInvalidError,
  ErpConnectionError,
} from '../src/types.js';

// ---------------------------------------------------------------------------
// isHtmlResponse
// ---------------------------------------------------------------------------

describe('isHtmlResponse', () => {
  it('DOCTYPE 声明识别为 HTML', () => {
    expect(isHtmlResponse('<!DOCTYPE html><html></html>')).toBe(true);
  });

  it('小写 doctype 识别为 HTML', () => {
    expect(isHtmlResponse('<!doctype html>')).toBe(true);
  });

  it('<html> 标签识别为 HTML', () => {
    expect(isHtmlResponse('<html><body>Error</body></html>')).toBe(true);
  });

  it('JSON 字符串不是 HTML', () => {
    expect(isHtmlResponse('{"code":-1,"description":"error"}')).toBe(false);
  });

  it('纯文本不是 HTML', () => {
    expect(isHtmlResponse('Internal Server Error')).toBe(false);
  });

  it('前导空白后的 HTML 仍能识别', () => {
    expect(isHtmlResponse('  \n  <!DOCTYPE html>')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// classifyHttpError
// ---------------------------------------------------------------------------

describe('classifyHttpError', () => {
  it('500 + HTML → TokenInvalidError', () => {
    const result = classifyHttpError(500, '<!DOCTYPE html><html>Server Error</html>');
    expect(result.error).toBeInstanceOf(TokenInvalidError);
    expect(result.statusCode).toBe(500);
    expect(result.isHtmlBody).toBe(true);
    expect((result.error as TokenInvalidError).code).toBe('TOKEN_INVALID');
  });

  it('401 → TokenExpiredError', () => {
    const result = classifyHttpError(401, '{"message":"Unauthorized"}');
    expect(result.error).toBeInstanceOf(TokenExpiredError);
    expect(result.statusCode).toBe(401);
    expect((result.error as TokenExpiredError).code).toBe('TOKEN_EXPIRED');
  });

  it('403 → TokenExpiredError', () => {
    const result = classifyHttpError(403, 'Forbidden');
    expect(result.error).toBeInstanceOf(TokenExpiredError);
    expect(result.statusCode).toBe(403);
  });

  it('500 + JSON → ErpConnectionError（非 TokenInvalid）', () => {
    const result = classifyHttpError(500, '{"code":-1,"description":"internal error"}');
    expect(result.error).toBeInstanceOf(ErpConnectionError);
    expect(result.isHtmlBody).toBe(false);
  });

  it('502 → ErpConnectionError', () => {
    const result = classifyHttpError(502, 'Bad Gateway');
    expect(result.error).toBeInstanceOf(ErpConnectionError);
    expect(result.statusCode).toBe(502);
  });

  it('503 → ErpConnectionError', () => {
    const result = classifyHttpError(503, 'Service Unavailable');
    expect(result.error).toBeInstanceOf(ErpConnectionError);
  });

  it('200 不应被调用，但若传入仍返回 ErpConnectionError', () => {
    // 正常流程不会传 200 进来，但防御性测试
    const result = classifyHttpError(200, 'OK');
    expect(result.error).toBeInstanceOf(ErpConnectionError);
  });

  it('TokenInvalidError 携带 statusCode', () => {
    const result = classifyHttpError(500, '<html>Error</html>');
    expect((result.error as TokenInvalidError).statusCode).toBe(500);
  });

  it('区分 expired vs invalid 的 code 字段', () => {
    const expired = classifyHttpError(401, '');
    const invalid = classifyHttpError(500, '<html>');
    expect(expired.error.code).toBe('TOKEN_EXPIRED');
    expect(invalid.error.code).toBe('TOKEN_INVALID');
    expect(expired.error.code).not.toBe(invalid.error.code);
  });
});
