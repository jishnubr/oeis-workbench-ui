import { useMemo, useState } from 'react';
import { Database, Hash, Tag } from 'lucide-react';

// Lifecycle Taxonomy — statuses grouped by research phase
const PIPELINE_PHASES: Record<string, string[]> = {
  'Entry': ['Newly Imported', 'Awaiting Classification'],
  'Triage': ['Domain-Relevant', 'Domain-Irrelevant'],
  'Validation': ['B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req'],
  'Analysis': ['Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress'],
  'Readiness': ['Ready for Internal Review', 'Ready for OEIS'],
  'Outcome': ['Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived', 'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected'],
};

const ALL_STATUSES = Object.values(PIPELINE_PHASES).flat();

const STATUS_ICONS: Record<string, string> = {
  'All': '∑',
  'Newly Imported': '📥',
  'Awaiting Classification': '⏳',
  'Domain-Relevant': '🎯',
  'Domain-Irrelevant': '⚪',
  'B-file Pending': '📄',
  'Matrix Pending': '📊',
  'Cross-Ref Pending': '🔗',
  'Manual Review Req': '⚠️',
  'Research Candidate': '🧪',
  'False Positive': '❌',
  'False Negative': '♻️',
  'Draft in Progress': '✏️',
  'Ready for Internal Review': '🔍',
  'Ready for OEIS': '✅',
  'Submitted': '📤',
  'Accepted': '🎉',
  'Published': '🌐',
  'Heroic Edit': '🦸',
  'Rejected': '🚫',
  'Archived': '📦',
  'Matrix Validation Pending': '⏳',
  'Matrix Verified': '✅',
  'Matrix Verification Failed': '❌',
  'Row Mismatch Detected': '⚠️',
  'Column Mismatch Detected': '⚠️',
  'B-file Mismatch Detected': '⚠️',
};

const PHASE_COLORS: Record<string, string> = {
  'Entry': 'text-slate-500',
  'Triage': 'text-indigo-500',
  'Validation': 'text-blue-500',
  'Analysis': 'text-purple-500',
  'Readiness': 'text-green-500',
  'Outcome': 'text-neutral-500',
};

interface StatusSidebarProps {
  drafts: any[];
  filterStatus: string;
  onFilterStatus: (s: string) => void;
  searchTerm: string;
  lastRefresh: Date;
}

function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[')) {
      try { return JSON.parse(t).filter(Boolean); } catch { /* fall through */ }
    }
    return t.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function StatusSidebar({ drafts, filterStatus, onFilterStatus, searchTerm, lastRefresh }: StatusSidebarProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    Entry: true, Triage: true, Validation: true, Analysis: true, Readiness: true, Outcome: true
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: drafts.length };
    for (const d of drafts) {
      const s = d.pipeline_status || 'Newly Imported';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [drafts]);

  const allTags = useMemo(() => {
    const tagSet = new Map<string, number>();
    for (const d of drafts) {
      for (const tag of parseTags(d.tags)) {
        tagSet.set(tag, (tagSet.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagSet.entries()).sort((a, b) => b[1] - a[1]);
  }, [drafts]);

  const totalBFileLines = useMemo(() =>
    drafts.reduce((acc, d) => {
      if (!d.b_file_content) return acc;
      return acc + d.b_file_content.trim().split('\n').filter(Boolean).length;
    }, 0),
    [drafts]
  );

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  return (
    <div className="w-full h-full shrink-0 flex flex-col border-r border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* "All" button */}
      <div className="px-3 pt-4 pb-1">
        <button
          onClick={() => onFilterStatus('All')}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors text-left ${
            filterStatus === 'All'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">∑</span>
            <span className="truncate">All Sequences</span>
          </span>
          {statusCounts['All'] > 0 && (
            <span className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded-full ${
              filterStatus === 'All' ? 'bg-indigo-600/40 text-indigo-200' : 'bg-neutral-800 text-neutral-500'
            }`}>
              {statusCounts['All']}
            </span>
          )}
        </button>
      </div>

      {/* Lifecycle Phases — scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 mt-2">
        {Object.entries(PIPELINE_PHASES).map(([phase, statuses]) => {
          // Only render a phase section if it has at least one sequence
          const phaseTotal = statuses.reduce((sum, s) => sum + (statusCounts[s] || 0), 0);
          const isExpanded = expandedPhases[phase] !== false;
          
          return (
            <div key={phase} className="space-y-1">
              <button 
                onClick={() => togglePhase(phase)}
                className={`w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded hover:bg-neutral-900/50 transition-colors ${PHASE_COLORS[phase] || 'text-neutral-500'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-sm border ${isExpanded ? 'bg-current border-transparent' : 'border-current bg-transparent'} transition-all`} />
                  {phase}
                </div>
                {phaseTotal > 0 && <span className="text-neutral-500 font-mono">({phaseTotal})</span>}
              </button>
              
              {isExpanded && (
                <nav className="space-y-1 pl-1">
                  {statuses.map(status => {
                    const count = statusCounts[status] || 0;
                    const isActive = filterStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => onFilterStatus(status)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors text-left ${
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                            : count > 0
                              ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                              : 'text-neutral-600 hover:bg-neutral-900 hover:text-neutral-500'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-base leading-none">{STATUS_ICONS[status] || '•'}</span>
                          <span className="truncate">{status}</span>
                        </span>
                        {count > 0 && (
                          <span className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-indigo-600/40 text-indigo-200' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}
      </div>

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <div className="px-3 pt-3 pb-2 border-t border-neutral-800/60">
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Tags
          </p>
          <div className="flex flex-wrap gap-1.5 px-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
            {allTags.slice(0, 30).map(([tag, count]) => (
              <span
                key={tag}
                className="text-xs font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700/50 leading-tight"
                title={`${count} sequences`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-auto border-t border-neutral-800 px-4 py-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>{drafts.length} sequences total</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span>{totalBFileLines.toLocaleString()} b-file lines</span>
        </div>
        <div className="text-[10px] text-neutral-600">
          Refreshed {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
