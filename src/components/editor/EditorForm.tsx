import { useState } from 'react';
import { Save, ChevronDown, ChevronRight, X, Sparkles, BookOpen } from 'lucide-react';
import { BlockMath } from 'react-katex';
import AutoDeriveModal from './AutoDeriveModal';

interface EditorFormProps {
  formData: any;
  onChange: (e: any) => void;
  onAddKeyword: (kw: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

const PIPELINE_STATUSES = [
  'Newly Imported', 'Awaiting Classification',
  'Domain-Relevant', 'Domain-Irrelevant',
  'B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req',
  'Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress',
  'Ready for Internal Review', 'Ready for OEIS',
  'Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived',
  'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected',
];

function CollapsibleSection({ id, title, defaultOpen = true, children }: { id: string, title: string, defaultOpen?: boolean, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div id={id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden scroll-mt-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 bg-neutral-900 hover:bg-neutral-800/50 transition-colors border-b border-transparent data-[open=true]:border-neutral-800"
        data-open={isOpen}
      >
        <span className="font-bold text-sm text-neutral-200">{title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
      </button>
      {isOpen && (
        <div className="p-5 space-y-5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EditorForm({ formData, onChange, onAddKeyword, onSave, onClose, isSaving }: EditorFormProps) {
  const [isAsympModalOpen, setIsAsympModalOpen] = useState(false);
  const hasKeywordConflict = formData.keywords.includes('nonn') && formData.keywords.includes('sign');

  // ATOMIC API UPDATE: Instantly patch only the status in the database
  const handleAtomicStatusChange = async (e: any) => {
    const newStatus = e.target.value;

    // 1. Update UI state instantly
    onChange({ target: { name: 'pipeline_status', value: newStatus } });

    // 2. Fire atomic PATCH request to the API
    try {
      await fetch(`/api/drafts/${formData.internal_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: newStatus })
      });
    } catch (err) {
      console.error("Atomic update failed", err);
    }
  };

  const handleDownloadBFile = () => {
    if (!formData.b_file_content) return;
    const blob = new Blob([formData.b_file_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `b_${formData.a_number || formData.internal_id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col relative bg-neutral-950 text-neutral-200">
      <div className="flex-1 overflow-auto p-6 space-y-6 pb-24">
        
        {/* BASIC SECTION */}
        <CollapsibleSection id="section-basic" title="Basic Information">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Internal ID</label>
              <input name="internal_id" value={formData.internal_id} readOnly className="w-full px-3 py-1.5 border border-neutral-800 rounded-lg bg-neutral-900/50 text-neutral-500 font-mono text-xs outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Official OEIS A-Number (%I)</label>
              <input name="a_number" value={formData.a_number} onChange={onChange} placeholder="e.g., A398816" className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none uppercase placeholder-neutral-600" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Title (%N)</label>
            <input name="title" value={formData.title} onChange={onChange} placeholder="e.g., Number of partitions of n..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Terms (%S, %T, %U)</label>
            <textarea name="terms" value={formData.terms} onChange={onChange} placeholder="1, 2, 4, 8, 16, 32..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Offset (%O)</label>
            <input name="offset" value={formData.offset} onChange={onChange} placeholder="e.g., 0, 1" className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs placeholder-neutral-600" />
          </div>
        </CollapsibleSection>

        {/* MATH SECTION */}
        <CollapsibleSection id="section-math" title="Mathematics & Description">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-400">Formula (%F)</label>
              <button
                type="button"
                onClick={() => setIsAsympModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-700/60 hover:border-indigo-500 px-2.5 py-1 rounded-md transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>✨ Auto-Derive Asymptotics</span>
              </button>
            </div>
            <textarea name="formula" value={formData.formula} onChange={onChange} placeholder="a(n) = 2^n" className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Examples (%e)</label>
            <textarea name="examples" value={formData.examples} onChange={onChange} placeholder="e.g., a(2) = ..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Comments (%C) — One per line</label>
            <textarea name="comments" value={formData.comments} onChange={onChange} placeholder="Comments..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-24 text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600 leading-relaxed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">References (%D)</label>
            <textarea name="references_doc" value={formData.references_doc} onChange={onChange} placeholder="Books, Papers..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Links (%H)</label>
            <textarea name="links" value={formData.links} onChange={onChange} placeholder="URLs..." className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Cross-references (%Y)</label>
            <input name="crossrefs" value={formData.crossrefs} onChange={onChange} placeholder="A000045, A000079" className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs placeholder-neutral-600" />
          </div>
        </CollapsibleSection>

        {/* CODE SECTION */}
        <CollapsibleSection id="section-code" title="Programming">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Maple Program (%p)</label>
            <textarea name="maple_code" value={formData.maple_code} onChange={onChange} className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Mathematica Program (%t)</label>
            <textarea name="mathematica_code" value={formData.mathematica_code} onChange={onChange} className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">PARI/GP Program (%o PARI)</label>
            <textarea name="pari_code" value={formData.pari_code} onChange={onChange} className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-20 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Other Program Code (%o)</label>
            <textarea name="program_code" value={formData.program_code} onChange={onChange} placeholder="(Python) def a(n): return 1 << n" className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 h-24 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder-neutral-600" />
          </div>
        </CollapsibleSection>

        {/* RESEARCH PAPER SECTION (LOCAL ONLY) */}
        <CollapsibleSection id="section-research" title="Research Paper Draft & Proofs (Local Only)">
          <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-xs text-purple-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
            <span>These fields are stored locally for drafting your paper (<code>paper_main.tex</code>). They will <strong>never</strong> be included in OEIS exports.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Paper Section / Theorem Ref</label>
              <input
                name="paper_section"
                value={formData.paper_section || ''}
                onChange={onChange}
                placeholder="e.g., Section 4.3 (Theorem 15)"
                className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 text-xs focus:ring-1 focus:ring-purple-500 outline-none font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Temporary Findings & Scratchpad Notes</label>
              <textarea
                name="research_notes"
                value={formData.research_notes || ''}
                onChange={onChange}
                placeholder="Unverified conjectures, counterexamples, CAS verification logs..."
                className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 text-xs focus:ring-1 focus:ring-purple-500 outline-none min-h-[60px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Formal Theorem Statement (LaTeX)</label>
            <textarea
              name="theorem_latex"
              value={formData.theorem_latex || ''}
              onChange={onChange}
              placeholder="e.g., For N = (p_1 \dots p_k)^n, the divisor generating polynomial P_{\mathcal{D}(N)}(\mathbf{x}) \dots"
              className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 text-xs font-mono focus:ring-1 focus:ring-purple-500 outline-none h-24"
            />
            {formData.theorem_latex && (
              <div className="mt-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-100 text-xs overflow-x-auto">
                <span className="text-[10px] text-neutral-500 block mb-1 uppercase font-mono">Live KaTeX Theorem Preview:</span>
                <BlockMath math={formData.theorem_latex} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Rigorous Proof (LaTeX)</label>
            <textarea
              name="proof_latex"
              value={formData.proof_latex || ''}
              onChange={onChange}
              placeholder="Full formal proof with cyclotomic factorization steps, ideal relations, etc..."
              className="w-full px-3 py-2 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 text-xs font-mono focus:ring-1 focus:ring-purple-500 outline-none h-40 leading-relaxed"
            />
          </div>
        </CollapsibleSection>

        {/* ADMIN SECTION */}
        <CollapsibleSection id="section-admin" title="Administration & Metadata">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Keywords (%K)</label>
            <input
              name="keywords"
              value={formData.keywords}
              onChange={onChange}
              placeholder="nonn, easy, core"
              className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none bg-neutral-900 text-neutral-200 placeholder-neutral-600 ${
                hasKeywordConflict ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-neutral-700 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            {hasKeywordConflict && (
              <span className="text-[10px] text-red-400 font-bold mt-1 block">
                ⚠️ Error: You cannot use both "nonn" and "sign" together!
              </span>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[10px] text-neutral-500 font-medium py-0.5">Quick Add:</span>
              {['nonn', 'sign', 'easy', 'hard', 'core', 'nice', 'new', 'tabl', 'frac', 'look', 'uned'].map(kw => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onAddKeyword(kw)}
                  className="text-[10px] bg-neutral-800 hover:bg-blue-900/50 hover:text-blue-300 hover:border-blue-700/50 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700 transition-colors font-mono"
                >
                  +{kw}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Author (%A)</label>
              <input name="author" value={formData.author} onChange={onChange} className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Extensions (%E)</label>
              <input name="extensions" value={formData.extensions} onChange={onChange} className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-400">
                B-File Data (%H table data)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 font-mono">
                  {formData.b_file_content ? `${formData.b_file_content.trim().split('\n').filter(Boolean).length} lines` : '0 lines'}
                </span>
                {formData.b_file_content && (
                  <button
                    type="button"
                    onClick={handleDownloadBFile}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-800/50 rounded transition-colors"
                  >
                    ⬇️ Download b-file
                  </button>
                )}
              </div>
            </div>
            <textarea name="b_file_content" value={formData.b_file_content} onChange={onChange} placeholder={"0 1\n1 1\n2 2..."} className="w-full px-3 py-2 border border-neutral-700 rounded-lg h-24 font-mono text-[10px] focus:ring-1 focus:ring-blue-500 outline-none bg-neutral-900 text-neutral-300 placeholder-neutral-600" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Tags (Local Only)</label>
              <input name="tags" value={formData.tags} onChange={onChange} placeholder="core, nice" className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs placeholder-neutral-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Pipeline Status</label>
              <select name="pipeline_status" value={formData.pipeline_status} onChange={handleAtomicStatusChange} className="w-full px-3 py-1.5 border border-neutral-700 rounded-lg bg-neutral-900 text-neutral-200 focus:ring-1 focus:ring-blue-500 outline-none text-xs">
                {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {formData.pipeline_status === 'Needs Maintenance' && (
            <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-lg">
              <label className="block text-xs font-semibold text-rose-400 mb-1">
                Maintenance Notes / Tasks
              </label>
              <textarea
                name="maintenance_notes"
                value={formData.maintenance_notes || ''}
                onChange={onChange}
                placeholder="What needs to be updated on the OEIS site?"
                className="w-full px-3 py-2 border border-rose-800/50 rounded-lg bg-neutral-950 text-rose-200 text-xs focus:ring-1 focus:ring-rose-500 outline-none min-h-[60px]"
              />
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Floating Save/Close Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-neutral-900/80 backdrop-blur-md border border-neutral-700/50 rounded-xl shadow-2xl">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" /> Close
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      <AutoDeriveModal
        isOpen={isAsympModalOpen}
        onClose={() => setIsAsympModalOpen(false)}
        defaultSequenceName={formData.title || formData.a_number || formData.internal_id}
        onApplyFormula={(newFormula) => {
          const currentFormula = formData.formula ? formData.formula.trim() : '';
          const updated = currentFormula ? `${currentFormula}\n${newFormula}` : newFormula;
          onChange({ target: { name: 'formula', value: updated } });
        }}
        onApplyBFile={(bfile, terms) => {
          if (bfile) onChange({ target: { name: 'b_file_content', value: bfile } });
          if (terms) onChange({ target: { name: 'terms', value: terms } });
        }}
        onApplyComments={(comment) => {
          const currentComments = formData.comments ? formData.comments.trim() : '';
          const updated = currentComments ? `${currentComments}\n${comment}` : comment;
          onChange({ target: { name: 'comments', value: updated } });
        }}
      />
    </div>
  );
}
