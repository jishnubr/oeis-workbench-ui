const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'drafts.db'), { readonly: true });

try {
  console.log('--- ALL HEROIC EDITS (37) ---');
  const heroic = db.prepare("SELECT internal_id, a_number, title FROM drafts WHERE pipeline_status = 'Heroic Edit'").all();
  heroic.forEach(h => console.log(`${h.internal_id} | ${h.a_number} | ${h.title?.slice(0, 60)}`));

  console.log('\n--- DOMAIN-IRRELEVANT STATUS SAMPLE (out of 893) ---');
  const domainIrr = db.prepare("SELECT internal_id, a_number, title FROM drafts WHERE pipeline_status = 'Domain-Irrelevant' LIMIT 10").all();
  domainIrr.forEach(d => console.log(`${d.internal_id} | ${d.a_number} | ${d.title?.slice(0, 60)}`));

  console.log('\n--- STATUS OF JIS-152 TO JIS-185 ---');
  const missingTeethStatuses = db.prepare("SELECT pipeline_status, COUNT(*) as cnt FROM drafts WHERE internal_id >= 'JIS-152' AND internal_id <= 'JIS-185' GROUP BY pipeline_status").all();
  missingTeethStatuses.forEach(s => console.log(`  ${s.pipeline_status || '(null)'}: ${s.cnt}`));

} catch (err) {
  console.error(err);
} finally {
  db.close();
}
