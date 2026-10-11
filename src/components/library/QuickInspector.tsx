import { useState } from 'react';
import { Edit2, Trash2, Copy, Download, CheckCircle2, FileText, Wrench } from 'lucide-react';
import { deleteDraft, patchDraft } from '../../api/drafts';
import { oeisFormatter } from '../../utils/oeisFormatter';

const PIPELINE_STATUSES = [
  'Newly Imported', 'Awaiting Classification',
  'Domain-Relevant', 'Domain-Irrelevant',
  'B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req',
  'Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress',
  'Ready for Internal Review', 'Ready for OEIS',
  'Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived',
  'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected',
];

function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) { try { return JSON.parse(t).filter(Boolean); } catch { /* fall through */ } }
    return t.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Published':          return 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50';
    case 'Ready for OEIS':     return 'bg-green-900/40 text-green-400 border-green-700/50';
    case 'Heroic Edit':        return 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50';
    case 'Research Candidate': return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
    case 'Needs Maintenance':
    case 'Manual Review Req':  return 'bg-orange-900/40 text-orange-300 border-orange-700/50';
    case 'Rejected':           return 'bg-rose-900/40 text-rose-400 border-rose-700/50';
    default:                   return 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
  }
}

interface QuickInspectorProps {
  draft: any | null;
  onEdit: (id: string) => void;
  onRefresh: () => void;
  onOpenExport: (draft: any) => void;
}

export default function QuickInspector({ draft, onEdit, onRefresh, onOpenExport }: QuickInspectorProps) {
  const [copiedOeis, setCopiedOeis] = useState(false);

  if (!draft) {
    return (
      <div className="w-full h-full border-l border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center gap-3 text-center p-6">
        <FileText className="w-12 h-12 text-neutral-700 stroke-1" />
        <p className="text-sm font-semibold text-neutral-300">No Sequence Selected</p>
        <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
          Click any row in the table to inspect metadata, edit details, or run exports.
        </p>
      </div>
    );
  }

  const tags = parseTags(draft.tags);
  const termPreview = draft.terms ? draft.terms.split(',').slice(0, 15).join(', ') : '';
  const updatedAt = draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : 'â€”';

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${draft.internal_id}? This cannot be undone.`)) return;
    await deleteDraft(draft.internal_id);
    onRefresh();
  };

  const handleCopyOeis = () => {
    navigator.clipboard.writeText(oeisFormatter(draft));
    setCopiedOeis(true);
    setTimeout(() => setCopiedOeis(false), 2000);
  };

  const handleDownloadJson = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draft, null, 2));
    a.download = `${draft.internal_id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleStatusChange = async (newStatus: string) => {
    await patchDraft(draft.internal_id, { pipeline_status: newStatus });
    onRefresh();
  };

  return (
    <div className="w-full h-full border-l border-neutral-800 bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden">

      {/* â”€â”€ STICKY TOP: ID + Status + Actions (ALWAYS VISIBLE) â”€â”€ */}
      <div className="shrink-0 p-4 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur space-y-3">

        {/* Row 1: ID badge + A-number + inline status dropdown */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 truncate max-w-[110px]">
              {draft.internal_id}
            </span>
            {draft.a_number && (
              <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 shrink-0">
                {draft.a_number}
              </span>
            )}
          </div>

          {/* Inline pipeline status dropdown */}
          <select
            value={draft.pipeline_status || 'Draft in Progress'}
            onChange={e => handleStatusChange(e.target.value)}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full border outline-none cursor-pointer shrink-0 ${statusBadgeClass(draft.pipeline_status)}`}
          >
            {PIPELINE_STATUSES.map(s => (
              <option key={s} value={s} className="bg-neutral-900 text-neutral-200">{s}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Primary CTA â€” Edit + Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(draft.internal_id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-950/40 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Draft
          </button>

          <button
            onClick={handleDelete}
            title="Delete this draft permanently"
            className="flex items-center justify-center p-2 text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 3: Quick utility buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={handleCopyOeis}
            title="Copy raw OEIS format to clipboard"
            className="flex items-center justify-center gap-1 py-1.5 px-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
          >
            {copiedOeis
              ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              : <Copy className="w-3 h-3 shrink-0" />}
            <span className="truncate">{copiedOeis ? 'Copied' : 'OEIS'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            title="Download draft as JSON"
            className="flex items-center justify-center gap-1 py-1.5 px-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 shrink-0" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => onOpenExport(draft)}
            title="Open Export Modal"
            className="flex items-center justify-center gap-1 py-1.5 px-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span>Export</span>
          </button>

          {draft.pipeline_status !== 'Ready for OEIS' ? (
            <button
              onClick={() => handleStatusChange('Ready for OEIS')}
              title="Mark as Ready for OEIS"
              className="flex items-center justify-center gap-1 py-1.5 px-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-semibold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Ready</span>
            </button>
          ) : (
            <span className="flex items-center justify-center py-1.5 px-1 bg-emerald-900/30 text-emerald-400 rounded text-[10px] font-bold">
              âœ“ Queued
            </span>
          )}
        </div>
      </div>

      {/* â”€â”€ SCROLLABLE METADATA â”€â”€ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Maintenance alert */}
        {draft.pipeline_status === 'Needs Maintenance' && draft.maintenance_notes && (
          <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg">
            <h4 className="text-xs font-bold text-rose-400 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Required Maintenance Action
            </h4>
            <p className="text-xs text-rose-200 leading-relaxed font-mono">{draft.maintenance_notes}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">%N Title</span>
          <p className="text-sm font-semibold text-neutral-100 leading-snug">
            {draft.title || <span className="text-neutral-500 italic">Untitled Sequence</span>}
          </p>
        </div>

        {/* Formula */}
        {draft.formula && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">%F Formula</span>
            <p className="font-mono text-[11px] bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-indigo-300 break-all leading-relaxed">
              {draft.formula}
            </p>
          </div>
        )}

        {/* Terms */}
        {termPreview && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">%S Terms</span>
            <p className="font-mono text-[11px] bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-neutral-300 break-all leading-relaxed">
              {termPreview}{draft.terms.split(',').length > 15 ? ', â€¦' : ''}
            </p>
          </div>
        )}

        {/* Research Notes & DNA */}
        {draft.research_notes && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">Research Notes & DNA</span>
            <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-neutral-300 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
              {draft.research_notes}
            </div>
          </div>
        )}

        {/* Comments */}
        {draft.comments && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">%C Comments</span>
            <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-neutral-300 text-[11px] leading-relaxed whitespace-pre-wrap">
              {typeof draft.comments === 'string' ? draft.comments : JSON.stringify(draft.comments, null, 2)}
            </div>
          </div>
        )}

        {/* Keywords */}
        {draft.keywords && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">%K Keywords</span>
            <p className="text-[11px] text-neutral-400 font-mono">{draft.keywords}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">Tags</span>
            <div className="flex flex-wrap gap-1">
              {tags.map((t: string) => (
                <span key={t} className="font-mono text-[10px] bg-neutral-800 border border-neutral-700/50 text-neutral-400 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata footer */}
        <div className="pt-3 border-t border-neutral-800 text-[10px] text-neutral-600 space-y-1">
          <p>Updated: {updatedAt}</p>
          {draft.b_file_content && (
            <p>B-file: {draft.b_file_content.trim().split('\n').filter(Boolean).length} lines</p>
          )}
        </div>
      </div>
    </div>
  );
}

