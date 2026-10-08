/**
 * 请求头构造 —— 易飞四头封装。
 *
 * 四个头**全部必填**（真机逐个验证，缺失文案各不相同）：
 * | 头 | 缺失时真机响应 |
 * |---|---|
 * | digi-service | code=-1「无效的身份令牌，请联系管理员分配身份令牌！」（空服务名被误判为令牌问题）|
 * | digi-user-token | code=-1「无效的身份令牌,请检查是否传入身份令牌.」|
 * | digi-datakey | code=-1「digi-datakey is not valid.」（纯英文，易助无此头）|
 * | Content-Type | 文档标注必填 |
 */

import type { ResolvedRuntimeConfig } from '../types/config.js';
import type { YfDataKey, YfRequestHeaders, YfServiceKey } from '../types/protocol.js';
import { YF_CONTENT_TYPE } from '../config/config.js';

/**
 * 构造四个必填头。
 *
 * `digi-service` 与 `digi-datakey` 的值都是 **JSON 字符串**，不是裸值 ——
 * 这一点与易助不同，写错会得到误导性报错。
 */
export function buildHeaders(
  config: ResolvedRuntimeConfig,
  serviceName: string,
): YfRequestHeaders {
  const serviceKey: YfServiceKey = { name: serviceName };
  const dataKey: YfDataKey = { CompanyId: config.companyId };

  return {
    'digi-service': JSON.stringify(serviceKey),
    'digi-user-token': config.token,
    'digi-datakey': JSON.stringify(dataKey),
    'Content-Type': YF_CONTENT_TYPE,
  };
}

/**
 * 语义化包装：把易飞的误导性报错翻译成可理解的提示。
 *
 * 实测：空 `digi-service.name` 返回的是「无效的身份令牌，请联系管理员分配身份令牌！」，
 * 而非「服务不存在」。若直接透传，用户会去查令牌而找错方向。
 */
export function explainMisleadingAuthMessage(description: string): string | undefined {
  const normalized = description.replace(/\s+/g, '');
  if (normalized.includes('无效的身份令牌，请联系管理员分配身份令牌')) {
    return (
      '易飞对「服务名为空」返回的是令牌类报错，属服务端误导性提示。' +
      '真实原因通常是 digi-service.name 未填或服务名拼写错误，' +
      '请从 knowledge/typekey/typekey_map.yaml 查确切服务名，勿据此排查令牌。'
    );
  }
  return undefined;
}