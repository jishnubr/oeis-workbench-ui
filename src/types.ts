export interface DraftItem {
  internal_id: string;
  a_number?: string;
  title: string;
  terms: string;
  offset?: string;
  formula?: string;
  comments?: string | string[];
  references_doc?: string;
  links?: string;
  examples?: string;
  maple_code?: string;
  mathematica_code?: string;
  pari_code?: string;
  program_code?: string;
  b_file_content?: string;
  crossrefs?: string | string[];
  keywords?: string;
  author?: string;
  extensions?: string;
  tags?: string | string[];
  pipeline_status?: string;
  maintenance_notes?: string;
  priority_order?: number;
  updated_at?: string;
  matrix_confidence_score?: string | number;
  validation_log?: string;

  // ── Research & Paper Drafting (Local-Only) ──
  theorem_latex?: string;
  proof_latex?: string;
  paper_section?: string;
  research_notes?: string;
}
