import { useState } from 'react';
import { Upload } from 'lucide-react';
import { saveDraft } from '../../api/drafts';
import { parseRawTextToDraft } from '../../utils/oeisParser';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('Please paste some content to import.');
      return;
    }
    try {
      setIsImporting(true);
      const parsedDraft = parseRawTextToDraft(importText);
      if (!parsedDraft || Object.keys(parsedDraft).length === 0) {
        setImportError('Failed to parse data. Ensure it is valid JSON or OEIS raw format.');
        return;
      }
      await saveDraft(parsedDraft);
      setImportText('');
      onSuccess();
      onClose();
    } catch (e: any) {
      setImportError(e.message || 'An unknown error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  const formatHint = importText.trim().startsWith('{')
    ? { label: 'JSON Detected', cls: 'bg-blue-100 text-blue-800' }
    : importText.trim().startsWith('%')
    ? { label: 'OEIS Raw Format Detected', cls: 'bg-orange-100 text-orange-800' }
    : null;

  return (
    <div className="fixed inset-0 bg-neutral-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <h2 className="text-base font-bold text-neutral-100">Import Draft / Paste AI JSON</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100 text-xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6">
          <p className="text-sm text-neutral-400 mb-3">
            Paste JSON data or Raw OEIS format text. If the JSON contains an existing{' '}
            <code className="bg-neutral-800 px-1 py-0.5 rounded text-xs font-mono text-neutral-300">internal_id</code>,
            it will overwrite the existing draft.
          </p>

          {importError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 text-red-400 rounded-lg text-sm">
              {importError}
            </div>
          )}

          <div className="relative">
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              className="w-full h-64 p-3 border border-neutral-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-neutral-950 text-neutral-200 placeholder-neutral-600"
              placeholder="Paste JSON or raw %I %N %S... format here..."
            />
            {formatHint && (
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className={`text-xs px-2 py-1 rounded font-bold ${formatHint.cls}`}>{formatHint.label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 font-medium disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isImporting ? 'Importing...' : 'Import / Update Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
