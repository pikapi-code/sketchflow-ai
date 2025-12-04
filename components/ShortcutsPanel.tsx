import React, { useState, useRef, useEffect } from "react";
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

const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Position on the right side, centered vertically between top button (top-4 = 16px) and bottom button (bottom-6 = 24px)
    // Top button center is approximately at: 16px (top) + ~20px (half button height) = ~36px
    // Bottom button center is approximately at: window.innerHeight - 24px (bottom) - ~30px (half button height) = window.innerHeight - ~54px
    // Center point between buttons: (36 + window.innerHeight - 54) / 2 = (window.innerHeight - 18) / 2
    // Panel should be centered at this point, so subtract half panel height (~200px)
    const panelWidth = 260;
    const rightGap = 16; // Same as right-4
    const topButtonCenter = 16 + 20; // top-4 + approximate half button height
    const bottomButtonCenter = window.innerHeight - 24 - 30; // bottom-6 - approximate half button height
    const centerY = (topButtonCenter + bottomButtonCenter) / 2 - 200; // Center panel at midpoint
    setPosition({ x: window.innerWidth - panelWidth - rightGap, y: Math.max(100, centerY) });
  }, []);

  useEffect(() => {
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

