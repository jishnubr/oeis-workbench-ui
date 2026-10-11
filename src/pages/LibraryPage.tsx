import { useState, useMemo, useEffect, useCallback } from 'react';
import type { SortKey, SortDir } from '../components/library/DraftTable';
import { Search, Upload, FileJson, Maximize2, Minimize2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, HardDriveDownload, Archive } from 'lucide-react';
import { exportDrafts } from '../api/drafts';
import StatusSidebar from '../components/library/StatusSidebar';
import DraftTable from '../components/library/DraftTable';
import QuickInspector from '../components/library/QuickInspector';
import ImportModal from '../components/library/ImportModal';
import AdvancedExportModal from '../components/library/AdvancedExportModal';
import ResizeHandle from '../components/common/ResizeHandle';
import { useResizablePanel } from '../hooks/useResizablePanel';

const PIPELINE_PHASES: Record<string, string[]> = {
  'Entry': ['Newly Imported', 'Awaiting Classification'],
  'Triage': ['Domain-Relevant', 'Domain-Irrelevant'],
  'Validation': ['B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req'],
  'Analysis': ['Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress'],
  'Readiness': ['Ready for Internal Review', 'Ready for OEIS'],
  'Outcome': ['Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived', 'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected'],
};

const PAGE_SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '250', value: 250 },
  { label: 'All', value: -1 },
];

interface LibraryPageProps {
  drafts: any[];
  onEdit: (id: string) => void;
  onRefresh: () => void;
  lastRefresh: Date;
}

export default function LibraryPage({ drafts, onEdit, onRefresh, lastRefresh }: LibraryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);
  const [fullScreenTable, setFullScreenTable] = useState(false);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Auto-reset to page 1 whenever the filtered set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortKey, sortDir]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const lower = searchTerm.toLowerCase();
      const idMatch = draft.internal_id?.toLowerCase().includes(lower);
      const aMatch = draft.a_number?.toLowerCase().includes(lower);
      const titleMatch = draft.title?.toLowerCase().includes(lower);
      let tagsMatch = false;
      if (draft.tags) {
        try {
          const parsed = typeof draft.tags === 'string' ? JSON.parse(draft.tags) : draft.tags;
          if (Array.isArray(parsed)) tagsMatch = parsed.some((t: string) => t.toLowerCase().includes(lower));
        } catch { /* ignore */ }
      }
      const matchesSearch = !searchTerm || idMatch || aMatch || titleMatch || tagsMatch;
      const matchesStatus = filterStatus === 'All'
        || draft.pipeline_status === filterStatus
        || (PIPELINE_PHASES[filterStatus] && PIPELINE_PHASES[filterStatus].includes(draft.pipeline_status));
      return matchesSearch && matchesStatus;
    });
  }, [drafts, searchTerm, filterStatus]);

  // Auto-select first sequence so inspector is never blank
  useEffect(() => {
    if (!selectedId && filteredDrafts.length > 0) {
      setSelectedId(filteredDrafts[0].internal_id);
    }
  }, [filteredDrafts, selectedId]);

  // ── Resizable panels ──────────────────────────────────────────────────────
  const sidebar = useResizablePanel({
    initialWidth: 320,
    minWidth: 280,
    maxWidth: 500,
    storageKey: 'workbench_sidebar_width',
    direction: 'right'
  });

  const inspector = useResizablePanel({
    initialWidth: 320,
    minWidth: 260,
    maxWidth: 650,
    storageKey: 'workbench_inspector_width',
    direction: 'left'
  });

  // ── Sorted + Pagination ───────────────────────────────────────────────────
  // Extract numeric suffix from JIS IDs for proper numeric sort (JIS-003 -> 3)
  function jisNum(id: string): number {
    const m = id.match(/JIS-?\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : Infinity;
  }

  const sortedFilteredDrafts = useMemo(() => {
    const arr = [...filteredDrafts];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'id') {
      arr.sort((a, b) => {
        const aIsJIS = /JIS/i.test(a.internal_id ?? '');
        const bIsJIS = /JIS/i.test(b.internal_id ?? '');
        if (aIsJIS && bIsJIS) return dir * (jisNum(a.internal_id) - jisNum(b.internal_id));
        if (aIsJIS && !bIsJIS) return -1; // JIS drafts always grouped at top
        if (!aIsJIS && bIsJIS) return 1;
        return dir * (a.internal_id ?? '').localeCompare(b.internal_id ?? '');
      });
    } else if (sortKey === 'title') {
      arr.sort((a, b) => dir * (a.title ?? '').localeCompare(b.title ?? ''));
    } else if (sortKey === 'status') {
      arr.sort((a, b) => dir * (a.pipeline_status ?? '').localeCompare(b.pipeline_status ?? ''));
    }
    return arr;
  }, [filteredDrafts, sortKey, sortDir]);

  const totalItems = sortedFilteredDrafts.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedDrafts = useMemo(() => {
    if (pageSize === -1) return sortedFilteredDrafts;
    const start = (safePage - 1) * pageSize;
    return sortedFilteredDrafts.slice(start, start + pageSize);
  }, [sortedFilteredDrafts, safePage, pageSize]);

  const pageStart = totalItems === 0 ? 0 : (pageSize === -1 ? 1 : (safePage - 1) * pageSize + 1);
  const pageEnd = pageSize === -1 ? totalItems : Math.min(safePage * pageSize, totalItems);

  const isOrderable = searchTerm === '' && filterStatus === 'All';
  const selectedDraft = drafts.find(d => d.internal_id === selectedId) ?? null;

  // ── Backup helpers ────────────────────────────────────────────────────────
  const [backingUp, setBackingUp] = useState<'light' | 'full' | null>(null);

  const handleBackup = useCallback(async (mode: 'light' | 'full') => {
    setBackingUp(mode);
    try {
      const nonArchivedStatuses = [
        'Newly Imported', 'Awaiting Classification', 'Domain-Relevant', 'Domain-Irrelevant',
        'B-file Pending', 'Matrix Pending', 'Cross-Ref Pending', 'Manual Review Req',
        'Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress',
        'Ready for Internal Review', 'Ready for OEIS', 'Submitted', 'Accepted', 'Published', 'Heroic Edit',
      ];
      const allStatuses = [...nonArchivedStatuses, 'Rejected', 'Archived'];
      const result = await exportDrafts({
        statuses: mode === 'light' ? nonArchivedStatuses : allStatuses,
        fields: ['internal_id', 'a_number', 'title', 'pipeline_status', 'terms', 'formula',
                 'keywords', 'tags', 'comments', 'research_notes', 'offset', 'updated_at'],
      });
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workbench-backup-${mode}-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup failed', err);
      alert('Backup failed — check the console for details.');
    } finally {
      setBackingUp(null);
    }
  }, []);

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* ── Left Sidebar ── */}
      {!fullScreenTable && !sidebar.isCollapsed && (
        <div style={{ width: sidebar.width }} className="shrink-0 flex h-full">
          <StatusSidebar
            drafts={drafts}
            filterStatus={filterStatus}
            onFilterStatus={s => { setFilterStatus(s); setSelectedId(null); }}
            searchTerm={searchTerm}
            lastRefresh={lastRefresh}
          />
        </div>
      )}

      {!fullScreenTable && (
        <ResizeHandle
          onMouseDown={sidebar.handleMouseDown}
          isCollapsed={sidebar.isCollapsed}
          onToggleCollapse={sidebar.toggleCollapse}
          direction="right"
        />
      )}

      {/* ── Center: Toolbar + Table + Pagination ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-neutral-900 w-full max-w-none">

        {/* Phase Ribbon */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-950 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filterStatus === 'All' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
            }`}
          >
            All <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{drafts.length}</span>
          </button>
          {Object.entries(PIPELINE_PHASES).map(([phase, statuses]) => {
            const count = drafts.filter(d => statuses.includes(d.pipeline_status)).length;
            const isActive = filterStatus === phase;
            return (
              <button
                key={phase}
                onClick={() => setFilterStatus(phase)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                }`}
              >
                {phase} {count > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="shrink-0 px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 bg-neutral-950/40">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search ID, title, or tag…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-neutral-200 placeholder-neutral-600"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>

            <button
              onClick={() => setShowAdvancedExport(true)}
              title="Open Advanced Export Configuration"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <FileJson className="w-3.5 h-3.5" /> Advanced Export
            </button>

            <button
              onClick={() => handleBackup('light')}
              disabled={backingUp !== null}
              title="Download JSON backup (active sequences only — excludes Rejected & Archived)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              {backingUp === 'light' ? 'Saving…' : 'Backup Light'}
            </button>

            <button
              onClick={() => handleBackup('full')}
              disabled={backingUp !== null}
              title="Download full JSON backup (all statuses including Rejected & Archived)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-amber-400 rounded-lg text-xs font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors border border-neutral-700"
            >
              <Archive className="w-3.5 h-3.5" />
              {backingUp === 'full' ? 'Saving…' : 'Backup Full'}
            </button>

            <button
              onClick={() => setFullScreenTable(prev => !prev)}
              title="Toggle Full Screen Table"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium hover:bg-neutral-700 transition-colors ml-2"
            >
              {fullScreenTable ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{fullScreenTable ? 'Exit Full' : 'Full Screen'}</span>
            </button>
          </div>
        </div>

        {/* Count row */}
        <div className="shrink-0 px-4 py-1.5 border-b border-neutral-800/50 bg-neutral-900">
          <span className="text-[11px] text-neutral-600">
            {totalItems} sequence{totalItems !== 1 ? 's' : ''}
            {filterStatus !== 'All' ? ` · ${filterStatus}` : ''}
            {searchTerm ? ` · matching "${searchTerm}"` : ''}
          </span>
        </div>

        {/* Table */}
        <DraftTable
          drafts={paginatedDrafts}
          allDrafts={drafts}
          selectedId={selectedId}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
          isOrderable={isOrderable}
          onRefresh={onRefresh}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />

        {/* ── Sticky Pagination Footer ── */}
        <div className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-4 py-2.5 flex items-center justify-between text-xs text-neutral-400 gap-3">
          {/* Left: range summary */}
          <span className="whitespace-nowrap shrink-0 tabular-nums">
            {totalItems === 0
              ? 'No sequences'
              : pageSize === -1
                ? `All ${totalItems} sequences`
                : `${pageStart}–${pageEnd} of ${totalItems}`}
          </span>

          {/* Center: page-size selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-neutral-600 whitespace-nowrap hidden sm:inline">Rows</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt.label} value={opt.value} className="bg-neutral-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Right: nav buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              disabled={safePage <= 1 || pageSize === -1}
              onClick={() => setCurrentPage(1)}
              title="First page"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={safePage <= 1 || pageSize === -1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              title="Previous page"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 text-neutral-300 whitespace-nowrap tabular-nums">
              {pageSize === -1 ? '1 / 1' : `${safePage} / ${totalPages}`}
            </span>

            <button
              disabled={safePage >= totalPages || pageSize === -1}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              title="Next page"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={safePage >= totalPages || pageSize === -1}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
              className="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Quick Inspector ── */}
      {!fullScreenTable && (
        <ResizeHandle
          onMouseDown={inspector.handleMouseDown}
          isCollapsed={inspector.isCollapsed}
          onToggleCollapse={inspector.toggleCollapse}
          direction="left"
        />
      )}

      {!fullScreenTable && !inspector.isCollapsed && (
        <div style={{ width: inspector.width }} className="shrink-0 flex h-full">
          <QuickInspector
            draft={selectedDraft}
            onEdit={onEdit}
            onRefresh={() => { onRefresh(); setSelectedId(null); }}
            onOpenExport={() => setShowAdvancedExport(true)}
          />
        </div>
      )}

      {/* ── Modals ── */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={onRefresh}
        />
      )}
      <AdvancedExportModal
        isOpen={showAdvancedExport}
        onClose={() => setShowAdvancedExport(false)}
      />
    </div>
  );
}


