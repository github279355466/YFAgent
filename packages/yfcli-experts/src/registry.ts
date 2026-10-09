/**
 * 专家 × 模板 × 口径 三者注册表
 *
 * 核心约束：
 *   - 每个公式的 sourceTemplateId 必须在 P4 模板库中存在
 *   - 重复注册的专家 id 会抛错
 *   - assertConsistency() 验证所有公式的模板引用有效
 */
import type { ExpertDefinition, FormulaDefinition } from "./types.js";

/** 模板存在性检查器（P4 模板注册表的接口子集） */
export interface TemplateResolver {
  /** 返回 true 表示该模板 id 在 P4 注册表中存在 */
  hasTemplate(id: string): boolean;
}

export class ExpertRegistry {
  private experts = new Map<string, ExpertDefinition>();

  /**
   * 注册一个专家定义。
   * 如果同名专家已注册，抛出错误。
   */
  register(expert: ExpertDefinition): void {
    if (this.experts.has(expert.id)) {
      throw new Error(`ExpertRegistry: 专家 "${expert.id}" 已注册，不能重复`);
    }
    this.experts.set(expert.id, expert);
  }

  /** 获取专家定义 */
  getExpert(id: string): ExpertDefinition | undefined {
    return this.experts.get(id);
  }

  /** 获取指定专家的公式 */
  getFormula(expertId: string, formulaId: string): FormulaDefinition | undefined {
    const expert = this.experts.get(expertId);
    if (!expert) return undefined;
    return expert.formulas.find((f) => f.id === formulaId);
  }

  /** 列出所有已注册的专家 */
  listExperts(): ExpertDefinition[] {
    return [...this.experts.values()];
  }

  /** 当前注册的专家数量 */
  get size(): number {
    return this.experts.size;
  }

  /**
   * 一致性门禁：检查所有公式的 sourceTemplateId 是否在 P4 模板库中存在。
   * 不匹配则抛出错误，附带偏差信息。
   */
  assertConsistency(resolver: TemplateResolver): void {
    const errors: string[] = [];
    for (const expert of this.experts.values()) {
      for (const formula of expert.formulas) {
        if (!resolver.hasTemplate(formula.sourceTemplateId)) {
          errors.push(
            `专家 "${expert.id}" 公式 "${formula.id}" 引用了不存在的模板 "${formula.sourceTemplateId}"`,
          );
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(
        `ExpertRegistry 一致性检查失败 (${errors.length} 个偏差):\n` +
          errors.map((e) => `  - ${e}`).join("\n"),
      );
    }
  }
}
