/**
 * SDK 入口 —— 只做再导出（装配），零业务逻辑。
 *
 * 依赖方向：index -> client / catalog / conditions / config / types
 * 反向依赖一律禁止（各层不得 import 本文件）。
 */

// 类型总出口
export type {
  YfActionResult,
  YfConditionField,
  YfConditionGroup,
  YfConditions,
  YfConfigValidation,
  YfConfigViolation,
  YfDataKey,
  YfDataKeysParameter,
  YfEntityParameter,
  YfEnumFieldSpec,
  YfErrorContext,
  YfErrorEntry,
  YfErrorKind,
  YfErrorLayer,
  YfFieldOperator,
  YfFlatErrorItem,
  YfInformationErrorItem,
  YfLogicalOperator,
  YfOperation,
  YfOperationAliasMap,
  YfOrder,
  YfPagination,
  YfQueryParameter,
  YfQueryResult,
  YfRequestEnvelope,
  YfRequestHeaders,
  YfResponseEnvelope,
  YfResultBlock,
  YfRow,
  YfSdkConfig,
  YfServiceKey,
  YfServiceNameResolver,
  YfSuccessCode,
  YfTypeKeyEntry,
  // 字段分层
  GatewayInjectedFields,
  GatewayInjectedFieldName,
  PhysicalRow,
  ApiRow,
  YfUdfTextField,
  YfUdfNumericField,
  YfUdfValue,
  ResolvedRuntimeConfig,
} from './types/index.js';
export {
  YF_OPERATIONS,
  YF_PAGE_NO_MIN,
  YF_PAGE_SIZE_MAX,
  YF_SUCCESS_CODES,
  // 字段分层
  GATEWAY_INJECTED_FIELD_NAMES,
  YF_UDF_TEXT_FIELDS,
  YF_UDF_NUMERIC_FIELDS,
  YF_UDF_FIELDS,
  isGatewayInjectedFieldName,
  isUdfFieldName,
  stripGatewayInjectedFields,
  findUnassignableFields,
  parseYfTimestamp,
} from './types/index.js';
export { YfConfigError, YfError, isYfError } from './types/index.js';

// 配置层
export {
  YF_CONTENT_TYPE,
  YF_ENDPOINT_PATH,
  assertValidConfig,
  resolveRuntimeConfig,
  validateConfig,
} from './config/config.js';
export type { EnvLike } from './config/config.js';
export { buildHeaders, explainMisleadingAuthMessage } from './config/headers.js';

// 条件构造层
export {
  allOf,
  allRecords,
  anyOf,
  asc,
  assertNotYiZhuConditionsShape,
  between,
  compositeField,
  desc,
  exists,
  field,
  group,
  inList,
  like,
  notExists,
  notInList,
  pagination,
  queryParameter,
} from './conditions/builder.js';
export {
  correctEnumFields,
  extractCode,
  guardEnumConditionValue,
  looksLikeCodeText,
} from './conditions/enum-guard.js';
export type { YfEnumGuardVerdict } from './conditions/enum-guard.js';

// 响应解析层
export {
  buildBusinessError,
  describeEmptyResultWarning,
  isSuccessCode,
  parseActionResult,
  parseEnvelope,
  parseErrorEntries,
  parseQueryResult,
} from './response/parser.js';

// 目录层
export { TypeKeyCatalog } from './catalog/typekey-catalog.js';

// 传输层
export { FetchTransport, assertHttpOk } from './transport/http-transport.js';
export type { YfHttpResponse, YfTransport } from './transport/http-transport.js';

// 客户端
export { NOOP_LOGGER, YfClient } from './client/yf-client.js';
export type { YfClientOptions, YfLogger } from './client/yf-client.js';

// 字典层（列名形态判据 = OPEN-F7 冻结口径）
export {
  COLUMN_SHAPE_STANDARD,
  UDF_COLUMN_PATTERN,
  ANOMALY_SHAPES,
  OPEN_F4_EXCLUDED_TABLES,
  TABLE_ANOMALY_NOTES,
  prefixCandidates,
  prefixMatches,
  prefixApplicable,
  classifyColumn,
  isStandardColumn,
} from './dictionary/column-shapes.js';
export type { YfColumnShape } from './dictionary/column-shapes.js';
export { FieldDictionary } from './dictionary/field-dictionary.js';
export type { FieldInfo, TableInfo, ListFieldsOptions } from './dictionary/field-dictionary.js';
export { parseCsv, toRecords } from './dictionary/csv.js';
export type { CsvRow } from './dictionary/csv.js';

// 日志脱敏
export { maskToken, redact, redactErrorData } from './logging/redact.js';
export type { YfRedactOptions } from './logging/redact.js';