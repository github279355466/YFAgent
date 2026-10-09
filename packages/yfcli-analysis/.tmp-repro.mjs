import { convertPlaceholders } from "./src/runtime/sql/driver.ts";
import { validateTemplate } from "./src/runtime/sql/template.ts";

console.log("T1 冒号字符串字面量被误替换:");
const a = "SELECT * FROM vw_ai_x WHERE url = 'http://a' AND t = :end_date";
console.log("  输入:", a);
console.log("  输出:", convertPlaceholders(a));

console.log("\nT2 EXEC 关键字门禁（整词匹配）:");
for (const s of ["EXEC(", "EXECUTE(", "xEC(", "SELECT 1;EXEC("]) {
  const m = s.match(/\bexec/gi);
  const m2 = s.match(/\bexec(?:ute)?/gi);
  console.log(`  "${s}" -> \\bexec: ${m ? JSON.stringify(m) : "null"} | \\bexec(?:ute)?: ${m2 ? JSON.stringify(m2) : "null"}`);
}

console.log("\nT3 字符串字面量内的分号:");
try {
  validateTemplate({ id:"t3", label:"x", params:[], max_rows:10, timeout_ms:1000,
    sql: `SELECT TOP (:max_rows) a FROM vw_ai_x WHERE a = 'A;B'` });
  console.log("  含 'A;B': 通过");
} catch (e) { console.log("  含 'A;B': 被拒 ->", e.message); }

console.log("\nT4 max_rows=0:");
try {
  validateTemplate({ id:"t4", label:"x", params:[], max_rows:0, timeout_ms:1000,
    sql: `SELECT TOP (:max_rows) a FROM vw_ai_x` });
  console.log("  通过");
} catch (e) { console.log("  被拒 ->", e.message); }
