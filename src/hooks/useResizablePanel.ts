import { useState, useEffect, useCallback } from 'react';

export interface UseResizablePanelProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey: string;
  direction?: 'left' | 'right';
}

export function useResizablePanel({ initialWidth, minWidth, maxWidth, storageKey, direction = 'right' }: UseResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : initialWidth;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      let newWidth = width;
      if (direction === 'right') {
        newWidth = e.clientX;
      } else {
        newWidth = window.innerWidth - e.clientX;
      }
      
      if (newWidth > maxWidth) newWidth = maxWidth;
      if (newWidth < minWidth) newWidth = minWidth;
      
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem(storageKey, width.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minWidth, maxWidth, storageKey, direction, width]);

  return { width, isDragging, isCollapsed, toggleCollapse, handleMouseDown };
}
