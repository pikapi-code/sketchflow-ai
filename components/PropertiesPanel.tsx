import React, { useState, useRef, useEffect } from "react";
import { CanvasConfig, SketchElement } from "../types";
import { COLORS, FONTS } from "../constants";
import { Ban, X, GripHorizontal } from "lucide-react";

interface PropertiesPanelProps {
  config: CanvasConfig;
  onChange: (updates: Partial<CanvasConfig> | Partial<SketchElement>) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ config, onChange, isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 16, y: 100 });

  useEffect(() => {
    // Center vertically on mount (approximate height 400px)
    setPosition({ x: 16, y: Math.max(100, window.innerHeight / 2 - 200) });
  }, []);
  const [width, setWidth] = useState(224); // w-56 = 14rem = 224px

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const startWidthRef = useRef(0);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPosition({
          x: startPosRef.current.x + dx,
          y: startPosRef.current.y + dy
        });
      } else if (isResizing) {
        const dx = e.clientX - dragStartRef.current.x;
        setWidth(Math.max(200, startWidthRef.current + dx));
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isResizing]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: any) => {
    onChange({ [key]: value });
  };

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startWidthRef.current = width;
  };

  return (
    <div
      className="fixed bg-white dark:bg-neo-black shadow-neo border-2 border-black z-40 transition-colors duration-200 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: width,
        touchAction: 'none'
      }}
    >
      {/* Header / Drag Handle */}
      <div
        className="bg-gray-100 dark:bg-gray-800 border-b-2 border-black p-2 flex items-center justify-between cursor-move select-none"
        onPointerDown={handleDragStart}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          <GripHorizontal size={14} />
          <span>Properties</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="p-3 space-y-3 overflow-y-auto max-h-[80vh]">
        {/* Stroke Color */}
        <div>
          <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Stroke</label>
          <div className="grid grid-cols-5 gap-1.5">
            {COLORS.filter(c => c !== "transparent").map((color) => (
              <button
                key={color}
                className={`w-6 h-6 border-2 border-black hover:-translate-y-0.5 transition-transform ${config.strokeColor === color ? 'shadow-neo-sm translate-y-[-2px]' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleChange('strokeColor', color)}
              />
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Background</label>
          <div className="grid grid-cols-5 gap-1.5">
            <button
              title="Transparent"
              className={`w-6 h-6 border-2 border-black flex items-center justify-center overflow-hidden bg-white hover:-translate-y-0.5 transition-transform ${config.backgroundColor === 'transparent' ? 'shadow-neo-sm relative' : ''}`}
              onClick={() => handleChange('backgroundColor', 'transparent')}
            >
              <Ban size={14} className="text-black dark:text-black" />
            </button>
            {COLORS.filter(c => c !== "transparent").map((color) => (
              <button
                key={color}
                className={`w-6 h-6 border-2 border-black hover:-translate-y-0.5 transition-transform ${config.backgroundColor === color ? 'shadow-neo-sm translate-y-[-2px]' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleChange('backgroundColor', color)}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Stroke Width: {config.strokeWidth}px</label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.strokeWidth}
            onChange={(e) => handleChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 border-2 border-black rounded-full appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500"
          />
        </div>

        {/* Fill Style */}
        <div>
          <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Fill Style</label>
          <div className="flex flex-wrap gap-1.5">
            {(['hachure', 'solid', 'dots'] as const).map(style => (
              <button
                key={style}
                onClick={() => handleChange('fillStyle', style)}
                className={`px-2 py-0.5 text-xs font-bold border-2 border-black transition-all
                      ${config.fillStyle === style
                    ? 'bg-neo-blue text-black shadow-neo-sm -translate-y-0.5'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block mb-1">Font Family</label>
          <select
            value={config.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full px-2 py-1 text-xs border-2 border-black bg-white dark:bg-gray-800 text-black dark:text-white cursor-pointer hover:shadow-neo-sm transition-all"
          >
            {FONTS.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-50 hover:opacity-100"
        onPointerDown={handleResizeStart}
      >
        <div className="w-0 h-0 border-style-solid border-r-[6px] border-b-[6px] border-l-[6px] border-t-[6px] border-r-black border-b-black border-l-transparent border-t-transparent transform translate-x-[-2px] translate-y-[-2px]" />
      </div>

    </div>
  );
};

export default PropertiesPanel;
