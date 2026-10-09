import xml.etree.ElementTree as ET
import re, os

CRLF = '\r\n'

# Parse OAPMB
tree = ET.parse(r'D:\AIProject\claude\YFAgent\docs\sources\OAPMB-openapi服务节点名对应关系.xml')
rows = tree.getroot().findall('.//{#RowsetSchema}row')

# Also parse OAPMA to get service→node_code mapping
tree_a = ET.parse(r'D:\AIProject\claude\YFAgent\docs\sources\OAPMA-openapi服务清单.xml')
rows_a = tree_a.getroot().findall('.//{#RowsetSchema}row')
svc_to_node = {}
for row in rows_a:
    svc = (row.get('MA001') or '').strip()
    nc = (row.get('MA005') or '').strip()
    if svc and nc:
        svc_to_node[svc] = nc

# Parse typekey_map to get node_code→type_key mapping
with open(r'D:\AIProject\claude\YFAgent\knowledge\typekey\typekey_map.yaml', 'r', encoding='utf-8') as f:
    tk_yaml = f.read()

node_to_tk = {}
for block in re.split(r'(?m)^- type_key: ', tk_yaml)[1:]:
    tk = block.split('\n')[0].strip()
    for m in re.finditer(r'^    \w+: (yf\.oapi\.\S+)$', block, re.MULTILINE):
        svc = m.group(1)
        if svc in svc_to_node:
            nc = svc_to_node[svc]
            if nc not in node_to_tk:
                node_to_tk[nc] = tk

# Extract enum mappings from MB012
# Format: "编码.中文;编码.中文;..." e.g. "Y.是;N.否"
enums_by_node = {}  # node_code → { alias → { values: {code: label}, cn_name, field_code } }
total_enums = 0
total_values = 0

for row in rows:
    mb012 = (row.get('MB012') or '').strip()
    if not mb012 or ';' not in mb012:
        continue
    
    alias = (row.get('MB004') or '').strip()
    node_code = (row.get('MB025') or '').strip()
    cn_name = (row.get('MB018') or '').strip()
    field_code = (row.get('MB002') or '').strip()
    
    if not alias or not node_code:
        continue
    
    # Parse "code.label;code.label;..."
    values = {}
    for pair in mb012.split(';'):
        pair = pair.strip()
        if '.' in pair:
            dot_idx = pair.index('.')
            code = pair[:dot_idx].strip()
            label = pair[dot_idx+1:].strip()
            if code:
                values[code] = label
    
    if not values:
        continue
    
    if node_code not in enums_by_node:
        enums_by_node[node_code] = {}
    
    enums_by_node[node_code][alias] = {
        'values': values,
        'cn_name': cn_name,
        'field_code': field_code,
    }
    total_enums += 1
    total_values += len(values)

print(f"Extracted: {total_enums} enum fields, {total_values} values across {len(enums_by_node)} nodes")

# Build YAML output grouped by type_key
lines = [
    '# 易飞 OpenAPI 枚举字典',
    '# 数据源：OAPMB.MB012（内存外显字段）',
    f'# 统计：{total_enums} 个枚举字段 / {total_values} 个枚举值 / {len(enums_by_node)} 个节点',
    '# 生成时间：2026-10-09',
    '# 用途：SDK enum-guard 校验 + MCP help 工具展示 + Agent 枚举值查询',
    '# 格式：type_key → field_alias → { code: label, ... }',
    '',
]

# Group by type_key
enums_by_tk = {}
unmapped_nodes = []
for nc, fields in sorted(enums_by_node.items()):
    tk = node_to_tk.get(nc)
    if tk:
        if tk not in enums_by_tk:
            enums_by_tk[tk] = {}
        for alias, info in sorted(fields.items()):
            enums_by_tk[tk][alias] = {
                'cn_name': info['cn_name'],
                'field_code': info['field_code'],
                'node_code': nc,
                'values': info['values'],
            }
    else:
        unmapped_nodes.append(nc)

if unmapped_nodes:
    lines.append(f'# 未映射到 type_key 的节点: {unmapped_nodes}')
    lines.append('')

for tk in sorted(enums_by_tk.keys()):
    fields = enums_by_tk[tk]
    lines.append(f'{tk}:')
    for alias in sorted(fields.keys()):
        info = fields[alias]
        lines.append(f'  {alias}:')
        lines.append(f'    cn_name: {info["cn_name"]}')
        lines.append(f'    field_code: {info["field_code"]}')
        lines.append(f'    node_code: {info["node_code"]}')
        lines.append(f'    values:')
        for code, label in sorted(info['values'].items()):
            # Escape special chars in YAML
            safe_label = label.replace('"', '\\"')
            if any(c in safe_label for c in ':{}[],&*?|-><!%@`#'):
                safe_label = f'"{safe_label}"'
            lines.append(f'      "{code}": {safe_label}')
    lines.append('')

yaml_out = CRLF.join(lines)
out_path = r'D:\AIProject\claude\YFAgent\knowledge\enums\enums.yaml'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8', newline='') as f:
    f.write(yaml_out)

size_kb = os.path.getsize(out_path) / 1024
print(f"Written: {out_path} ({size_kb:.1f} KB)")
print(f"TypeKeys with enums: {len(enums_by_tk)}")
print(f"Unmapped nodes: {len(unmapped_nodes)}")

# Show a few examples
print(f"\n=== Examples ===")
for tk in ['sales.order', 'purchase.order', 'accounting.voucher']:
    if tk in enums_by_tk:
        print(f"\n{tk}:")
        for alias, info in list(enums_by_tk[tk].items())[:3]:
            vals = ', '.join(f'{k}={v}' for k, v in list(info['values'].items())[:4])
            print(f"  {alias} ({info['cn_name']}): {vals}")
