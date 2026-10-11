const Database = require('better-sqlite3');
const db = new Database('./drafts.db');

const applyUpdates = db.transaction(() => {
  const cat1 = [
    ['JIS-132','A400544'],['JIS-133','A398347'],['JIS-122','A400585'],
    ['JIS-125','A400322'],['JIS-106','A399132'],['JIS-065','A398628'],
    ['JIS-085','A399923'],['JIS-086','A397804'],['JIS-003','A397811'],
    ['JIS-005','A398329'],['JIS-015','A398607'],['JIS-016','A399611'],
    ['JIS-024','A396961'],['JIS-035','A398390'],['JIS-037','A398609'],
    ['JIS-038','A399578'],['JIS-131','A399578'],['JIS-051','A399303'],
    ['JIS-101','A399851'],
  ];
  const s1 = db.prepare("UPDATE drafts SET a_number=?, pipeline_status='Published' WHERE internal_id=?");
  for(const [id,a] of cat1){ const r=s1.run(a,id); console.log('Cat1',id,a,'changes='+r.changes); }

  const cat2 = [
    ['JIS-063','A211534'],['JIS-064','A144677'],['JIS-068','A359473'],
    ['JIS-128','A005303'],['JIS-135','A005305'],['JIS-136','A005306'],
    ['JIS-123','A005308'],['JIS-225','A174026'],['JIS-226','A015590'],
    ['JIS-227','A177849'],
  ];
  const s2 = db.prepare("UPDATE drafts SET a_number=?, pipeline_status='Edit Existing' WHERE internal_id=?");
  for(const [id,a] of cat2){ const r=s2.run(a,id); console.log('Cat2',id,a,'changes='+r.changes); }

  const cat3 = [
    ['JIS-054','A219561'],['JIS-060','A325989'],['JIS-083','A219554'],
    ['JIS-084','A219560'],['JIS-089','A006003'],['JIS-129','A213343'],
    ['JIS-217','A140354'],['JIS-218','A140354'],
  ];
  const s3 = db.prepare("UPDATE drafts SET a_number=?, pipeline_status='Domain-Irrelevant' WHERE internal_id=?");
  for(const [id,a] of cat3){ const r=s3.run(a,id); console.log('Cat3',id,a,'changes='+r.changes); }

  const ex = db.prepare("SELECT internal_id FROM drafts WHERE internal_id='JIS-132B' OR a_number='A400564'").get();
  if(!ex){
    db.prepare("INSERT INTO drafts (internal_id,a_number,title,pipeline_status) VALUES(?,?,?,?)")
      .run('JIS-132B','A400564','Number of S_3 orbits of nonneg integer vectors (x,y,z) having coordinate sum n','Published');
    console.log('INSERT JIS-132B done');
  } else { console.log('JIS-132B skip exists',JSON.stringify(ex)); }
});

try { applyUpdates(); console.log('ALL DONE OK'); } catch(e){ console.error('FAIL',e.message); process.exit(1); } finally { db.close(); }
