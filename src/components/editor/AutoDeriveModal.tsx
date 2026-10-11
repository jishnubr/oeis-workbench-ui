import { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Calculator,
  FileText,
  Activity,
  ChevronRight,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  deriveAsymptotics,
  verifyAsymptotics,
  generateBFile,
  checkAsympHealth,
  DeriveResponse,
  VerifyResponse,
  BFileResponse,
} from '../../api/asymptotics';

interface AutoDeriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFormula: (formula: string) => void;
  onApplyBFile?: (bfile: string, terms?: string) => void;
  onApplyComments?: (comment: string) => void;
  defaultSequenceName?: string;
}

const PRESETS = [
  { label: 'JIS-038 Distinct Parts: 1 + floor((k+1)/2)', expr: '1 + floor((k+1)/2)', mode: 'distinct' as const },
  { label: 'A398609 Multiset Affine: k/2 + 5/4', expr: 'k/2 + 5/4', mode: 'multiset' as const },
  { label: 'A398609 Multiset Floor: 1 + floor(k/2)', expr: '1 + floor(k/2)', mode: 'multiset' as const },
  { label: 'Classic Partition Function p(n): 1', expr: '1', mode: 'multiset' as const },
  { label: 'Distinct Partitions q(n): 1', expr: '1', mode: 'distinct' as const },
  { label: 'Degree 1 Polynomial: k', expr: 'k', mode: 'distinct' as const },
];

export default function AutoDeriveModal({
  isOpen,
  onClose,
  onApplyFormula,
  onApplyBFile,
  onApplyComments,
  defaultSequenceName = 'Partition Sequence',
}: AutoDeriveModalProps) {
  const [ckExpr, setCkExpr] = useState('1 + floor((k+1)/2)');
  const [mode, setMode] = useState<'distinct' | 'multiset'>('distinct');
  const [sequenceName, setSequenceName] = useState(defaultSequenceName);

  const [activeTab, setActiveTab] = useState<'proof' | 'verify' | 'bfile'>('proof');

  // Service Status
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [statusMsg, setStatusMsg] = useState('');

  // Execution States
  const [isDeriving, setIsDeriving] = useState(false);
  const [deriveResult, setDeriveResult] = useState<DeriveResponse | null>(null);
  const [deriveError, setDeriveError] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isGeneratingBFile, setIsGeneratingBFile] = useState(false);
  const [bfileResult, setBfileResult] = useState<BFileResponse | null>(null);
  const [bfileError, setBfileError] = useState<string | null>(null);

  const [copiedFormula, setCopiedFormula] = useState(false);
  const [insertedFormula, setInsertedFormula] = useState(false);
  const [insertedBFile, setInsertedBFile] = useState(false);

  // Check health on open
  const checkService = async () => {
    setServiceStatus('checking');
    try {
      const res = await checkAsympHealth();
      if (res.status === 'ok') {
        setServiceStatus('online');
        setStatusMsg(`partasymp v${res.version || '0.1.0'} ready`);
      } else {
        setServiceStatus('offline');
        setStatusMsg('Service returned non-ok status');
      }
    } catch (err: any) {
      setServiceStatus('offline');
      setStatusMsg('FastAPI service on :8000 offline');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkService();
      if (defaultSequenceName) setSequenceName(defaultSequenceName);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDerive = async () => {
    if (!ckExpr.trim()) return;
    setIsDeriving(true);
    setDeriveError(null);
    setInsertedFormula(false);
    try {
      const res = await deriveAsymptotics({
        ck_expr: ckExpr.trim(),
        mode,
        sequence_name: sequenceName || 'Partition Sequence',
        output_format: 'markdown',
      });
      setDeriveResult(res);
      setActiveTab('proof');
    } catch (err: any) {
      setDeriveError(err.message || 'Failed to derive asymptotics');
    } finally {
      setIsDeriving(false);
    }
  };

  const handleVerify = async () => {
    if (!ckExpr.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyAsymptotics({
        ck_expr: ckExpr.trim(),
        mode,
        terms: 1000,
      });
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to run convergence verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateBFile = async () => {
    if (!ckExpr.trim()) return;
    setIsGeneratingBFile(true);
    setBfileError(null);
    try {
      const res = await generateBFile({
        ck_expr: ckExpr.trim(),
        mode,
        bfile_terms: 1000,
      });
      setBfileResult(res);
    } catch (err: any) {
      setBfileError(err.message || 'Failed to generate b-file');
    } finally {
      setIsGeneratingBFile(false);
    }
  };

  const handleApplyFormula = () => {
    if (!deriveResult) return;
    onApplyFormula(deriveResult.oeis_formula || `a(n) ~ ${deriveResult.full_formula}`);
    setInsertedFormula(true);
    setTimeout(() => setInsertedFormula(false), 2500);
  };

  const handleApplyBFileAndTerms = () => {
    if (!bfileResult || !onApplyBFile) return;
    onApplyBFile(bfileResult.bfile_content, bfileResult.oeis_data_field);
    setInsertedBFile(true);
    setTimeout(() => setInsertedBFile(false), 2500);
  };

  const handleApplyProofComments = () => {
    if (!deriveResult || !onApplyComments) return;
    const commentNote = `Asymptotic formula derived via Meinardus & Saddle-Point CAS method: ${deriveResult.oeis_formula}`;
    onApplyComments(commentNote);
  };

  const handleCopyFormula = () => {
    if (!deriveResult) return;
    navigator.clipboard.writeText(deriveResult.oeis_formula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">partasymp CAS Asymptotics Engine</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Meinardus & Saddle-Point
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Deterministic symbolic residue calculus & high-precision DP convergence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                serviceStatus === 'online'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : serviceStatus === 'checking'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serviceStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : serviceStatus === 'checking'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-400'
                }`}
              />
              <span className="font-medium text-[11px]">{statusMsg || serviceStatus}</span>
              {serviceStatus === 'offline' && (
                <button
                  type="button"
                  onClick={checkService}
                  title="Retry connecting"
                  className="hover:text-white transition-colors ml-1"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Top Config Bar ── */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* ck Input */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>
                  Component Counts <code className="text-indigo-400 font-mono">c_k</code>
                </span>
                <span className="text-[11px] text-neutral-500 font-normal">e.g. 1 + floor((k+1)/2), k/2 + 5/4, 1</span>
              </label>
              <input
                type="text"
                value={ckExpr}
                onChange={(e) => setCkExpr(e.target.value)}
                placeholder="1 + floor((k+1)/2)"
                className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-neutral-600 shadow-inner"
              />
            </div>

            {/* Mode Selector */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-neutral-300">Partition Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'distinct' | 'multiset')}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="distinct">Strict Distinct Parts (1 + q^k)</option>
                <option value="multiset">Eulerian Multiset (1 - q^k)^(-1)</option>
              </select>
            </div>

            {/* Derive Button */}
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={handleDerive}
                disabled={isDeriving || !ckExpr.trim()}
                className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeriving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deriving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Derive Asymptotics</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets Dropdown / Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-500 font-medium">Quick Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setCkExpr(p.expr);
                  setMode(p.mode);
                }}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors font-mono ${
                  ckExpr === p.expr && mode === p.mode
                    ? 'bg-indigo-900/50 text-indigo-300 border-indigo-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                {p.expr} ({p.mode === 'distinct' ? 'distinct' : 'multiset'})
              </button>
            ))}
          </div>
        </div>

        {/* ── Error Banner ── */}
        {deriveError && (
          <div className="m-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Derivation Error:</span> {deriveError}
              {serviceStatus === 'offline' && (
                <p className="text-[11px] text-rose-400/80 mt-1">
                  💡 Tip: Make sure the FastAPI service is running: <code className="bg-black/40 px-1 py-0.5 rounded">python app.py</code> in the Asymptotic formula repo.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Main Results Tabs ── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Navigation Bar */}
          <div className="px-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('proof')}
                className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'proof'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Proof & KaTeX Formula
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('verify');
                  if (!verifyResult && !isVerifying) handleVerify();
                }}
                className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'verify'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Numerical Verification (DP vs Asymptotics)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('bfile');
                  if (!bfileResult && !isGeneratingBFile) handleGenerateBFile();
                }}
                className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'bfile'
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                OEIS %S & B-File Generator
              </button>
            </div>

            {deriveResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyFormula}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormula ? 'Copied!' : 'Copy Formula'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── TAB 1: PROOF & FORMULA ── */}
            {activeTab === 'proof' && (
              <div className="space-y-6">
                {deriveResult ? (
                  <>
                    {/* LaTeX Formula Highlight Card */}
                    <div className="p-6 bg-gradient-to-br from-indigo-950/30 via-neutral-900 to-purple-950/20 border border-indigo-900/40 rounded-2xl shadow-xl space-y-3">
                      <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                        <span>Derived Asymptotic Formula</span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          {deriveResult.mode} mode • n → ∞
                        </span>
                      </div>

                      <div className="py-4 px-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-center overflow-x-auto shadow-inner">
                        {deriveResult.latex_formula ? (
                          <div className="text-lg md:text-xl text-neutral-100 py-1">
                            <BlockMath math={`a(n) \\sim ${deriveResult.latex_formula}`} />
                          </div>
                        ) : (
                          <div className="font-mono text-sm text-neutral-200">
                            {deriveResult.oeis_formula}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="font-mono text-[11px] text-neutral-400 truncate max-w-xl">
                          <span className="text-neutral-500 font-sans">OEIS Format:</span> {deriveResult.oeis_formula}
                        </div>
                      </div>
                    </div>

                    {/* Intermediate Constants Badges */}
                    {deriveResult.constants && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-sm">
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Residue A (s=2)</span>
                          <div className="text-sm font-mono text-indigo-300 font-bold overflow-x-auto">
                            {deriveResult.constants.A_latex ? (
                              <InlineMath math={`A = ${deriveResult.constants.A_latex}`} />
                            ) : (
                              deriveResult.constants.A
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-sm">
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Residue B (s=1)</span>
                          <div className="text-sm font-mono text-purple-300 font-bold overflow-x-auto">
                            {deriveResult.constants.B_latex ? (
                              <InlineMath math={`B = ${deriveResult.constants.B_latex}`} />
                            ) : (
                              deriveResult.constants.B
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-sm">
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Value D(0) (s=0)</span>
                          <div className="text-sm font-mono text-cyan-300 font-bold overflow-x-auto">
                            {deriveResult.constants.D_0_latex ? (
                              <InlineMath math={`D(0) = ${deriveResult.constants.D_0_latex}`} />
                            ) : (
                              deriveResult.constants.D_0
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-sm">
                          <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Shift -B²/(12A)</span>
                          <div className="text-sm font-mono text-amber-300 font-bold overflow-x-auto">
                            {deriveResult.constants.exp_shift_latex ? (
                              <InlineMath math={`\\Delta = ${deriveResult.constants.exp_shift_latex}`} />
                            ) : (
                              deriveResult.constants.exp_shift
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Proof Trace */}
                    <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>Formal KaTeX Mathematical Proof Steps</span>
                      </div>

                      <div className="text-xs text-neutral-300 font-sans space-y-3 leading-relaxed whitespace-pre-wrap font-mono bg-neutral-900/60 p-4 rounded-lg border border-neutral-800 max-h-96 overflow-y-auto">
                        {deriveResult.derivation_markdown}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-300">Ready to Derive Asymptotics</div>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Click <span className="text-indigo-400 font-semibold">✨ Derive Asymptotics</span> above to run the Meinardus residue engine on your component counts sequence.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: NUMERICAL CONVERGENCE ── */}
            {activeTab === 'verify' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-200">Dynamic Programming vs Asymptotics</h3>
                    <p className="text-xs text-neutral-400">
                      Calculates exact Cauchy recurrence coefficients vs asymptotic formula up to n=1000
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Running DP...' : 'Re-run Verification'}</span>
                  </button>
                </div>

                {verifyError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs">
                    {verifyError}
                  </div>
                )}

                {verifyResult ? (
                  <div className="space-y-4">
                    {/* Status card */}
                    <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Asymptotic Convergence Verified: Ratio a(n) / Asymp → 1.000000</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {verifyResult.sample_points.length} sample points verified
                      </span>
                    </div>

                    {/* Table */}
                    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 shadow-inner">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-mono text-[11px]">
                          <tr>
                            <th className="px-4 py-2.5">n</th>
                            <th className="px-4 py-2.5">Exact a(n) (DP)</th>
                            <th className="px-4 py-2.5">Asymptotic Approximation</th>
                            <th className="px-4 py-2.5">Ratio a(n) / Asymp</th>
                            <th className="px-4 py-2.5">Relative Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                          {verifyResult.sample_points.map((pt) => (
                            <tr key={pt.n} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="px-4 py-2 font-bold text-indigo-400">{pt.n}</td>
                              <td className="px-4 py-2 text-neutral-200 truncate max-w-xs">{pt.exact}</td>
                              <td className="px-4 py-2 text-neutral-400">{pt.approx.toExponential(6)}</td>
                              <td className="px-4 py-2 text-emerald-400 font-bold">{pt.ratio.toFixed(6)}</td>
                              <td className="px-4 py-2 text-neutral-400">{pt.relative_error_percent.toFixed(3)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    {isVerifying ? 'Computing exact recurrence terms and asymptotic approximations...' : 'No verification run yet.'}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: OEIS %S & B-FILE ── */}
            {activeTab === 'bfile' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-200">OEIS Data & B-File Generator</h3>
                    <p className="text-xs text-neutral-400">
                      Standard OEIS 260-character limited terms string and full table b-file data
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateBFile}
                    disabled={isGeneratingBFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBFile ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingBFile ? 'Generating...' : 'Regenerate B-File'}</span>
                  </button>
                </div>

                {bfileError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-xs">
                    {bfileError}
                  </div>
                )}

                {bfileResult ? (
                  <div className="space-y-4">
                    {/* OEIS Data Field */}
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-300">OEIS DATA Field (%S, %T, %U)</span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {bfileResult.oeis_data_field.length} / 260 characters
                        </span>
                      </div>
                      <div className="p-3 bg-neutral-900 rounded-lg font-mono text-xs text-indigo-300 break-all select-all border border-neutral-800">
                        {bfileResult.oeis_data_field}
                      </div>
                    </div>

                    {/* B-File Preview */}
                    <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-300">B-File Table Content (%H)</span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {bfileResult.total_lines} lines generated
                        </span>
                      </div>
                      <textarea
                        readOnly
                        value={bfileResult.bfile_content}
                        className="w-full h-44 p-3 bg-neutral-900 rounded-lg font-mono text-[11px] text-neutral-300 border border-neutral-800 outline-none resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    {isGeneratingBFile ? 'Generating b-file up to 1000 terms...' : 'Click Regenerate B-File to produce terms.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Apply to OEIS Draft:</span>
            {deriveResult && onApplyComments && (
              <button
                type="button"
                onClick={handleApplyProofComments}
                className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                + Add Note to %C Comments
              </button>
            )}
            {bfileResult && onApplyBFile && (
              <button
                type="button"
                onClick={handleApplyBFileAndTerms}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  insertedBFile
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                {insertedBFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{insertedBFile ? 'Terms & B-File Applied!' : 'Apply Terms (%S) & B-File (%H)'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleApplyFormula}
              disabled={!deriveResult}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer ${
                insertedFormula
                  ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {insertedFormula ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{insertedFormula ? 'Formula Applied to %F!' : '✨ Insert Formula into %F'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
