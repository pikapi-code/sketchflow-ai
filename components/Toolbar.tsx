import React, { useState } from "react";
import {
  MousePointer2, Square, Circle, Diamond, ArrowRight, Minus,
  Pencil, Type, Eraser, Undo, Redo, Download, Sun, Moon, Settings2, RotateCw, Map, Keyboard
} from "lucide-react";
import { ToolType, AppState } from "../types";
import { TOOLS } from "../constants";

interface ToolbarProps {
  appState: AppState;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
  toggleTheme: () => void;
  exportImage: () => void;
  showProperties: boolean;
  toggleProperties: () => void;
  showMiniMap: boolean;
  toggleMiniMap: () => void;
  showShortcutsPanel: boolean;
  toggleShortcutsPanel: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ appState, setTool, undo, redo, toggleTheme, exportImage, showProperties, toggleProperties, showMiniMap, toggleMiniMap, showShortcutsPanel, toggleShortcutsPanel }) => {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`fixed bg-white dark:bg-neo-black shadow-neo border-2 border-black p-2 flex items-center gap-2 z-50 rounded-none transition-all duration-200
        ${isVertical
          ? 'left-4 top-1/2 -translate-y-1/2 flex-col'
          : 'top-4 left-1/2 -translate-x-1/2 flex-row flex-wrap justify-center'
        }`}
    >

      {/* Tool Selection */}
      {TOOLS.map((t) => {
        const Icon =
          t.id === 'selection' ? MousePointer2 :
            t.id === 'rectangle' ? Square :
              t.id === 'ellipse' ? Circle :
                t.id === 'diamond' ? Diamond :
                  t.id === 'arrow' ? ArrowRight :
                    t.id === 'line' ? Minus :
                      t.id === 'scribble' ? Pencil :
                        t.id === 'text' ? Type :
                          Eraser;

        const isActive = appState.tool === t.id;

        return (
          <button
            key={t.id}
            title={`${t.label} (${t.shortcut})`}
            onClick={() => setTool(t.id)}
            className={`p-2 border-2 transition-all duration-150 relative top-0 left-0
              ${isActive
                ? "bg-brand-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                : "bg-white dark:bg-gray-800 text-black dark:text-white border-black hover:-translate-y-1 hover:shadow-neo-sm"
              }`}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Actions */}
      <div className={`flex gap-2 ${isVertical ? 'flex-col mt-2 border-t-2 border-black pt-2 w-full items-center' : 'ml-2'}`}>
        <button onClick={undo} className="p-2 bg-neo-yellow text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Undo (Ctrl+Z)">
          <Undo size={20} />
        </button>
        <button onClick={redo} className="p-2 bg-neo-yellow text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Redo (Ctrl+Y)">
          <Redo size={20} />
        </button>
      </div>

      <div className={`flex gap-2 ${isVertical ? 'flex-col mt-2 border-t-2 border-black pt-2 w-full items-center' : 'ml-2'}`}>
        <button onClick={toggleProperties} className={`p-2 border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1 ${showProperties ? 'bg-neo-blue text-black' : 'bg-white dark:bg-gray-800 text-black dark:text-white'}`} title="Toggle Properties Panel">
          <Settings2 size={20} />
        </button>
        <button onClick={toggleMiniMap} className={`p-2 border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1 ${showMiniMap ? 'bg-neo-green text-black' : 'bg-white dark:bg-gray-800 text-black dark:text-white'}`} title="Toggle Mini Map">
          <Map size={20} />
        </button>
        <button onClick={toggleShortcutsPanel} className={`p-2 border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1 ${showShortcutsPanel ? 'bg-neo-purple text-black' : 'bg-white dark:bg-gray-800 text-black dark:text-white'}`} title="Toggle Keyboard Shortcuts">
          <Keyboard size={20} />
        </button>
        <button onClick={exportImage} className="p-2 bg-neo-green text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Export PNG">
          <Download size={20} />
        </button>
        <button onClick={toggleTheme} className="p-2 bg-neo-purple text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Toggle Theme">
          {appState.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Orientation Toggle */}
      <div className={`flex gap-2 ${isVertical ? 'flex-col mt-2 border-t-2 border-black pt-2 w-full items-center' : 'ml-2 border-l-2 border-black pl-2'}`}>
        <button
          onClick={() => setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
          className="p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1"
          title="Rotate Toolbar"
        >
          <RotateCw size={20} />
        </button>
      </div>

    </div>
  );
};

export default Toolbar;