import { ArrowLeft } from 'lucide-react';

interface FieldNavigatorProps {
  internalId: string;
  pipelineStatus: string;
  onClose: () => void;
}

const SECTIONS = [
  { id: 'section-basic', label: 'Basic' },
  { id: 'section-math', label: 'Math' },
  { id: 'section-code', label: 'Code' },
  { id: 'section-research', label: 'Research' },
  { id: 'section-admin', label: 'Admin' },
];

export default function FieldNavigator({ internalId, pipelineStatus, onClose }: FieldNavigatorProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Published':         return 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50';
      case 'Needs Maintenance': return 'bg-rose-900/40 text-rose-400 border-rose-700/50';
      case 'Approved':          return 'bg-purple-900/40 text-purple-400 border-purple-700/50';
      case 'Submitted':         return 'bg-blue-900/40 text-blue-400 border-blue-700/50';
      case 'Ready for OEIS':    return 'bg-green-900/40 text-green-400 border-green-700/50';
      case 'Internal Review':   return 'bg-orange-900/40 text-orange-400 border-orange-700/50';
      default:                  return 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50';
    }
  };

  return (
    <div className="w-48 shrink-0 flex flex-col bg-neutral-950 border-r border-neutral-800 text-neutral-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-neutral-800 bg-neutral-900 flex flex-col gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors font-medium text-xs w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
        </button>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-700 w-fit">
            {internalId}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${statusColor(pipelineStatus)}`}>
            {pipelineStatus || 'Drafting'}
          </span>
        </div>
      </div>

      {/* Jump Links */}
      <div className="p-3">
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2">Jump To</p>
        <nav className="flex flex-col space-y-0.5">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className="px-2 py-1.5 text-left text-xs font-medium rounded-md hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
