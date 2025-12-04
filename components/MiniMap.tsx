import React, { useState, useRef, useEffect } from "react";
import { SketchElement } from "../types";
import { X, GripHorizontal } from "lucide-react";
import rough from 'roughjs';
import { drawElement } from '../utils/draw';

interface MiniMapProps {
    elements: SketchElement[];
    viewOffset: { x: number; y: number };
    zoom: number;
    canvasWidth: number;
    canvasHeight: number;
    theme: 'light' | 'dark';
    isOpen: boolean;
    onClose: () => void;
    onViewportChange: (offset: { x: number; y: number }) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({
    elements,
    viewOffset,
    zoom,
    canvasWidth,
    canvasHeight,
    theme,
    isOpen,
    onClose,
    onViewportChange
}) => {
    const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 220 });
    const [size, setSize] = useState({ width: 200, height: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef({ x: 0, y: 0 });
    const startSizeRef = useRef({ width: 0, height: 0 });

    // Update position when window resizes
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - size.width - 20),
                y: Math.min(prev.y, window.innerHeight - size.height - 20)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [size]);

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
                const dy = e.clientY - dragStartRef.current.y;
                setSize({
                    width: Math.max(150, startSizeRef.current.width + dx),
                    height: Math.max(100, startSizeRef.current.height + dy)
                });
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

    // Render minimap
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (elements.length === 0) return;

        // Calculate bounds of all elements
        const xs: number[] = [];
        const ys: number[] = [];

        elements.forEach(el => {
            if (el.points && el.points.length > 0) {
                el.points.forEach(p => {
                    xs.push(p.x);
                    ys.push(p.y);
                });
            } else {
                xs.push(el.x, el.x + el.width);
                ys.push(el.y, el.y + el.height);
            }
        });

        if (xs.length === 0 || ys.length === 0) return;

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // Calculate scale to fit content in minimap
        const padding = 10;
        const availableWidth = canvas.width - padding * 2;
        const availableHeight = canvas.height - padding * 2;

        const scaleX = contentWidth > 0 ? availableWidth / contentWidth : 1;
        const scaleY = contentHeight > 0 ? availableHeight / contentHeight : 1;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

        ctx.save();
        ctx.translate(padding, padding);
        ctx.scale(scale, scale);
        ctx.translate(-minX, -minY);

        // Draw elements with better visibility
        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            try {
                ctx.save();
                ctx.globalAlpha = 1.0; // Full opacity for better visibility
                // Scale up stroke width for minimap visibility
                const enhancedEl = { ...el, strokeWidth: Math.max(el.strokeWidth * 1.5, 2) };
                drawElement(rc, ctx, enhancedEl, theme);
                ctx.restore();
            } catch (e) {
                // Skip elements that fail to render
                console.error('Error rendering element in minimap:', e);
            }
        });

        ctx.restore();

        // Draw viewport rectangle (hidden per user request)
        // const viewportX = padding + (-viewOffset.x / zoom - minX) * scale;
        // const viewportY = padding + (-viewOffset.y / zoom - minY) * scale;
        // const viewportW = (canvasWidth / zoom) * scale;
        // const viewportH = (canvasHeight / zoom) * scale;

        // ctx.strokeStyle = '#0ea5e9';
        // ctx.lineWidth = 2;
        // ctx.setLineDash([4, 4]);
        // ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
        // ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        // ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
        // ctx.setLineDash([]);

    }, [elements, viewOffset, zoom, canvasWidth, canvasHeight, theme, isOpen, size]);

    if (!isOpen) return null;

    const handleDragStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startPosRef.current = { ...position };
    };

    const handleResizeStart = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startSizeRef.current = { ...size };
    };

    return (
        <div
            className="fixed bg-white dark:bg-neo-black shadow-neo border-2 border-black z-40 transition-colors duration-200 flex flex-col"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                touchAction: 'none'
            }}
        >
            {/* Header */}
            <div
                className="bg-gray-100 dark:bg-gray-800 border-b-2 border-black p-1 flex items-center justify-between cursor-move select-none"
                onPointerDown={handleDragStart}
            >
                <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    <GripHorizontal size={12} />
                    <span>Map</span>
                </div>
                <button
                    onClick={onClose}
                    className="hover:bg-red-500 hover:text-white rounded p-0.5 transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <X size={12} />
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={size.width - 4}
                    height={size.height - 30}
                    className="w-full h-full cursor-pointer"
                    onClick={() => onViewportChange({ x: 0, y: 0 })}
                    title="Click to center canvas"
                />
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

export default MiniMap;
