import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';

const yamlPath = new URL('../../../knowledge/typekey/typekey_map.yaml', import.meta.url);
const outPath = new URL('../references/typekey-index.md', import.meta.url);

const data = parse(readFileSync(yamlPath, 'utf8'));
const typekeys = data.typekeys;

const lines = [];
lines.push(`# 完整 TypeKey 列表（${typekeys.length} 个）`);
lines.push('');
lines.push('> 从 `typekey_map.yaml` 自动提取的精简索引。Agent 需要详细信息时调用 `yf_manifest` 或 `yf_help(type_key)`。');
lines.push('> ');
lines.push('> ⚠️ 本文件由脚本生成，禁止手工编辑。重新生成：`node scripts/gen-typekey-index.mjs`');
lines.push('');
lines.push('| TypeKey | 中文名 | 主键 | 容器名 | 操作 | 服务名形状 |');
lines.push('|---------|--------|------|--------|------|-----------|');

for (const tk of typekeys) {
  const typeKey = tk.type_key;
  const title = tk.title || '';
  const pk = (tk.primary_key || []).join(' + ') || '-';
  
  // Container name: prefer verified, then detail_nodes[0]
  let container = '-';
  let verifiedMark = '';
  if (tk.container_name_verified) {
    container = tk.container_name_verified;
    verifiedMark = ' ✅';
  } else if (tk.detail_nodes && tk.detail_nodes.length > 0) {
    container = tk.detail_nodes[0];
  }
  container += verifiedMark;
  
  const ops = (tk.operations || []).join(', ') || '-';
  const shape = tk.service_name_shape || '-';
  
  lines.push(`| ${typeKey} | ${title} | ${pk} | ${container} | ${ops} | ${shape} |`);
}

lines.push('');
lines.push('## 列说明');
lines.push('');
lines.push('- **容器名**：写操作（create/update）时 `parameter` 下的节点名。标 ✅ 表示经真机实测确认（文档标注有误的对象）');
lines.push('- **操作**：该对象支持的 MCP 操作类型');
lines.push('- **服务名形状**：`standard` = 含 `.data.` 段（如 `yf.oapi.plant.data.create`）；`mixed` = 部分操作含/不含；`undefined` = 需查表');
lines.push('');
lines.push('## 统计');
lines.push('');

const withDetail = typekeys.filter(t => t.detail_nodes && t.detail_nodes.length > 0).length;
const withVerified = typekeys.filter(t => t.container_name_verified).length;
const shapes = {};
typekeys.forEach(t => { shapes[t.service_name_shape || 'undefined'] = (shapes[t.service_name_shape || 'undefined'] || 0) + 1; });

lines.push(`- 总对象数：${typekeys.length}`);
lines.push(`- 有容器名（detail_nodes）：${withDetail}`);
lines.push(`- 无容器名（仅 query/read）：${typekeys.length - withDetail}`);
lines.push(`- 容器名经实测修正：${withVerified}`);
lines.push(`- 服务名形状分布：${Object.entries(shapes).map(([k,v]) => `${k}=${v}`).join(', ')}`);
lines.push('');

const content = lines.join('\r\n');
writeFileSync(outPath, content, 'utf8');
console.log(`Generated ${outPath.pathname}: ${typekeys.length} rows, ${(content.length/1024).toFixed(1)}KB`);
