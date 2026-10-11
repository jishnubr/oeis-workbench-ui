import { useState, useEffect } from 'react';
import { Network } from 'lucide-react';
import LibraryPage from './pages/LibraryPage';
import EditorPage from './pages/EditorPage';
import { getDrafts } from './api/drafts';

function App() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refreshDrafts = async () => {
    try {
      const data = await getDrafts();
      setDrafts(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch drafts', err);
    }
  };

  useEffect(() => {
    refreshDrafts();
  }, []);

  const handleEdit = (id: string | null) => {
    setCurrentDraftId(id);
    setView('editor');
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* ── Global Header ── */}
      <header className="shrink-0 sticky top-0 z-30 bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Network className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">OEIS Sequence Workbench</h1>
            <p className="text-xs text-blue-200 font-medium">Local Research & Curation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold bg-blue-800/50 px-3 py-1 rounded-full border border-blue-700/50 shadow-inner">
            {drafts.length} sequence{drafts.length !== 1 ? 's' : ''} in library
          </span>
          {view === 'library' && (
            <button
              onClick={() => handleEdit(null)}
              className="bg-white text-blue-900 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
            >
              + New OEIS Draft
            </button>
          )}
        </div>
      </header>

      {/* ── Main View Area ── */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {view === 'library' ? (
          <LibraryPage
            drafts={drafts}
            onEdit={handleEdit}
            onRefresh={refreshDrafts}
            lastRefresh={lastRefresh}
          />
        ) : (
          <EditorPage
            draft={currentDraftId ? drafts.find(d => d.internal_id === currentDraftId) : null}
            onClose={() => {
              setView('library');
              refreshDrafts();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
