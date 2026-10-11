const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'drafts.db'), { readonly: true });

try {
  const allRows = db.prepare('SELECT internal_id, a_number, title, pipeline_status FROM drafts').all();
  console.log(`Total rows in drafts.db: ${allRows.length}`);

  // Protected IDs / A-numbers from Phase 4
  const protectedInternalIds = new Set([
    'JIS-151', 'JIS-200', 'JIS-204', 'JIS-205', 'JIS-206', 'JIS-209', 'JIS-MA12K',
    'JIS-211', 'JIS-221', 'JIS-223', 'JIS-224', 'JIS-229', 'JIS-230', 'JIS-245',
    'JIS-039', 'JIS-040', 'JIS-118', 'JIS-116', 'JIS-121', 'JIS-124',
    'JIS-012', 'JIS-014', 'JIS-082', 'JIS-090', 'JIS-091', 'JIS-092', 'JIS-110', 'JIS-111',
    'JIS-132B'
  ]);

  const protectedANumbers = new Set([
    'A398329', 'A397646', 'A396961', 'A398609', 'A399578',
    'A398553', 'A398607', 'A399611', 'A399851', 'A400544', 'A398347',
    'A397811', 'A399303', 'A398816',
    'A400791', 'A400585', 'A353196', 'A400564'
  ]);

  // Phase 1: Classic hijacked sequences
  const phase1List = [
    'A000041', 'A000217', 'A000292', 'A000332', 'A000389', 'A000579', 'A000580',
    'A000581', 'A000582', 'A001287', 'A001399', 'A001400', 'A001401', 'A001402',
    'A000601', 'A008619'
  ];
  const phase1Set = new Set(phase1List);

  // Phase 3: Periodic binaries
  const phase3List = [
    'A000035', 'A011765', 'A079978', 'A079998', 'A082784', 'A121262', 'A253513',
    'A267142', 'A022003', 'A059841', 'A110654', 'A115790', 'A142150', 'A215036',
    'A374134', 'A374136'
  ];
  const phase3Set = new Set(phase3List);

  const toDeleteP1 = [];
  const toDeleteP2_MissingTeeth = [];
  const toDeleteP2_IsolatedFractions = [];
  const toDeleteP3_Periodic = [];
  const protectedRetained = [];
  const otherRetained = [];

  for (const row of allRows) {
    const id = row.internal_id || '';
    const a = row.a_number || '';

    // Check if explicitly protected
    if (protectedInternalIds.has(id) || protectedANumbers.has(a)) {
      protectedRetained.push(row);
      continue;
    }

    // Phase 1 check
    if (phase1Set.has(id) || phase1Set.has(a)) {
      toDeleteP1.push(row);
      continue;
    }

    // Phase 3 check
    if (phase3Set.has(id) || phase3Set.has(a)) {
      toDeleteP3_Periodic.push(row);
      continue;
    }

    // Phase 2: Missing teeth JIS-152 through JIS-185
    if (/^JIS-(15[2-9]|16[0-9]|17[0-9]|18[0-5])$/.test(id)) {
      toDeleteP2_MissingTeeth.push(row);
      continue;
    }

    // Phase 2: Isolated fraction spam (A025xxx, A029xxx, A0086xx, A0087xx, A0109xx)
    if (/^A(025\d{3}|029\d{3}|0086\d{2}|0087\d{2}|0109\d{2})$/.test(a) ||
        /^A(025\d{3}|029\d{3}|0086\d{2}|0087\d{2}|0109\d{2})$/.test(id)) {
      toDeleteP2_IsolatedFractions.push(row);
      continue;
    }

    // Otherwise retained
    otherRetained.push(row);
  }

  console.log('\n--- DRY RUN PURGE RESULTS ---');
  console.log(`Phase 1 Targets (Classic Hijacked): ${toDeleteP1.length} to delete`);
  console.log(`Phase 2 Targets (JIS-152..JIS-185 Missing Teeth): ${toDeleteP2_MissingTeeth.length} to delete`);
  console.log(`Phase 2 Targets (Isolated Fractions A025, A029, A0086, A0087, A0109): ${toDeleteP2_IsolatedFractions.length} to delete`);
  console.log(`Phase 3 Targets (Periodic Binary Artifacts): ${toDeleteP3_Periodic.length} to delete`);
  
  const totalToDelete = toDeleteP1.length + toDeleteP2_MissingTeeth.length + toDeleteP2_IsolatedFractions.length + toDeleteP3_Periodic.length;
  console.log(`\nTotal items flagged for DELETION: ${totalToDelete}`);
  console.log(`Core Phase 4 Protected items explicitly kept: ${protectedRetained.length}`);
  console.log(`Other items retained: ${otherRetained.length}`);
  console.log(`Total remaining after purge: ${protectedRetained.length + otherRetained.length} (out of ${allRows.length})`);

  // Let's inspect otherRetained by status
  const otherByStatus = {};
  for (const r of otherRetained) {
    const s = r.pipeline_status || 'null';
    otherByStatus[s] = (otherByStatus[s] || 0) + 1;
  }
  console.log('\nOther retained breakdown by pipeline_status:');
  console.log(otherByStatus);

  // Let's also check if there are Domain-Irrelevant items in otherRetained
  console.log(`\nDomain-Irrelevant count in otherRetained: ${otherByStatus['Domain-Irrelevant'] || 0}`);

} catch (err) {
  console.error(err);
} finally {
  db.close();
}
