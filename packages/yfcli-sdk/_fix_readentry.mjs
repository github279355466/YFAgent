import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/catalog/typekey-catalog.ts', 'utf8');

// Add conflictCandidates to readEntry's base object
const oldBase = `  const base = {
    typeKey,
    title: readString(item['title']) ?? typeKey,
    services: readServices(item['services']),
    primaryKey: readStringArray(item['primary_key']),
    detailNodes: readStringArray(item['detail_nodes']),
    unavailable,
  };`;

const newBase = `  const conflictCandidates = readConflictCandidates(item['service_conflicts']);
  const base = {
    typeKey,
    title: readString(item['title']) ?? typeKey,
    services: readServices(item['services']),
    primaryKey: readStringArray(item['primary_key']),
    detailNodes: readStringArray(item['detail_nodes']),
    unavailable,
    conflictCandidates: conflictCandidates.length > 0 ? conflictCandidates : undefined,
  };`;

if (!c.includes(oldBase)) {
  console.error('OLD BASE NOT FOUND');
  process.exit(1);
}
c = c.replace(oldBase, newBase);

writeFileSync('src/catalog/typekey-catalog.ts', c, 'utf8');
console.log('OK');
