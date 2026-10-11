import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3060;

  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // Ensure bfiles directory exists & static serving
  const bfilesDir = path.join(process.cwd(), 'bfiles');
  if (!fs.existsSync(bfilesDir)) {
    fs.mkdirSync(bfilesDir, { recursive: true });
  }
  app.use('/bfiles', express.static(bfilesDir));

  function syncBFileToDisk(internalId: string, content: string) {
    if (!internalId || !content) return;
    const cleanId = internalId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(bfilesDir, `b_${cleanId}.txt`);
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
      console.error(`Failed to write b-file for ${internalId}:`, err);
    }
  }

  // Database initialization
  const db = new Database(path.join(process.cwd(), 'drafts.db'));

  db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      internal_id TEXT PRIMARY KEY,
      a_number TEXT,
      title TEXT,
      terms TEXT,
      offset TEXT,
      formula TEXT,
      comments TEXT,
      references_doc TEXT,
      links TEXT,
      examples TEXT,
      maple_code TEXT,
      mathematica_code TEXT,
      pari_code TEXT,
      program_code TEXT,
      b_file_content TEXT,
      crossrefs TEXT,
      keywords TEXT,
      author TEXT,
      extensions TEXT,
      tags TEXT,
      pipeline_status TEXT,
      maintenance_notes TEXT,
      priority_order INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure all columns exist in drafts
  const columns = [
    'a_number', 'offset', 'references_doc', 'links', 'examples', 'maple_code',
    'mathematica_code', 'pari_code', 'b_file_content', 'keywords', 'author', 'extensions',
    'maintenance_notes', 'theorem_latex', 'proof_latex', 'paper_section', 'research_notes',
    'failure_reason', 'matrix_confidence_score', 'validation_log'
  ];
  for (const col of columns) {
    try {
      db.exec(`ALTER TABLE drafts ADD COLUMN ${col} TEXT`);
    } catch {
      // Column already exists
    }
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Reverse Proxy to Python partasymp FastAPI Microservice (:8000)
  app.all('/api/asymp/*all', async (req, res) => {
    const targetPath = (req.originalUrl || req.url).replace(/^\/api\/asymp/, '/api');
    const targetUrl = `http://127.0.0.1:8000${targetPath}`;
    try {
      const options: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        options.body = JSON.stringify(req.body);
      }
      const response = await fetch(targetUrl, options);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      console.error('partasymp microservice communication error:', err.message);
      res.status(503).json({
        error: `Failed to connect to partasymp microservice on port 8000 (${err.message}). Please start the Python service with 'python app.py' in the Asymptotic formula folder.`,
        service: 'partasymp',
        status: 'offline'
      });
    }
  });

  // 1. GET ALL DRAFTS
  app.get('/api/drafts', (req, res) => {
    try {
      const drafts = db.prepare('SELECT * FROM drafts ORDER BY priority_order ASC, updated_at DESC, internal_id ASC').all();
      res.json(drafts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. CREATE OR FULL UPDATE DRAFT
  app.post('/api/drafts', (req, res) => {
    try {
      const {
        internal_id, a_number, title, terms, offset, formula, comments, references_doc, links, examples,
        maple_code, mathematica_code, pari_code, program_code, b_file_content, crossrefs, keywords, author, extensions,
        tags, pipeline_status, maintenance_notes, priority_order,
        theorem_latex, proof_latex, paper_section, research_notes, failure_reason,
        matrix_confidence_score, validation_log
      } = req.body;

      const stmt = db.prepare(`
        INSERT INTO drafts (
          internal_id, a_number, title, terms, offset, formula, comments, references_doc, links,
          examples, maple_code, mathematica_code, pari_code, program_code, b_file_content, crossrefs, keywords,
          author, extensions, tags, pipeline_status, maintenance_notes, priority_order,
          theorem_latex, proof_latex, paper_section, research_notes, failure_reason,
          matrix_confidence_score, validation_log
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(internal_id) DO UPDATE SET
          a_number = excluded.a_number,
          title = excluded.title,
          terms = excluded.terms,
          offset = excluded.offset,
          formula = excluded.formula,
          comments = excluded.comments,
          references_doc = excluded.references_doc,
          links = excluded.links,
          examples = excluded.examples,
          maple_code = excluded.maple_code,
          mathematica_code = excluded.mathematica_code,
          pari_code = excluded.pari_code,
          program_code = excluded.program_code,
          b_file_content = excluded.b_file_content,
          crossrefs = excluded.crossrefs,
          keywords = excluded.keywords,
          author = excluded.author,
          extensions = excluded.extensions,
          tags = excluded.tags,
          pipeline_status = excluded.pipeline_status,
          maintenance_notes = excluded.maintenance_notes,
          priority_order = excluded.priority_order,
          theorem_latex = excluded.theorem_latex,
          proof_latex = excluded.proof_latex,
          paper_section = excluded.paper_section,
          research_notes = excluded.research_notes,
          failure_reason = excluded.failure_reason,
          matrix_confidence_score = excluded.matrix_confidence_score,
          validation_log = excluded.validation_log,
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        internal_id,
        a_number || '',
        title || '',
        terms || '',
        offset || '',
        formula || '',
        typeof comments === 'string' ? comments : JSON.stringify(comments || []),
        references_doc || '',
        links || '',
        examples || '',
        maple_code || '',
        mathematica_code || '',
        pari_code || '',
        program_code || '',
        b_file_content || '',
        typeof crossrefs === 'string' ? crossrefs : JSON.stringify(crossrefs || []),
        keywords || '',
        author || '',
        extensions || '',
        typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        pipeline_status || 'Drafting',
        maintenance_notes || '',
        priority_order || 0,
        theorem_latex || '',
        proof_latex || '',
        paper_section || '',
        research_notes || '',
        failure_reason || '',
        matrix_confidence_score || '',
        validation_log || ''
      );

      if (b_file_content) {
        syncBFileToDisk(internal_id, b_file_content);
      }

      res.json({ success: true, internal_id });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. PARTIAL UPDATE DRAFT
  app.patch('/api/drafts/:id', (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const allowedCols = [
        'a_number', 'title', 'terms', 'offset', 'formula', 'comments', 'references_doc', 'links',
        'examples', 'maple_code', 'mathematica_code', 'pari_code', 'program_code', 'b_file_content', 'crossrefs',
        'keywords', 'author', 'extensions', 'tags', 'pipeline_status', 'maintenance_notes', 'priority_order',
        'theorem_latex', 'proof_latex', 'paper_section', 'research_notes', 'failure_reason',
        'matrix_confidence_score', 'validation_log'
      ];

      const setClauses: string[] = [];
      const values: any[] = [];

      for (const [key, val] of Object.entries(updates)) {
        if (allowedCols.includes(key)) {
          setClauses.push(`${key} = ?`);
          if (['comments', 'crossrefs', 'tags'].includes(key) && Array.isArray(val)) {
            values.push(JSON.stringify(val));
          } else {
            values.push(val);
          }
        }
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid update fields provided' });
      }

      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id, id);

      const sql = `UPDATE drafts SET ${setClauses.join(', ')} WHERE internal_id = ? OR a_number = ?`;
      const result = db.prepare(sql).run(...values);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      if (updates.b_file_content) {
        syncBFileToDisk(id, updates.b_file_content);
      }

      res.json({ success: true, updated_fields: Object.keys(updates).filter(k => allowedCols.includes(k)) });
    } catch (error: any) {
      console.error('Error patching draft:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. BATCH PARTIAL UPDATE
  app.post('/api/drafts/batch-patch', (req, res) => {
    try {
      const patchList = req.body;
      if (!Array.isArray(patchList)) {
        return res.status(400).json({ error: 'Payload must be an array of patch objects' });
      }

      const allowedCols = [
        'a_number', 'title', 'terms', 'offset', 'formula', 'comments', 'references_doc', 'links',
        'examples', 'maple_code', 'mathematica_code', 'pari_code', 'program_code', 'b_file_content', 'crossrefs',
        'keywords', 'author', 'extensions', 'tags', 'pipeline_status', 'maintenance_notes', 'priority_order',
        'theorem_latex', 'proof_latex', 'paper_section', 'research_notes', 'failure_reason',
        'matrix_confidence_score', 'validation_log'
      ];

      const patchTx = db.transaction((items: any[]) => {
        let updatedCount = 0;
        for (const item of items) {
          const { internal_id, ...updates } = item;
          if (!internal_id) continue;

          const setClauses: string[] = [];
          const values: any[] = [];

          for (const [key, val] of Object.entries(updates)) {
            if (allowedCols.includes(key)) {
              setClauses.push(`${key} = ?`);
              if (['comments', 'crossrefs', 'tags'].includes(key) && Array.isArray(val)) {
                values.push(JSON.stringify(val));
              } else {
                values.push(val);
              }
            }
          }

          if (setClauses.length > 0) {
            setClauses.push('updated_at = CURRENT_TIMESTAMP');
            values.push(internal_id);
            const stmt = db.prepare(`UPDATE drafts SET ${setClauses.join(', ')} WHERE internal_id = ?`);
            const r = stmt.run(...values);
            if (r.changes > 0) updatedCount++;
          }
        }
        return updatedCount;
      });

      const totalUpdated = patchTx(patchList);
      res.json({ success: true, count: totalUpdated });
    } catch (error: any) {
      console.error('Error batch patching drafts:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. ADVANCED EXPORT
  app.post('/api/drafts/export', (req, res) => {
    try {
      const { statuses, fields } = req.body;

      if (!statuses || !Array.isArray(statuses) || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ error: 'Missing statuses or fields filter' });
      }

      // Build the status filter for SQL (e.g., " 'Ready for OEIS', 'Research Candidate' ")
      const statusList = statuses.map((s: string) => `'${s.replace(/'/g, "''")}'`).join(',');
      const statusFilter = statuses.length > 0 ? `AND pipeline_status IN (${statusList})` : '';

      // Fetch records matching the status filter
      const drafts = db.prepare(`SELECT * FROM drafts WHERE 1=1 ${statusFilter} ORDER BY priority_order ASC`).all();

      // Map the results to only include the selected fields (Horizontal Filtering)
      const filteredData = drafts.map((draft: any) => {
        const filteredItem: Record<string, any> = {};
        fields.forEach((field: string) => {
          if (field in draft) {
            filteredItem[field] = draft[field];
          }
        });
        return filteredItem;
      });

      res.json({ 
        success: true, 
        count: filteredData.length, 
        data: filteredData 
      });
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 6. DELETE DRAFT
  app.delete('/api/drafts/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM drafts WHERE internal_id = ?');
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. PRIORITY REORDER
  app.patch('/api/drafts/:id/priority', (req, res) => {
    try {
      const { priority_order } = req.body;
      if (priority_order === undefined || priority_order === null) {
        return res.status(400).json({ error: 'priority_order is required' });
      }
      const stmt = db.prepare(
        'UPDATE drafts SET priority_order = ?, updated_at = CURRENT_TIMESTAMP WHERE internal_id = ?'
      );
      const result = stmt.run(priority_order, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development vs Static serving for production vs API-only
  const isApiOnly = process.env.VITE_SSR !== 'true';
  if (isApiOnly) {
    console.log('[API] Running in standalone API-only mode (no Vite middleware overhead)');
  } else if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`OEIS Sequence Workbench running on http://localhost:${PORT}`);
    try {
      const resHealth = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      const healthData = await resHealth.json();
      console.log(`[SELF-TEST] /api/health -> Status ${resHealth.status}:`, JSON.stringify(healthData));

      const resDrafts = await fetch(`http://127.0.0.1:${PORT}/api/drafts`);
      const draftsData: any = await resDrafts.json();
      console.log(`[SELF-TEST] /api/drafts -> Status ${resDrafts.status}: Loaded ${Array.isArray(draftsData) ? draftsData.length : 0} drafts`);

      const resIndex = await fetch(`http://127.0.0.1:${PORT}/`);
      const htmlText = await resIndex.text();
      console.log(`[SELF-TEST] / (Frontend SPA) -> Status ${resIndex.status}: HTML length ${htmlText.length} bytes (contains <div id="root">: ${htmlText.includes('id="root"')})`);
    } catch (e: any) {
      console.error('SELF-TEST ERROR:', e.message);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
