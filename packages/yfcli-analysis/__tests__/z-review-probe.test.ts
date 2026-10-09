import { describe, it } from "vitest";
import { validateTemplate, type SqlTemplate } from "../src/runtime/sql/template.js";
describe("审查取证2", () => {
  it("T8 OPENROWSET 无反引号/分号变体", () => {
    const cases = [
      "SELECT TOP (:max_rows) a FROM OPENROWSET(BULK 'c:\\\\x', SINGLE_CLOB) AS t",
      "SELECT TOP (:max_rows) a FROM OPENDATASOURCE('SQLNCLI','x')",
      "SELECT TOP (:max_rows) [a] FROM [COPMA]",
      "SELECT TOP (:max_rows) a FROM evil.vw_ai_x",
    ];
    for (const c of cases) {
      let err = "";
      try { validateTemplate({ id:"t8", label:"x", params:[], max_rows:10, timeout_ms:1000, sql:c } as SqlTemplate); }
      catch(e:any){ err = e.message; }
      console.log("T8_OUT>> " + (err === "" ? "通过校验(未被拦截) << " : "被拒 << ") + c.slice(0,70));
    }
  });
});
