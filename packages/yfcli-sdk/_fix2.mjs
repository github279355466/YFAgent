import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/catalog/typekey-catalog.ts', 'utf8');

// Insert conflictCandidates reading before "const base = {"
const marker = "  const reasonRaw = item['unavailable_reason'];\n  const base = {";
const replacement = "  const reasonRaw = item['unavailable_reason'];\n  const conflictCandidates = readConflictCandidates(item['service_conflicts']);\n  const base = {";

if (!c.includes(marker)) {
  console.error('MARKER NOT FOUND');
  process.exit(1);
}
c = c.replace(marker, replacement);

// Add conflictCandidates to the base object - insert after "unavailable,"
const baseEnd = "    unavailable,\n  };";
const baseEndNew = "    unavailable,\n    conflictCandidates: conflictCandidates.length > 0 ? conflictCandidates : undefined,\n  };";

if (!c.includes(baseEnd)) {
  console.error('BASE END NOT FOUND');
  process.exit(1);
}
c = c.replace(baseEnd, baseEndNew);

writeFileSync('src/catalog/typekey-catalog.ts', c, 'utf8');
console.log('OK');
