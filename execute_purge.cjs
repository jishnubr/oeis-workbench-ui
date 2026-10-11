const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'drafts.db'));

// Protected Phase 4 IDs/A-numbers to safeguard
const protectedIds = [
  'JIS-151', 'JIS-200', 'JIS-204', 'JIS-205', 'JIS-206', 'JIS-209', 'JIS-MA12K',
  'JIS-211', 'JIS-221', 'JIS-223', 'JIS-224', 'JIS-229', 'JIS-230', 'JIS-245',
  'JIS-039', 'JIS-040', 'JIS-118', 'JIS-116', 'JIS-121', 'JIS-124',
  'JIS-012', 'JIS-014', 'JIS-082', 'JIS-090', 'JIS-091', 'JIS-092', 'JIS-110', 'JIS-111',
  'JIS-131', 'JIS-132B'
];

const protectedAs = [
  'A398329', 'A397646', 'A396961', 'A398609', 'A399578',
  'A398553', 'A398607', 'A399611', 'A399851', 'A400544', 'A398347',
  'A397811', 'A399303', 'A398816',
  'A400791', 'A400585', 'A353196', 'A400564'
];

const purge = db.transaction(() => {
  // Phase 1: Classic Hijacked Sequences
  const phase1 = [
    'A000041', 'A000217', 'A000292', 'A000332', 'A000389', 'A000579', 'A000580', 
    'A000581', 'A000582', 'A001287', 'A001399', 'A001400', 'A001401', 'A001402', 
    'A000601', 'A008619'
  ];
  const p1Stmt = db.prepare(`DELETE FROM drafts WHERE a_number IN (${phase1.map(a => `'${a}'`).join(',')}) OR internal_id IN (${phase1.map(a => `'${a}'`).join(',')})`);
  const r1 = p1Stmt.run();

  // Phase 2a: Subsumed Missing Teeth (JIS-152 to JIS-185)
  const p2aStmt = db.prepare(`DELETE FROM drafts WHERE internal_id >= 'JIS-152' AND internal_id <= 'JIS-185'`);
  const r2a = p2aStmt.run();

  // Phase 2b: Isolated Denominators
  const p2bStmt = db.prepare(`
    DELETE FROM drafts 
    WHERE a_number LIKE 'A025%' OR a_number LIKE 'A029%' 
       OR a_number LIKE 'A0086%' OR a_number LIKE 'A0087%' 
       OR a_number LIKE 'A0109%'
  `);
  const r2b = p2bStmt.run();

  // Phase 3: Periodic Binary Artifacts
  const phase3 = [
    'A000035', 'A011765', 'A079978', 'A079998', 'A082784', 'A121262', 'A253513', 
    'A267142', 'A022003', 'A059841', 'A110654', 'A115790', 'A142150', 'A215036', 
    'A374134', 'A374136'
  ];
  const p3Stmt = db.prepare(`DELETE FROM drafts WHERE a_number IN (${phase3.map(a => `'${a}'`).join(',')}) OR internal_id IN (${phase3.map(a => `'${a}'`).join(',')})`);
  const r3 = p3Stmt.run();

  // Legacy Domain-Irrelevant Items (protecting any Phase 4 candidates)
  const p4Stmt = db.prepare(`
    DELETE FROM drafts 
    WHERE pipeline_status = 'Domain-Irrelevant'
      AND internal_id NOT IN (${protectedIds.map(id => `'${id}'`).join(',')})
      AND (a_number IS NULL OR a_number NOT IN (${protectedAs.map(a => `'${a}'`).join(',')}))
  `);
  const r4 = p4Stmt.run();

  return {
    phase1: r1.changes,
    phase2a: r2a.changes,
    phase2b: r2b.changes,
    phase3: r3.changes,
    domainIrrelevant: r4.changes,
    total: r1.changes + r2a.changes + r2b.changes + r3.changes + r4.changes
  };
});

try {
  const result = purge();
  console.log('Purge executed successfully!');
  console.log(`  Phase 1 (Classic Hijacked): ${result.phase1}`);
  console.log(`  Phase 2a (Subsumed Missing Teeth JIS-152..185): ${result.phase2a}`);
  console.log(`  Phase 2b (Isolated Fractions): ${result.phase2b}`);
  console.log(`  Phase 3 (Periodic Binary Artifacts): ${result.phase3}`);
  console.log(`  Legacy Domain-Irrelevant: ${result.domainIrrelevant}`);
  console.log(`\nTotal rows purged: ${result.total}`);

  const remaining = db.prepare('SELECT COUNT(*) as cnt FROM drafts').get().cnt;
  console.log(`Total remaining high-signal drafts in drafts.db: ${remaining}`);
} catch (err) {
  console.error('Error executing purge:', err);
  process.exit(1);
} finally {
  db.close();
}
