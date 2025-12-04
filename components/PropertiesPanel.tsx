import React from "react";
import { CanvasConfig, SketchElement } from "../types";
import { COLORS } from "../constants";
import { Ban } from "lucide-react";

interface PropertiesPanelProps {
  config: CanvasConfig;
  onChange: (updates: Partial<CanvasConfig> | Partial<SketchElement>) => void;
  isOpen: boolean;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ config, onChange, isOpen }) => {
  if (!isOpen) return null;

  const handleChange = (key: string, value: any) => {
      onChange({ [key]: value });
  };

  return (
    <div className="fixed top-24 left-4 bg-white dark:bg-neo-black shadow-neo border-2 border-black p-4 w-64 z-40 space-y-5 transition-colors duration-200">
      
      {/* Stroke Color */}
      <div>
        <label className="text-sm font-bold text-black dark:text-white uppercase tracking-wider block mb-2">Stroke</label>
        <div className="grid grid-cols-5 gap-2">
          {COLORS.filter(c => c !== "transparent").map((color) => (
            <button
              key={color}
              className={`w-8 h-8 border-2 border-black hover:-translate-y-0.5 transition-transform ${config.strokeColor === color ? 'shadow-neo-sm translate-y-[-2px]' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleChange('strokeColor', color)}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-sm font-bold text-black dark:text-white uppercase tracking-wider block mb-2">Background</label>
        <div className="grid grid-cols-5 gap-2">
           <button
             title="Transparent"
              className={`w-8 h-8 border-2 border-black flex items-center justify-center overflow-hidden bg-white hover:-translate-y-0.5 transition-transform ${config.backgroundColor === 'transparent' ? 'shadow-neo-sm relative' : ''}`}
              onClick={() => handleChange('backgroundColor', 'transparent')}
            >
                <Ban size={16} className="text-black dark:text-black" />
            </button>
          {COLORS.filter(c => c !== "transparent").map((color) => (
            <button
              key={color}
              className={`w-8 h-8 border-2 border-black hover:-translate-y-0.5 transition-transform ${config.backgroundColor === color ? 'shadow-neo-sm translate-y-[-2px]' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleChange('backgroundColor', color)}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div>
         <label className="text-sm font-bold text-black dark:text-white uppercase tracking-wider block mb-2">Stroke Width: {config.strokeWidth}px</label>
         <input 
            type="range" 
            min="1" 
            max="10" 
            value={config.strokeWidth} 
            onChange={(e) => handleChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-4 bg-gray-200 border-2 border-black rounded-full appearance-none cursor-pointer accent-brand-600 hover:accent-brand-500"
         />
      </div>

      {/* Fill Style */}
       <div>
         <label className="text-sm font-bold text-black dark:text-white uppercase tracking-wider block mb-2">Fill Style</label>
         <div className="flex flex-wrap gap-2">
            {(['hachure', 'solid', 'dots'] as const).map(style => (
                <button
                    key={style}
                    onClick={() => handleChange('fillStyle', style)}
                    className={`px-3 py-1 text-sm font-bold border-2 border-black transition-all
                    ${config.fillStyle === style 
                        ? 'bg-neo-blue text-black shadow-neo-sm -translate-y-1' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                    {style}
                </button>
            ))}
         </div>
      </div>

    </div>
  );
};

export default PropertiesPanel;
