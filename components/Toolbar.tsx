import React from "react";
import { 
  MousePointer2, Square, Circle, Diamond, ArrowRight, Minus, 
  Pencil, Type, Eraser, Undo, Redo, Download, Sun, Moon 
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
}

const Toolbar: React.FC<ToolbarProps> = ({ appState, setTool, undo, redo, toggleTheme, exportImage }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-neo-black shadow-neo border-2 border-black p-2 flex items-center gap-2 z-50 flex-wrap justify-center rounded-none transition-colors duration-200">
      
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
      <div className="flex gap-2 ml-2">
        <button onClick={undo} className="p-2 bg-neo-yellow text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Undo (Ctrl+Z)">
            <Undo size={20} />
        </button>
        <button onClick={redo} className="p-2 bg-neo-yellow text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Redo (Ctrl+Y)">
            <Redo size={20} />
        </button>
      </div>

      <div className="flex gap-2 ml-2">
        <button onClick={exportImage} className="p-2 bg-neo-green text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Export PNG">
            <Download size={20} />
        </button>
        <button onClick={toggleTheme} className="p-2 bg-neo-purple text-black border-2 border-black hover:shadow-neo-sm transition-transform active:translate-y-1" title="Toggle Theme">
            {appState.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;