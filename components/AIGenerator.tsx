import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { generateDiagram } from '../services/geminiService';
import { SketchElement } from '../types';

interface AIGeneratorProps {
  onGenerate: (elements: SketchElement[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ onGenerate, isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const elements = await generateDiagram(prompt);
      onGenerate(elements);
      onClose();
      setPrompt('');
    } catch (err) {
        console.log(err);
      setError("Failed to generate diagram. Please check your API key or try a different prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neo-black w-full max-w-md shadow-neo border-4 border-black transition-all">
        <div className="p-4 border-b-4 border-black flex justify-between items-center bg-neo-purple text-black">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
            <Sparkles size={24} className="stroke-[3]" />
            Gemini Generator
          </h2>
          <button onClick={onClose} className="bg-white border-2 border-black p-1 hover:shadow-neo-sm hover:-translate-y-0.5 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-base font-medium text-black dark:text-white mb-4">
            Describe a system, process, or layout, and Gemini will draw it for you.
          </p>
          
          <textarea
            className="w-full p-4 text-lg font-mono border-2 border-black bg-gray-50 dark:bg-gray-900 text-black dark:text-white focus:shadow-neo-sm focus:outline-none resize-none h-40"
            placeholder="E.g., A flowchart showing user registration process with email verification."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {error && (
            <div className="mt-3 text-sm font-bold text-red-600 bg-red-100 border-2 border-red-600 p-2">
              {error}
            </div>
          )}

          <button
            disabled={loading || !prompt.trim()}
            onClick={handleGenerate}
            className="w-full mt-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 border-2 border-black shadow-neo hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? "Dreaming..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;