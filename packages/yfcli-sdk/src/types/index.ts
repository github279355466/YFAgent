/**
 * 对外类型总出口。
 *
 * 只做类型再导出，不含任何运行时逻辑。
 */

export type {
  YfDataKey,
  YfServiceKey,
  YfRequestHeaders,
  YfRequestEnvelope,
  YfExecution,
  YfResponseEnvelope,
  YfResponseStdData,
  YfResponseParameter,
  YfResultBlock,
  YfRow,
  YfFlatErrorItem,
  YfInformationErrorItem,
  YfErrorDataCarrier,
  YfSuccessCode,
} from './protocol.js';
export { YF_SUCCESS_CODES, YF_PAGE_SIZE_MAX, YF_PAGE_NO_MIN } from './protocol.js';

export type {
  YfLogicalOperator,
  YfFieldOperator,
  YfConditionField,
  YfConditionGroup,
  YfConditions,
  YfOrder,
  YfPagination,
  YfQueryParameter,
  YfDataKeysParameter,
  YfEntityParameter,
} from './conditions.js';

export type {
  YfOperation,
  YfOperationAliasMap,
  YfTypeKeyEntry,
  YfServiceNameResolver,
  YfQueryResult,
  YfActionResult,
  YfEnumFieldSpec,
} from './domain.js';
export { YF_OPERATIONS, YF_CODE_TEXT_SEPARATOR } from './domain.js';

// 字段分层（网关注入 vs 业务表物理列）
export type {
  GatewayInjectedFields,
  GatewayInjectedFieldName,
  YfUdfTextField,
  YfUdfNumericField,
  YfUdfValue,
  PhysicalRow,
  ApiRow,
} from './fields.js';
export {
  GATEWAY_INJECTED_FIELD_NAMES,
  YF_UDF_TEXT_FIELDS,
  YF_UDF_NUMERIC_FIELDS,
  YF_UDF_FIELDS,
  isGatewayInjectedFieldName,
  isUdfFieldName,
  stripGatewayInjectedFields,
  findUnassignableFields,
  parseYfTimestamp,
} from './fields.js';

export type {
  YfSdkConfig,
  YfConfigValidation,
  YfConfigViolation,
  ResolvedRuntimeConfig,
} from './config.js';
export { YfConfigError } from './config.js';

export type {
  YfErrorLayer,
  YfErrorKind,
  YfErrorEntry,
  YfErrorContext,
  YfErrorInit,
} from './errors.js';
export { YfError, YfAmbiguousServiceError, httpError, emptyResultError, isYfError, isYfErrorDataCarrier } from './errors.js';