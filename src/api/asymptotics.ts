// Asymptotics CAS API client — connects to partasymp microservice via /api/asymp proxy or direct

const BASE = '/api/asymp';

export interface DeriveRequest {
  ck_expr: string;
  mode: 'distinct' | 'multiset';
  sequence_name?: string;
  output_format?: 'markdown' | 'json' | 'dict';
}

export interface AsympConstants {
  A: string;
  A_latex: string;
  B: string;
  B_latex: string;
  D_0: string;
  D_0_latex: string;
  leading_exp: string;
  leading_exp_latex: string;
  secondary_exp: string;
  secondary_exp_latex: string;
  exp_shift: string;
  exp_shift_latex: string;
  prefactor: string;
  prefactor_latex: string;
}

export interface DeriveResponse {
  success: boolean;
  ck_expr: string;
  mode: string;
  sequence_name: string;
  full_formula: string;
  latex_formula: string;
  oeis_formula: string;
  constants: AsympConstants;
  derivation_markdown: string;
  derivation_steps: any[];
  error?: string;
}

export interface VerifyRequest {
  ck_expr: string;
  mode: 'distinct' | 'multiset';
  terms?: number;
  sample_points?: number[];
}

export interface VerifySamplePoint {
  n: number;
  exact: string;
  approx: number;
  ratio: number;
  relative_error_percent: number;
}

export interface VerifyResponse {
  success: boolean;
  table_markdown: string;
  sample_points: VerifySamplePoint[];
  is_convergent: boolean;
  error?: string;
}

export interface BFileRequest {
  ck_expr: string;
  mode: 'distinct' | 'multiset';
  bfile_terms?: number;
  max_data_chars?: number;
}

export interface BFileResponse {
  success: boolean;
  bfile_content: string;
  oeis_data_field: string;
  total_lines: number;
  error?: string;
}

export async function checkAsympHealth(): Promise<{ status: string; service?: string; version?: string }> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error('Asymptotics microservice is unreachable');
  return res.json();
}

export async function deriveAsymptotics(req: DeriveRequest): Promise<DeriveResponse> {
  const res = await fetch(`${BASE}/derive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || errData.error || 'Failed to derive asymptotics');
  }
  return res.json();
}

export async function verifyAsymptotics(req: VerifyRequest): Promise<VerifyResponse> {
  const res = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || errData.error || 'Failed to verify asymptotics');
  }
  return res.json();
}

export async function generateBFile(req: BFileRequest): Promise<BFileResponse> {
  const res = await fetch(`${BASE}/bfile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || errData.error || 'Failed to generate b-file');
  }
  return res.json();
}
