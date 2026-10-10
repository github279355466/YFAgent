/**
 * 工具注册入口 —— 将所有工具注册到 ToolRegistry。
 *
 * ★ 新增工具时只需：
 *   1. 在 tools/ 下创建新文件
 *   2. 在本文件中 import 并调用 registry.register()
 *   3. 在 EXPECTED_TOOLS 中添加名称
 *
 * assertAllRegistered() 会在启动时校验无遗漏。
 */

import type { ToolRegistry } from '../registry.js';

// 原有 4 个工具
import { manifestTool } from './manifest.js';
import { queryTool } from './query.js';
import { readTool } from './read.js';
import { helpTool } from './help.js';

// CRUD 补全（4个）
import { runTool } from './run.js';
import { validateTool } from './validate.js';
import { assembleTool } from './assemble.js';
import { routeTool } from './route.js';

// 分析+问数（7个）
import { askTool } from './ask.js';
import { analysisPlanTool } from './analysis-plan.js';
import { analysisStepTool } from './analysis-step.js';
import { analysisMetaTool } from './analysis-meta.js';
import { analysisPromptTool } from './analysis-prompt.js';
import { analysisSpecTool } from './analysis-spec.js';
import { serviceRouteTool } from './service-route.js';

// 专家引擎（8个）
import { expertArTool } from './expert-ar.js';
import { expertApTool } from './expert-ap.js';
import { expertCostTool } from './expert-cost.js';
import { expertGlTool } from './expert-gl.js';
import { expertSalesTool } from './expert-sales.js';
import { expertPurchaseTool } from './expert-purchase.js';
import { expertPlanTool } from './expert-plan.js';
import { expertProductionTool } from './expert-production.js';

// 辅助（1个）
import { skillVersionTool } from './skill-version.js';

/** 期望注册的全部工具名（门禁清单）。 */
export const EXPECTED_TOOLS = [
  // 原有
  'yf_manifest',
  'yf_query',
  'yf_read',
  'yf_help',
  // CRUD 补全
  'yf_run',
  'yf_validate',
  'yf_assemble',
  'yf_route',
  // 分析+问数
  'yf_ask',
  'yf_analysis_plan',
  'yf_analysis_step',
  'yf_analysis_meta',
  'yf_analysis_prompt',
  'yf_analysis_spec',
  'yf_service_route',
  // 专家引擎
  'yf_expert_ar',
  'yf_expert_ap',
  'yf_expert_cost',
  'yf_expert_gl',
  'yf_expert_sales',
  'yf_expert_purchase',
  'yf_expert_plan',
  'yf_expert_production',
  // 辅助
  'yf_skill_version',
] as const;

/** 将所有工具注册到 registry。 */
export function registerAllTools(registry: ToolRegistry): void {
  // 原有
  registry.register(manifestTool);
  registry.register(queryTool);
  registry.register(readTool);
  registry.register(helpTool);

  // CRUD 补全
  registry.register(runTool);
  registry.register(validateTool);
  registry.register(assembleTool);
  registry.register(routeTool);

  // 分析+问数
  registry.register(askTool);
  registry.register(analysisPlanTool);
  registry.register(analysisStepTool);
  registry.register(analysisMetaTool);
  registry.register(analysisPromptTool);
  registry.register(analysisSpecTool);
  registry.register(serviceRouteTool);

  // 专家引擎
  registry.register(expertArTool);
  registry.register(expertApTool);
  registry.register(expertCostTool);
  registry.register(expertGlTool);
  registry.register(expertSalesTool);
  registry.register(expertPurchaseTool);
  registry.register(expertPlanTool);
  registry.register(expertProductionTool);

  // 辅助
  registry.register(skillVersionTool);
}
