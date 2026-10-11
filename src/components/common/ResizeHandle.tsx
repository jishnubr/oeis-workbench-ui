import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  direction?: 'left' | 'right'; // which way the chevron points when expanded
}

export default function ResizeHandle({ 
  onMouseDown, 
  isCollapsed = false, 
  onToggleCollapse,
  direction = 'left' 
}: ResizeHandleProps) {
  const isLeft = direction === 'left';
  const Icon = isCollapsed 
    ? (isLeft ? ChevronRight : ChevronLeft)
    : (isLeft ? ChevronLeft : ChevronRight);

  return (
    <div 
      className="relative flex items-center justify-center w-1.5 shrink-0 bg-neutral-900 cursor-col-resize hover:bg-indigo-500/60 active:bg-indigo-600 transition-colors group z-20"
      onMouseDown={onMouseDown}
    >
      {onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="absolute z-30 w-4 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow hover:bg-neutral-700 hover:text-white text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          style={{ [isLeft ? 'right' : 'left']: '-6px' }}
        >
          <Icon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
