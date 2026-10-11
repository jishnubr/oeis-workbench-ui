import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { oeisFormatter } from '../../utils/oeisFormatter';
import { patchDraft } from '../../api/drafts';

interface ExportModalProps {
  draft: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ExportModal({ draft, onClose, onRefresh }: ExportModalProps) {
  const [format, setFormat] = useState<'oeis' | 'json'>('oeis');
  const [copySuccess, setCopySuccess] = useState(false);

  const content = format === 'oeis'
    ? oeisFormatter(draft)
    : JSON.stringify(draft, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const markSubmitted = async () => {
    await patchDraft(draft.internal_id, { pipeline_status: 'Submitted' });
    onRefresh();
    onClose();
  };

  const canMarkSubmitted = !['Submitted', 'Approved', 'Published'].includes(draft.pipeline_status);

  return (
    <div className="fixed inset-0 bg-neutral-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <h2 className="text-base font-bold text-neutral-100">
            Export / Copy: <span className="font-mono text-blue-400">{draft.internal_id}</span>
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Format tabs */}
        <div className="px-6 pt-3 bg-neutral-950/50 border-b border-neutral-800 flex gap-6">
          {(['oeis', 'json'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                format === f
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {f === 'oeis' ? 'Raw OEIS Format' : 'JSON Data'}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-auto bg-neutral-950 flex-1">
          <pre className="text-sm font-mono text-neutral-200 whitespace-pre-wrap select-all leading-relaxed">
            {content}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-950/50">
          <div>
            {canMarkSubmitted && (
              <button
                onClick={markSubmitted}
                className="px-4 py-2 border border-blue-700/50 bg-blue-900/30 text-blue-400 rounded-lg text-sm hover:bg-blue-900/50 transition-colors font-medium"
              >
                Mark as Submitted
              </button>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={onClose} className="px-4 py-2 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition-colors">
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 font-medium w-32 justify-center transition-colors"
            >
              {copySuccess ? <><CheckCircle2 className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
