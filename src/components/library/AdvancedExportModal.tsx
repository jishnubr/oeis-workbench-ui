import { useState } from 'react';
import { X, Download, FileJson, Database, Layers, RefreshCw } from 'lucide-react';
import { exportDrafts } from '../../api/drafts';

// Grouping fields into logical clusters for a better UX
const FIELD_CLUSTERS = {
  'Identity': ['internal_id', 'a_number', 'title'],
  'Numerical Data': ['terms', 'offset', 'b_file_content'],
  'Mathematical Theory': ['formula', 'theorem_latex', 'proof_latex', 'research_notes'],
  'OEIS Metadata': ['comments', 'examples', 'references_doc', 'links', 'crossrefs', 'keywords', 'author', 'extensions'],
  'Workflow State': ['pipeline_status', 'priority_order', 'failure_reason', 'updated_at'],
};

const PIPELINE_PHASES: Record<string, string[]> = {
  'Entry': ['Newly Imported', 'Awaiting Classification'],
  'Triage': ['Domain-Relevant', 'Domain-Irrelevant'],
  'Validation': ['B-file Pending', 'Matrix Pending', 'Matrix Validation Pending', 'Cross-Ref Pending', 'Manual Review Req'],
  'Analysis': ['Research Candidate', 'False Positive', 'False Negative', 'Draft in Progress'],
  'Readiness': ['Ready for Internal Review', 'Ready for OEIS'],
  'Outcome': ['Submitted', 'Accepted', 'Published', 'Heroic Edit', 'Rejected', 'Archived', 'Matrix Verified', 'Matrix Verification Failed', 'Row Mismatch Detected', 'Column Mismatch Detected', 'B-file Mismatch Detected'],
};

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvancedExportModal({ isOpen, onClose }: AdvancedExportModalProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(['internal_id', 'title', 'pipeline_status']);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDrafts({ statuses: selectedStatuses, fields: selectedFields });
      
      // Create a JSON blob for download
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oeis_custom_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Advanced Data Export</h2>
              <p className="text-xs text-neutral-400">Configure horizontal and vertical filters for targeted extraction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Vertical Filtering (Statuses) */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-200 mb-4">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>1. Select Workflow States</span>
            </div>

            <div className="space-y-6">
              {Object.entries(PIPELINE_PHASES).map(([phase, statuses]) => (
                <div key={phase} className="space-y-2">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">{phase}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map(status => (
                      <label key={status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          className="rounded border-neutral-600 bg-neutral-900 text-sky-500 focus:ring-sky-500"
                          checked={selectedStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                        />
                        <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Horizontal Filtering (Fields) */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-200 mb-4">
              <Database className="w-4 h-4 text-sky-400" />
              <span>2. Select Data Fields</span>
            </div>

            <div className="space-y-6">
              {Object.entries(FIELD_CLUSTERS).map(([cluster, fields]) => (
                <div key={cluster} className="space-y-2">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">{cluster}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {fields.map(field => (
                      <label key={field} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          className="rounded border-neutral-600 bg-neutral-900 text-sky-500 focus:ring-sky-500"
                          checked={selectedFields.includes(field)}
                          onChange={() => toggleField(field)}
                        />
                        <span className="text-xs font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500">
            Selected: <span className="text-sky-400 font-mono">{selectedStatuses.length} statuses</span>, 
            <span className="text-sky-400 font-mono"> {selectedFields.length} fields</span>
          </div>
          <button
            onClick={handleExecuteExport}
            disabled={isExporting || selectedStatuses.length === 0 || selectedFields.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-sky-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            <span>Execute Custom Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
