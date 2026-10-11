import { ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { patchDraft, updatePriority } from '../../api/drafts';

const PIPELINE_STATUSES = [
  'Newly Imported', 'Awaiting Classification',
  'Domain-Relevant', 'Domain-Irrelevant',
  'B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req',
  'Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress',
  'Ready for Internal Review', 'Ready for OEIS',
  'Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived',
  'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected',
];

function statusSelectClass(status: string) {
  switch (status) {
    case 'Newly Imported':           return 'bg-slate-900/40 text-slate-400';
    case 'Awaiting Classification':  return 'bg-amber-900/40 text-amber-300';
    case 'Domain-Relevant':          return 'bg-indigo-900/40 text-indigo-300';
    case 'Domain-Irrelevant':        return 'bg-neutral-900/40 text-neutral-500';
    case 'B-file Pending':
    case 'Matrix Pending':
    case 'Matrix Validation Pending':
    case 'Cross-Ref Pending':        return 'bg-blue-900/40 text-blue-300';
    case 'Manual Review Req':        return 'bg-orange-900/40 text-orange-300';
    case 'Research Candidate':       return 'bg-purple-900/40 text-purple-300';
    case 'False Positive':           return 'bg-rose-900/40 text-rose-400';
    case 'False Negative':           return 'bg-emerald-900/40 text-emerald-300';
    case 'Draft in Progress':        return 'bg-yellow-900/40 text-yellow-300';
    case 'Ready for Internal Review': return 'bg-orange-900/40 text-orange-300';
    case 'Ready for OEIS':           return 'bg-green-900/40 text-green-300';
    case 'Submitted':                return 'bg-blue-900/40 text-blue-300';
    case 'Accepted':                 return 'bg-purple-900/40 text-purple-300';
    case 'Published':                return 'bg-emerald-900/40 text-emerald-300';
    case 'Heroic Edit':              return 'bg-cyan-900/40 text-cyan-300';
    case 'Rejected':
    case 'Matrix Verification Failed': return 'bg-rose-900/40 text-rose-400';
    case 'Archived':                 return 'bg-neutral-800/40 text-neutral-500';
    case 'Matrix Verified':          return 'bg-green-900/40 text-green-300';
    case 'Row Mismatch Detected':
    case 'Column Mismatch Detected':
    case 'B-file Mismatch Detected': return 'bg-orange-900/40 text-orange-300';
    default:                         return 'bg-slate-900/40 text-slate-400';
  }
}

function extractDNA(draft: any): string | null {
  const notes = draft.research_notes || '';
  const match = notes.match(/\[\d+\^[^\]]+\]/);
  if (match) return match[0];
  const tagsStr = typeof draft.tags === 'string' ? draft.tags : JSON.stringify(draft.tags || '');
  const match2 = tagsStr.match(/\[\d+\^[^\]]+\]/);
  if (match2) return match2[0];
  return null;
}

export type SortKey = 'id' | 'title' | 'status' | 'none';
export type SortDir = 'asc' | 'desc';

interface DraftTableProps {
  drafts: any[];             // filtered list
  allDrafts: any[];          // unfiltered list (for priority swap)
  selectedId: string | null;
  onSelect: (id: string) => void;
  isOrderable: boolean;
  onRefresh: () => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 ml-1 text-blue-400 inline" />
    : <ChevronDown className="w-3 h-3 ml-1 text-blue-400 inline" />;
}

export default function DraftTable({ drafts, allDrafts, selectedId, onSelect, isOrderable, onRefresh, sortKey, sortDir, onSort }: DraftTableProps) {
  const updateStatus = async (id: string, newStatus: string) => {
    const draft = allDrafts.find(d => d.internal_id === id);
    if (!draft) return;
    await patchDraft(id, { pipeline_status: newStatus });
    onRefresh();
  };

  const movePriority = async (id: string, direction: 'up' | 'down') => {
    if (!isOrderable) return;
    const currentIndex = allDrafts.findIndex(d => d.internal_id === id);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      const swapWith = allDrafts[currentIndex - 1];
      await updatePriority(id, swapWith.priority_order ?? 0);
      await updatePriority(swapWith.internal_id, allDrafts[currentIndex].priority_order ?? 0);
      onRefresh();
    } else if (direction === 'down' && currentIndex < allDrafts.length - 1) {
      const swapWith = allDrafts[currentIndex + 1];
      await updatePriority(id, swapWith.priority_order ?? 0);
      await updatePriority(swapWith.internal_id, allDrafts[currentIndex].priority_order ?? 0);
      onRefresh();
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-neutral-900 sticky top-0 z-10 border-b border-neutral-800">
          <tr>
            <th className="py-2.5 px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider w-10"></th>
            <th
              className="py-2.5 px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-300 select-none"
              onClick={() => onSort('id')}
              title="Sort by ID"
            >
              ID <SortIcon col="id" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th
              className="py-2.5 px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-300 select-none"
              onClick={() => onSort('title')}
              title="Sort by Title"
            >
              Title <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">DNA Signature</th>
            <th
              className="py-2.5 px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-300 select-none"
              onClick={() => onSort('status')}
              title="Sort by Status"
            >
              Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/50">
          {drafts.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center text-neutral-600 text-sm">
                No sequences match your criteria.
              </td>
            </tr>
          ) : (
            drafts.map((draft, idx) => {
              const isSelected = draft.internal_id === selectedId;
              const idxInAll = allDrafts.findIndex(d => d.internal_id === draft.internal_id);
              return (
                <tr
                  key={draft.internal_id}
                  onClick={() => onSelect(draft.internal_id)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500'
                      : 'hover:bg-neutral-800/40 border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Priority Controls */}
                  <td className="py-2 px-3">
                    <div
                      className="flex flex-col items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={!isOrderable ? "Clear search and select 'All' to reorder" : 'Reorder priority'}
                    >
                      <button
                        disabled={!isOrderable || idxInAll === 0}
                        onClick={e => { e.stopPropagation(); movePriority(draft.internal_id, 'up'); }}
                        className="text-neutral-600 hover:text-blue-400 disabled:opacity-20 p-0.5 transition-colors"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={!isOrderable || idxInAll === allDrafts.length - 1}
                        onClick={e => { e.stopPropagation(); movePriority(draft.internal_id, 'down'); }}
                        className="text-neutral-600 hover:text-blue-400 disabled:opacity-20 p-0.5 transition-colors"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="py-2.5 px-3 font-mono text-xs font-medium whitespace-nowrap">
                    {draft.a_number ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-blue-400 font-bold">{draft.a_number}</span>
                        <span className="text-neutral-600">{draft.internal_id}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-300">{draft.internal_id}</span>
                    )}
                  </td>

                  {/* Title */}
                  <td className="py-2.5 px-3 text-sm text-neutral-300 truncate" title={draft.title}>
                    {draft.title || <span className="text-neutral-600 italic">Untitled Sequence</span>}
                  </td>

                  {/* DNA Signature */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {extractDNA(draft) ? (
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-700/50">
                        {extractDNA(draft)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-600">—</span>
                    )}
                  </td>

                  {/* Status — inline select, stop propagation */}
                  <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={draft.pipeline_status || 'Drafting'}
                      onChange={e => updateStatus(draft.internal_id, e.target.value)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer appearance-none focus:ring-1 focus:ring-blue-500 ${statusSelectClass(draft.pipeline_status)}`}
                    >
                      {PIPELINE_STATUSES.map(s => (
                        <option key={s} value={s} className="bg-neutral-900 text-neutral-200">{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
