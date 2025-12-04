import React, { useState, useRef, useLayoutEffect } from "react";
import { Keyboard, X, GripHorizontal } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ["V"], description: "Selection Tool" },
  { keys: ["R"], description: "Rectangle" },
  { keys: ["D"], description: "Diamond" },
  { keys: ["O"], description: "Ellipse" },
  { keys: ["A"], description: "Arrow" },
  { keys: ["L"], description: "Line" },
  { keys: ["P"], description: "Scribble" },
  { keys: ["T"], description: "Text" },
  { keys: ["E"], description: "Eraser" },
  { keys: ["Ctrl", "Z"], description: "Undo" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
  { keys: ["Ctrl", "Y"], description: "Redo" },
  { keys: ["Ctrl", "A"], description: "Select All" },
  { keys: ["Enter"], description: "Edit Text" },
  { keys: ["Esc"], description: "Cancel / Selection" },
  { keys: ["Backspace"], description: "Delete Selected" },
  { keys: ["Delete"], description: "Delete Selected" },
];

interface ShortcutsPanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

// Calculate initial position synchronously to prevent flash
const getInitialPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 100 };
  }
  
  const panelWidth = 260;
  const rightGap = 16; // Same as right-4 (where the keyboard button is)
  const topGap = 16; // top-4 for keyboard button
  const bottomGap = 24; // bottom-6 for AI Generate button
  const topButtonHeight = 48; // p-3 button height (~40px + padding)
  const bottomButtonHeight = 64; // p-4 button height (~56px + padding)
  
  // Top button center: topGap + half button height
  const topButtonCenter = topGap + topButtonHeight / 2;
  // Bottom button center: window height - bottomGap - half button height
  const bottomButtonCenter = window.innerHeight - bottomGap - bottomButtonHeight / 2;
  // Center point between the two buttons, shifted up by 60px
  const centerY = (topButtonCenter + bottomButtonCenter) / 2 - 60;
  // Panel height is approximately 400px, so subtract half to center it
  const panelHeight = 400;
  
  return {
    x: window.innerWidth - panelWidth - rightGap,
    y: centerY - panelHeight / 2
  };
};

const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    // Update position on window resize, centered vertically between top and bottom buttons
    const updatePosition = () => {
      const panelWidth = 260;
      const rightGap = 16;
      const topGap = 16;
      const bottomGap = 24;
      const topButtonHeight = 48;
      const bottomButtonHeight = 64;
      const panelHeight = 400;
      
      const topButtonCenter = topGap + topButtonHeight / 2;
      const bottomButtonCenter = window.innerHeight - bottomGap - bottomButtonHeight / 2;
      const centerY = (topButtonCenter + bottomButtonCenter) / 2 - 60;
      
      setPosition(prev => ({
        x: window.innerWidth - panelWidth - rightGap,
        y: prev.y === 0 || prev.y === 100 ? centerY - panelHeight / 2 : prev.y
      }));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  useLayoutEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newX = startPosRef.current.x + dx;
        const newY = startPosRef.current.y + dy;
        
        // Constrain to viewport
        const panelWidth = 260;
        const maxX = window.innerWidth - panelWidth;
        const maxY = window.innerHeight - 100; // Approximate height
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
  };

  return (
    <div
      className="fixed bg-black/80 dark:bg-black/90 backdrop-blur-sm text-white shadow-neo border-2 border-black z-50 rounded-none"
      style={{
        left: position.x,
        top: position.y,
        width: 260,
        touchAction: 'none'
      }}
    >
      {/* Header / Drag Handle */}
      <div
        className="bg-white/10 border-b-2 border-white/30 p-2 flex items-center justify-between cursor-move select-none"
        onPointerDown={handleDragStart}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <GripHorizontal size={14} />
          <Keyboard size={14} />
          <span>Keyboard Shortcuts</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:bg-red-500/50 hover:text-white rounded p-0.5 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="text-white/90 text-[11px]">{shortcut.description}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-1.5 py-0.5 bg-white/25 border border-white/40 rounded text-[10px] font-mono font-semibold text-white min-w-[22px] text-center shadow-sm">
                    {key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-white/60 text-[10px] font-semibold">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortcutsPanel;

