import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import rough from 'roughjs';
import { nanoid } from 'nanoid';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import AIGenerator from './components/AIGenerator';
import MiniMap from './components/MiniMap';
import ShortcutsPanel from './components/ShortcutsPanel';
import { AppState, CanvasConfig, SketchElement, Point } from './types';
import { DEFAULT_CONFIG } from './constants';
import { drawElement } from './utils/draw';
import { getElementAtPosition, getElementsInsideBox, getSnapPoint, getResizeHandle, getCursorForHandle, ResizeHandle } from './utils/math';
import { Sparkles, Keyboard } from 'lucide-react';

const App = () => {
    // State
    const [elements, setElements] = useState<SketchElement[]>([]);
    const [appState, setAppState] = useState<AppState>({
        tool: 'selection',
        elements: [],
        selection: [],
        viewOffset: { x: 0, y: 0 },
        zoom: 1,
        history: [[]],
        historyStep: 0,
        isDragging: false,
        theme: 'light',
        isLoadingAI: false,
    });
    const [config, setConfig] = useState<CanvasConfig>(DEFAULT_CONFIG);
    const [action, setAction] = useState<'none' | 'drawing' | 'moving' | 'resizing' | 'panning' | 'erasing' | 'selecting' | 'pending_drawing'>('none');
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const [resizingElementId, setResizingElementId] = useState<string | null>(null);
    const [drawStartPos, setDrawStartPos] = useState<Point | null>(null);
    const [pendingElement, setPendingElement] = useState<SketchElement | null>(null);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showProperties, setShowProperties] = useState(true);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [showShortcutsPanel, setShowShortcutsPanel] = useState(true);

    // Selection Box State
    const [selectionStart, setSelectionStart] = useState<Point | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);

    // Pan state
    const [panStart, setPanStart] = useState<Point | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load theme
    useEffect(() => {
        if (appState.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [appState.theme]);

    // Focus textarea when editing
    useEffect(() => {
        if (editingId && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, [editingId]);

    // Sync config with selection if single item selected (Optional, but good UX)
    useEffect(() => {
        if (appState.selection.length === 1) {
            const el = elements.find(e => e.id === appState.selection[0]);
            if (el) {
                setConfig(prev => ({
                    ...prev,
                    strokeColor: el.strokeColor,
                    backgroundColor: el.backgroundColor,
                    fillStyle: el.fillStyle,
                    strokeWidth: el.strokeWidth,
                    roughness: el.roughness,
                    opacity: el.opacity,
                    fontSize: el.fontSize || 24
                }));
            }
        }
    }, [appState.selection, elements]);

    // History Helper (Deep Copy fix)
    const saveHistory = (newElements: SketchElement[], overwrite = false) => {
        // Deep clone to prevent reference issues
        const elementsCopy = JSON.parse(JSON.stringify(newElements));

        const newHistory = appState.history.slice(0, appState.historyStep + 1);
        if (overwrite && newHistory.length > 0) {
            newHistory[newHistory.length - 1] = elementsCopy;
        } else {
            newHistory.push(elementsCopy);
        }
        setAppState(prev => ({
            ...prev,
            history: newHistory,
            historyStep: newHistory.length - 1
        }));
        setElements(elementsCopy);
    };

    const undo = () => {
        if (appState.historyStep > 0) {
            const newStep = appState.historyStep - 1;
            const prevElements = JSON.parse(JSON.stringify(appState.history[newStep]));
            setAppState(prev => ({ ...prev, historyStep: newStep }));
            setElements(prevElements);
        }
    };

    const redo = () => {
        if (appState.historyStep < appState.history.length - 1) {
            const newStep = appState.historyStep + 1;
            const nextElements = JSON.parse(JSON.stringify(appState.history[newStep]));
            setAppState(prev => ({ ...prev, historyStep: newStep }));
            setElements(nextElements);
        }
    };

    const handlePropertyChange = (updates: Partial<SketchElement>) => {
        // 1. Update Global Config
        setConfig(prev => ({ ...prev, ...updates }));

        // 2. Update Selected Elements
        if (appState.selection.length > 0) {
            const newElements = elements.map(el => {
                if (appState.selection.includes(el.id)) {
                    return { ...el, ...updates };
                }
                return el;
            });
            setElements(newElements);
            saveHistory(newElements);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrl = e.ctrlKey || e.metaKey;

            // Select All - handle this first before other shortcuts
            // Only skip if actively editing text (editingId is set)
            if (isCtrl && e.key.toLowerCase() === 'a') {
                if (!editingId) {
                    e.preventDefault();
                    e.stopPropagation();
                    const allIds = elements.filter(el => !el.isDeleted).map(el => el.id);
                    setAppState(prev => ({ ...prev, selection: allIds, tool: 'selection' }));
                    return;
                }
                // If editing, let browser handle Ctrl+A for text selection
                return;
            }

            // If editing text in our app, ignore other shortcuts
            if (editingId) return;

            // Tools Shortcuts
            if (!isCtrl && !e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': setAppState(prev => ({ ...prev, tool: 'selection', selection: [] })); break;
                    case 'r': setAppState(prev => ({ ...prev, tool: 'rectangle', selection: [] })); break;
                    case 'd': setAppState(prev => ({ ...prev, tool: 'diamond', selection: [] })); break;
                    case 'o': setAppState(prev => ({ ...prev, tool: 'ellipse', selection: [] })); break;
                    case 'a': setAppState(prev => ({ ...prev, tool: 'arrow', selection: [] })); break;
                    case 'l': setAppState(prev => ({ ...prev, tool: 'line', selection: [] })); break;
                    case 'p': setAppState(prev => ({ ...prev, tool: 'scribble', selection: [] })); break;
                    case 't': setAppState(prev => ({ ...prev, tool: 'text', selection: [] })); break;
                    case 'e': setAppState(prev => ({ ...prev, tool: 'eraser', selection: [] })); break;
                    case 'enter':
                        if (appState.selection.length === 1) {
                            const selectedEl = elements.find(el => el.id === appState.selection[0]);
                            if (selectedEl) {
                                // Ensure element has a reasonable default font size if not set
                                if (!selectedEl.fontSize) {
                                    const updatedEl = { ...selectedEl, fontSize: 16 };
                                    const index = elements.findIndex(el => el.id === selectedEl.id);
                                    if (index > -1) {
                                        const copy = [...elements];
                                        copy[index] = updatedEl;
                                        setElements(copy);
                                    }
                                }
                                setEditingId(appState.selection[0]);
                            }
                        }
                        break;
                    case 'escape':
                        setAppState(prev => ({ ...prev, tool: 'selection', selection: [] }));
                        setAction('none');
                        break;
                }
            }

            // Undo
            if (isCtrl && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }

            // Redo (Ctrl+Y)
            if (isCtrl && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }

            // Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (appState.selection.length > 0) {
                    const newElements = elements.filter(el => !appState.selection.includes(el.id));
                    saveHistory(newElements);
                    setAppState(prev => ({ ...prev, selection: [] }));
                }
            }
        };
        // Use document instead of window and capture phase to ensure we catch the event
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [elements, appState.selection, editingId, appState.history, appState.historyStep, undo, redo, saveHistory]);

    // Canvas Rendering
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Setup RoughJS
        const rc = rough.canvas(canvas);

        // Handle Pan/Zoom transformation
        context.save();
        context.translate(appState.viewOffset.x, appState.viewOffset.y);
        context.scale(appState.zoom, appState.zoom);

        elements.forEach(element => {
            // Draw all elements, but skip text rendering for the one being edited
            if (element.id === editingId) {
                // Draw the shape but without text to avoid duplication
                const elementWithoutText = { ...element, text: undefined };
                drawElement(rc, context, elementWithoutText, appState.theme);
            } else {
                drawElement(rc, context, element, appState.theme);
            }
        });

        // Draw Selection Box and Handles for Elements
        if (appState.selection.length > 0 && (appState.tool === 'selection' || action === 'moving' || action === 'resizing')) {
            const selectedEls = elements.filter(el => appState.selection.includes(el.id));
            selectedEls.forEach(el => {
                // Main Bounding Box
                context.strokeStyle = "#0ea5e9";
                context.lineWidth = 2;
                context.setLineDash([5, 5]);

                if (el.type === 'line' || el.type === 'arrow') {
                    // For lines, just highlight the path approx or endpoints
                    if (el.points) {
                        const [start, end] = el.points;
                        context.beginPath();
                        context.moveTo(start.x, start.y);
                        context.lineTo(end.x, end.y);
                        context.stroke();

                        // Draw Handles
                        context.setLineDash([]);
                        context.fillStyle = "#ffffff";
                        context.beginPath();
                        context.arc(start.x, start.y, 6, 0, Math.PI * 2);
                        context.fill();
                        context.stroke();

                        context.beginPath();
                        context.arc(end.x, end.y, 6, 0, Math.PI * 2);
                        context.fill();
                        context.stroke();
                    }
                } else {
                    context.strokeRect(el.x - 5, el.y - 5, el.width + 10, el.height + 10);

                    // Draw 8 handles
                    context.setLineDash([]);
                    context.fillStyle = "#ffffff";
                    const x1 = el.x - 5;
                    const y1 = el.y - 5;
                    const x2 = el.x + el.width + 5;
                    const y2 = el.y + el.height + 5;
                    const cx = (x1 + x2) / 2;
                    const cy = (y1 + y2) / 2;

                    const handles = [
                        { x: x1, y: y1 }, { x: cx, y: y1 }, { x: x2, y: y1 },
                        { x: x1, y: cy }, { x: x2, y: cy },
                        { x: x1, y: y2 }, { x: cx, y: y2 }, { x: x2, y: y2 }
                    ];

                    handles.forEach(h => {
                        context.beginPath();
                        context.rect(h.x - 4, h.y - 4, 8, 8);
                        context.fill();
                        context.stroke();
                    });
                }
                context.setLineDash([]);
            });
        }

        // Draw Drag Selection Marquee
        if (action === 'selecting' && selectionStart && selectionEnd) {
            const x = Math.min(selectionStart.x, selectionEnd.x);
            const y = Math.min(selectionStart.y, selectionEnd.y);
            const w = Math.abs(selectionStart.x - selectionEnd.x);
            const h = Math.abs(selectionStart.y - selectionEnd.y);

            context.fillStyle = "rgba(14, 165, 233, 0.1)";
            context.strokeStyle = "#0ea5e9";
            context.lineWidth = 1;
            context.setLineDash([]);
            context.fillRect(x, y, w, h);
            context.strokeRect(x, y, w, h);
        }

        context.restore();

    }, [elements, appState.viewOffset, appState.zoom, appState.selection, appState.theme, editingId, action, selectionStart, selectionEnd]);


    // Event Handlers
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (editingId) return; // Don't handle double click if already editing

        const { clientX, clientY } = e;
        // Adjust coordinates for zoom/pan
        const x = (clientX - appState.viewOffset.x) / appState.zoom;
        const y = (clientY - appState.viewOffset.y) / appState.zoom;

        // Check if double-clicking on an element
        const element = getElementAtPosition(x, y, elements);
        if (element) {
            // Ensure element has a reasonable default font size if not set
            if (!element.fontSize) {
                const updatedEl = { ...element, fontSize: element.type === 'text' ? 24 : 16 };
                const index = elements.findIndex(el => el.id === element.id);
                if (index > -1) {
                    const copy = [...elements];
                    copy[index] = updatedEl;
                    setElements(copy);
                }
            }
            setEditingId(element.id);
            setAppState(prev => ({ ...prev, selection: [element.id] }));
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        const { clientX, clientY } = e;
        // Adjust coordinates for zoom/pan
        const x = (clientX - appState.viewOffset.x) / appState.zoom;
        const y = (clientY - appState.viewOffset.y) / appState.zoom;

        // If text tool is selected, always create new text (close any existing editing first)
        if (appState.tool === 'text') {
            if (editingId) {
                setEditingId(null);
            }
            e.preventDefault();
            e.stopPropagation();
            const id = nanoid();
            const newEl: SketchElement = {
                id, type: 'text', x, y, width: 200, height: 40,
                strokeColor: config.strokeColor, backgroundColor: config.backgroundColor || '#ffffff',
                fillStyle: 'solid', strokeWidth: config.strokeWidth, roughness: 0, opacity: 100,
                seed: Math.random(), text: "", fontSize: config.fontSize || 24
            };
            const updatedElements = [...elements, newEl];
            setElements(updatedElements);
            setEditingId(id);
            setAppState(prev => ({ ...prev, selection: [id] }));
            return;
        }

        // For other tools, close editing if active
        if (editingId) {
            setEditingId(null);
            return;
        }

        if (appState.tool === 'selection') {
            // 1. Check if clicking a handle of a selected line
            const selectedElements = elements.filter(el => appState.selection.includes(el.id));
            for (const el of selectedElements) {
                const handle = getResizeHandle(x, y, el);
                if (handle) {
                    setResizingElementId(el.id);
                    setResizeHandle(handle);
                    setAction('resizing');
                    return;
                }
            }

            // 2. Normal hit testing
            const element = getElementAtPosition(x, y, elements);
            if (element) {
                // Element clicked
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    // Toggle selection
                    if (appState.selection.includes(element.id)) {
                        setAppState(prev => ({ ...prev, selection: prev.selection.filter(id => id !== element.id) }));
                    } else {
                        setAppState(prev => ({ ...prev, selection: [...prev.selection, element.id] }));
                    }
                } else {
                    if (!appState.selection.includes(element.id)) {
                        // If clicking an unselected element, select only it
                        setAppState(prev => ({ ...prev, selection: [element.id] }));
                    }
                    // If clicking a selected element, keep current selection (allows moving group)
                }
                setAction('moving');
            } else {
                // Empty space clicked - Start Box Selection or Panning
                // Store initial click position for panning detection
                setPanStart({ x: clientX, y: clientY });
                setAction('selecting');
                setSelectionStart({ x, y });
                setSelectionEnd({ x, y });
                if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    setAppState(prev => ({ ...prev, selection: [] }));
                }
            }
        } else if (appState.tool === 'eraser') {
            const element = getElementAtPosition(x, y, elements);
            if (element) {
                const newElements = elements.filter(el => el.id !== element.id);
                saveHistory(newElements);
            }
            setAction('erasing');
        } else {
            // Store initial position and prepare element data, but don't create yet
            // Element will only be created when user actually drags
            const id = nanoid();
            let startBinding = undefined;
            let points = undefined;

            // Sticky Line Logic: Check if starting on a shape
            if (appState.tool === 'line' || appState.tool === 'arrow') {
                const hitEl = getElementAtPosition(x, y, elements);
                if (hitEl && hitEl.type !== 'line' && hitEl.type !== 'arrow' && hitEl.type !== 'scribble') {
                    startBinding = hitEl.id;
                    // Snap start point
                    const snap = getSnapPoint(hitEl, { x, y });
                    points = [{ x: snap.x, y: snap.y }];
                } else {
                    points = [{ x, y }];
                }
            } else if (appState.tool === 'scribble') {
                points = [{ x, y }];
            }

            const newEl: SketchElement = {
                id,
                type: appState.tool,
                x: points ? points[0].x : x,
                y: points ? points[0].y : y,
                width: 0, height: 0,
                strokeColor: config.strokeColor,
                backgroundColor: config.backgroundColor || '#ffffff',
                fillStyle: config.fillStyle,
                strokeWidth: config.strokeWidth,
                roughness: config.roughness,
                opacity: config.opacity,
                seed: Math.floor(Math.random() * 2 ** 31),
                points: points || [],
                startBinding: startBinding,
                fontSize: config.fontSize,
                fontFamily: config.fontFamily
            };
            
            // Store initial position and pending element, but don't add to elements yet
            setDrawStartPos({ x: clientX, y: clientY });
            setPendingElement(newEl);
            setAction('pending_drawing');
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const { clientX, clientY } = e;
        const x = (clientX - appState.viewOffset.x) / appState.zoom;
        const y = (clientY - appState.viewOffset.y) / appState.zoom;

        // Check if we should start drawing (user has dragged)
        let shouldProcessDrawing = false;
        let currentElements = elements;
        
        if (action === 'pending_drawing' && drawStartPos && pendingElement) {
            const dx = clientX - drawStartPos.x;
            const dy = clientY - drawStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If moved more than 5 pixels, create the element and start drawing
            if (distance > 5) {
                currentElements = [...elements, pendingElement];
                setElements(currentElements);
                setAppState(prev => ({ ...prev, selection: [pendingElement.id] }));
                setAction('drawing');
                setDrawStartPos(null);
                setPendingElement(null);
                // Continue processing drawing in this same call
                shouldProcessDrawing = true;
            } else {
                // Not enough movement yet, wait
                return;
            }
        }

        if (action === 'selecting') {
            // Check if we should switch to panning mode
            // If mouse has moved significantly from initial click position, switch to panning
            if (panStart) {
                const dx = clientX - panStart.x;
                const dy = clientY - panStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If moved more than 5 pixels, switch to panning
                if (distance > 5) {
                    setAction('panning');
                    setPanStart(null);
                    setSelectionStart(null);
                    setSelectionEnd(null);
                    // Execute panning immediately
                    setAppState(prev => ({
                        ...prev,
                        viewOffset: {
                            x: prev.viewOffset.x + e.movementX,
                            y: prev.viewOffset.y + e.movementY
                        }
                    }));
                    return;
                }
            }
            // Still selecting, update selection box
            setSelectionEnd({ x, y });
            if (selectionStart) {
                const box = {
                    x: Math.min(selectionStart.x, x),
                    y: Math.min(selectionStart.y, y),
                    width: Math.abs(x - selectionStart.x),
                    height: Math.abs(y - selectionStart.y)
                };
                const ids = getElementsInsideBox(elements, box);
                setAppState(prev => ({ ...prev, selection: ids }));
            }
            return;
        }

        if (action === 'panning') {
            setAppState(prev => ({
                ...prev,
                viewOffset: {
                    x: prev.viewOffset.x + e.movementX,
                    y: prev.viewOffset.y + e.movementY
                }
            }));
            return;
        }

        if (action === 'erasing') {
            const element = getElementAtPosition(x, y, elements);
            if (element) {
                const newElements = elements.filter(el => el.id !== element.id);
                if (newElements.length !== elements.length) {
                    setElements(newElements);
                }
            }
            return;
        }

        // Dragging a Line Endpoint (Resizing)
        if (action === 'resizing' && resizingElementId && resizeHandle) {
            const index = elements.findIndex(el => el.id === resizingElementId);
            if (index > -1) {
                const el = elements[index];
                if ((el.type === 'line' || el.type === 'arrow') && el.points) {
                    const newPoints = [...el.points];
                    let bindingId = undefined;
                    let targetX = x;
                    let targetY = y;

                    // Check snapping
                    const hitEl = getElementAtPosition(x, y, elements);
                    if (hitEl && hitEl.id !== el.id && hitEl.type !== 'line' && hitEl.type !== 'arrow' && hitEl.type !== 'scribble') {
                        const snap = getSnapPoint(hitEl, { x, y });
                        targetX = snap.x;
                        targetY = snap.y;
                        bindingId = hitEl.id;
                    }

                    if (resizeHandle === 'start') {
                        newPoints[0] = { x: targetX, y: targetY };
                    } else {
                        newPoints[1] = { x: targetX, y: targetY };
                    }

                    const updatedEl = {
                        ...el,
                        points: newPoints,
                        startBinding: resizeHandle === 'start' ? bindingId : el.startBinding,
                        endBinding: resizeHandle === 'end' ? bindingId : el.endBinding,
                        // Re-calculate bbox for efficiency (rough)
                        x: Math.min(newPoints[0].x, newPoints[1].x),
                        y: Math.min(newPoints[0].y, newPoints[1].y),
                        width: Math.abs(newPoints[0].x - newPoints[1].x),
                        height: Math.abs(newPoints[0].y - newPoints[1].y)
                    };

                    const copy = [...elements];
                    copy[index] = updatedEl;
                    setElements(copy);
                } else {
                    // Box resizing
                    // We need to calculate based on the handle
                    // We need to preserve the aspect of the "opposite" side
                    const { x: elX, y: elY, width: elW, height: elH } = el;

                    // Current bounds
                    const right = elX + elW;
                    const bottom = elY + elH;

                    let newX = elX;
                    let newY = elY;
                    let newW = elW;
                    let newH = elH;

                    if (resizeHandle === 'nw' || resizeHandle === 'w' || resizeHandle === 'sw') {
                        newX = x;
                        newW = right - x;
                    }
                    if (resizeHandle === 'ne' || resizeHandle === 'e' || resizeHandle === 'se') {
                        newW = x - elX;
                    }
                    if (resizeHandle === 'nw' || resizeHandle === 'n' || resizeHandle === 'ne') {
                        newY = y;
                        newH = bottom - y;
                    }
                    if (resizeHandle === 'sw' || resizeHandle === 's' || resizeHandle === 'se') {
                        newH = y - elY;
                    }

                    // Handle negative width/height (flipping)
                    if (newW < 0) {
                        newX += newW;
                        newW = Math.abs(newW);
                    }
                    if (newH < 0) {
                        newY += newH;
                        newH = Math.abs(newH);
                    }

                    const updatedEl = {
                        ...el,
                        x: newX,
                        y: newY,
                        width: newW,
                        height: newH
                    };
                    const copy = [...elements];
                    copy[index] = updatedEl;
                    setElements(copy);
                }
            }
            return;
        }

        if (action === 'drawing' || shouldProcessDrawing) {
            // Use currentElements if we just created it, otherwise use elements
            const workingElements = shouldProcessDrawing ? currentElements : elements;
            const index = workingElements.length - 1;
            const el = workingElements[index];

            if (!el) return;

            const { x: startX, y: startY } = el;

            if (el.type === 'scribble') {
                const newPoints = [...(el.points || []), { x, y }];
                const xs = newPoints.map(p => p.x);
                const ys = newPoints.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                const updatedEl = { ...el, points: newPoints, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                const copy = [...workingElements];
                copy[index] = updatedEl;
                setElements(copy);
            } else if (el.type === 'arrow' || el.type === 'line') {
                // Check for snapping on end
                let endX = x;
                let endY = y;
                let endBindingId = undefined;

                const hitEl = getElementAtPosition(x, y, workingElements);
                // Don't snap to self or scribble
                if (hitEl && hitEl.id !== el.id && hitEl.type !== 'scribble' && hitEl.type !== 'line' && hitEl.type !== 'arrow') {
                    const snap = getSnapPoint(hitEl, { x, y });
                    endX = snap.x;
                    endY = snap.y;
                    endBindingId = hitEl.id;
                }

                const updatedEl = {
                    ...el,
                    width: endX - startX,
                    height: endY - startY,
                    points: [{ x: startX, y: startY }, { x: endX, y: endY }],
                    endBinding: endBindingId
                };
                const copy = [...workingElements];
                copy[index] = updatedEl;
                setElements(copy);
            } else {
                const width = x - startX;
                const height = y - startY;
                const updatedEl = {
                    ...el,
                    width: Math.abs(width),
                    height: Math.abs(height),
                    x: width < 0 ? x : startX,
                    y: height < 0 ? y : startY
                };
                const copy = [...workingElements];
                copy[index] = updatedEl;
                setElements(copy);
            }
        } else if (action === 'moving') {
            // Move all selected elements
            const dx = e.movementX / appState.zoom;
            const dy = e.movementY / appState.zoom;

            const newElements = elements.map(el => {
                // Update Selected Elements
                if (appState.selection.includes(el.id)) {
                    let updatedEl = { ...el, x: el.x + dx, y: el.y + dy };
                    if (el.points) {
                        // Move points for scribbles, lines, and arrows
                        updatedEl.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                        // Update bounding box for lines/arrows
                        if (el.type === 'line' || el.type === 'arrow') {
                            const xs = updatedEl.points.map(p => p.x);
                            const ys = updatedEl.points.map(p => p.y);
                            updatedEl.x = Math.min(...xs);
                            updatedEl.y = Math.min(...ys);
                            updatedEl.width = Math.max(...xs) - updatedEl.x;
                            updatedEl.height = Math.max(...ys) - updatedEl.y;
                        }
                    }
                    return updatedEl;
                }

                // Update Attached Lines (that are NOT selected)
                // Move attached lines when their binding element is selected
                // BUT: if the line is also selected, it's already being moved above, so skip it here
                if (!appState.selection.includes(el.id) && (el.type === 'line' || el.type === 'arrow') && el.points) {
                    const startBindingEl = el.startBinding ? elements.find(e => e.id === el.startBinding) : null;
                    const endBindingEl = el.endBinding ? elements.find(e => e.id === el.endBinding) : null;

                    // Only move if the binding element exists AND is selected
                    const startAttachedToSelection = el.startBinding && startBindingEl && appState.selection.includes(el.startBinding);
                    const endAttachedToSelection = el.endBinding && endBindingEl && appState.selection.includes(el.endBinding);

                    if (startAttachedToSelection || endAttachedToSelection) {
                        const newPoints = [...el.points];
                        if (startAttachedToSelection) {
                            newPoints[0] = { x: newPoints[0].x + dx, y: newPoints[0].y + dy };
                        }
                        if (endAttachedToSelection) {
                            newPoints[1] = { x: newPoints[1].x + dx, y: newPoints[1].y + dy };
                        }
                        return {
                            ...el,
                            points: newPoints,
                            // Update bounding box for lines
                            x: Math.min(newPoints[0].x, newPoints[1].x),
                            y: Math.min(newPoints[0].y, newPoints[1].y),
                            width: Math.abs(newPoints[0].x - newPoints[1].x),
                            height: Math.abs(newPoints[0].y - newPoints[1].y)
                        };
                    }
                }

                return el;
            });
            setElements(newElements);
        }
    };

    const handlePointerUp = () => {
        // If we were pending drawing but never actually created the element, clean up
        if (action === 'pending_drawing') {
            setPendingElement(null);
            setDrawStartPos(null);
        }
        
        if (action === 'drawing' || action === 'moving' || action === 'erasing' || action === 'resizing') {
            saveHistory(elements);
        }
        setAction('none');
        setSelectionStart(null);
        setSelectionEnd(null);
        setPanStart(null);
        setResizingElementId(null);
        setResizeHandle(null);
        setPendingElement(null);
        setDrawStartPos(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Pan
        if (!e.ctrlKey && !e.metaKey) {
            setAppState(prev => ({
                ...prev,
                viewOffset: {
                    x: prev.viewOffset.x - e.deltaX,
                    y: prev.viewOffset.y - e.deltaY
                }
            }));
        } else {
            // Zoom towards cursor
            e.preventDefault();
            const scaleFactor = 1.1;
            const scale = e.deltaY < 0 ? scaleFactor : 1 / scaleFactor;
            const newZoom = Math.max(0.1, Math.min(20, appState.zoom * scale));

            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calculate world coordinates of the mouse before zoom
            const worldX = (mouseX - appState.viewOffset.x) / appState.zoom;
            const worldY = (mouseY - appState.viewOffset.y) / appState.zoom;

            // Calculate new offset to keep the world point at the same screen position
            const newOffsetX = mouseX - worldX * newZoom;
            const newOffsetY = mouseY - worldY * newZoom;

            setAppState(prev => ({
                ...prev,
                zoom: newZoom,
                viewOffset: { x: newOffsetX, y: newOffsetY }
            }));
        }
    };

    const handleTextChange = (id: string, text: string) => {
        const index = elements.findIndex(el => el.id === id);
        if (index > -1) {
            const el = elements[index];
            const updatedEl = { ...el, text };
            const copy = [...elements];
            copy[index] = updatedEl;
            setElements(copy);
        }
    };

    const handleTextBlur = () => {
        setEditingId(null);
        const cleanElements = elements.filter(el => el.type !== 'text' || (el.text && el.text.trim().length > 0));
        if (cleanElements.length !== elements.length) {
            setElements(cleanElements);
            saveHistory(cleanElements, true);
        } else {
            saveHistory(elements);
        }
    };

    // Resize canvas handler
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                setAppState(prev => ({ ...prev }));
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const handleAIResults = (newElements: SketchElement[]) => {
        const centerX = (-appState.viewOffset.x + window.innerWidth / 2) / appState.zoom;
        const centerY = (-appState.viewOffset.y + window.innerHeight / 2) / appState.zoom;

        const xs = newElements.map(e => e.x);
        const ys = newElements.map(e => e.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const groupWidth = maxX - minX;
        const groupHeight = maxY - minY;

        const offsetX = centerX - minX - groupWidth / 2;
        const offsetY = centerY - minY - groupHeight / 2;

        const centeredElements = newElements.map(el => {
            const newPoints = el.points ? el.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY })) : undefined;
            return {
                ...el,
                x: el.x + offsetX,
                y: el.y + offsetY,
                points: newPoints
            };
        });

        saveHistory([...elements, ...centeredElements]);
    };

    const exportImage = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Create a temporary canvas to fill background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                // Fill background based on theme (White for light, Black for dark as requested)
                ctx.fillStyle = appState.theme === 'light' ? '#ffffff' : '#121212';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                ctx.drawImage(canvas, 0, 0);

                const link = document.createElement('a');
                link.download = `sketchflow-${new Date().toISOString()}.png`;
                link.href = tempCanvas.toDataURL();
                link.click();
            }
        }
    };

    const editingElement = editingId ? elements.find(el => el.id === editingId) : null;



    return (
        <div className="w-screen h-screen overflow-hidden relative touch-none select-none font-sans">
            <ShortcutsPanel 
                isOpen={showShortcutsPanel}
                onClose={() => setShowShortcutsPanel(false)}
            />
            
            <Toolbar
                appState={appState}
                setTool={(t) => setAppState(prev => ({ ...prev, tool: t, selection: [] }))}
                undo={undo}
                redo={redo}
                toggleTheme={() => setAppState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
                exportImage={exportImage}
                showProperties={showProperties}
                toggleProperties={() => setShowProperties(!showProperties)}
                showMiniMap={showMiniMap}
                toggleMiniMap={() => setShowMiniMap(!showMiniMap)}
                showShortcutsPanel={showShortcutsPanel}
                toggleShortcutsPanel={() => setShowShortcutsPanel(!showShortcutsPanel)}
            />

            <PropertiesPanel
                isOpen={showProperties && (appState.selection.length > 0 || appState.tool !== 'selection')}
                onClose={() => setShowProperties(false)}
                config={config}
                onChange={handlePropertyChange}
            />

            <MiniMap
                elements={elements}
                viewOffset={appState.viewOffset}
                zoom={appState.zoom}
                canvasWidth={window.innerWidth}
                canvasHeight={window.innerHeight}
                theme={appState.theme}
                isOpen={showMiniMap}
                onClose={() => setShowMiniMap(false)}
                onViewportChange={(offset) => setAppState(prev => ({ ...prev, viewOffset: offset }))}
            />

            <button
                onClick={() => setShowShortcutsPanel(!showShortcutsPanel)}
                className={`fixed top-4 right-4 p-3 shadow-neo border-2 border-black z-50 flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-neo ${
                    showShortcutsPanel 
                        ? 'bg-neo-purple text-black' 
                        : 'bg-white dark:bg-gray-800 text-black dark:text-white'
                }`}
                title="Toggle Keyboard Shortcuts"
            >
                <Keyboard className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
                onClick={() => setIsAIModalOpen(true)}
                className="fixed bottom-6 right-4 bg-brand-500 hover:bg-brand-600 text-white p-4 shadow-neo border-2 border-black z-50 flex items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-neo"
            >
                <Sparkles className="w-6 h-6 stroke-[3]" />
                <span className="font-black hidden sm:inline uppercase tracking-wider">AI Generate</span>
            </button>

            <AIGenerator
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onGenerate={handleAIResults}
            />

            {editingElement && editingElement.id && (() => {
                const isTextType = editingElement.type === 'text';
                let left = editingElement.x;
                let top = editingElement.y;
                let width = Math.max(200, editingElement.width);
                let height = Math.max(40, editingElement.height);
                let textAlign: 'left' | 'center' = 'center';
                let transform = 'none';

                // Always center-align text, even for text type elements
                if (isTextType) {
                    // For text elements, center them based on their position
                    left = editingElement.x + editingElement.width / 2;
                    top = editingElement.y + editingElement.height / 2;
                    transform = 'translate(-50%, -50%)';
                } else {
                    textAlign = 'center';
                    let cx = editingElement.x + editingElement.width / 2;
                    let cy = editingElement.y + editingElement.height / 2;

                    if ((editingElement.type === 'line' || editingElement.type === 'arrow') && editingElement.points && editingElement.points.length >= 2) {
                        const [p1, p2] = editingElement.points;
                        cx = (p1.x + p2.x) / 2;
                        cy = (p1.y + p2.y) / 2;
                    }
                    left = cx;
                    top = cy;
                    transform = 'translate(-50%, -50%)';
                }

                return (
                    <textarea
                        ref={textareaRef}
                        className="fixed bg-transparent outline-none p-0 m-0 resize-none overflow-hidden z-50 select-text"
                        style={{
                            left: left * appState.zoom + appState.viewOffset.x,
                            top: top * appState.zoom + appState.viewOffset.y,
                            fontSize: (editingElement.fontSize || (editingElement.type === 'text' ? 24 : 16)) * appState.zoom,
                            fontFamily: editingElement.fontFamily || 'sans-serif',
                            width: width * appState.zoom,
                            height: height * appState.zoom,
                            color: appState.theme === 'dark' ? '#ffffff' : (editingElement.strokeColor === '#ffffff' ? '#000000' : editingElement.strokeColor),
                            textAlign,
                            transform,
                            lineHeight: 1.2
                        }}
                        value={editingElement.text || ""}
                        onChange={(e) => handleTextChange(editingElement.id, e.target.value)}
                        onBlur={handleTextBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.currentTarget.blur();
                            }
                            e.stopPropagation();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder="Type here..."
                    />
                );
            })()}

            <canvas
                ref={canvasRef}
                tabIndex={0}
                className="block touch-none cursor-crosshair active:cursor-grabbing bg-dots-light dark:bg-dots-dark"
                style={{
                    width: '100vw',
                    height: '100vh',
                    cursor: action === 'panning' ? 'grabbing' :
                        (action === 'resizing' && resizeHandle ? getCursorForHandle(resizeHandle) :
                            (appState.tool === 'selection' ? 'default' : (appState.tool === 'eraser' ? 'cell' : 'crosshair'))),
                    backgroundSize: '20px 20px',
                    backgroundImage: appState.theme === 'light'
                        ? 'radial-gradient(circle, #000000 1px, transparent 1px)'
                        : 'radial-gradient(circle, #333333 1px, transparent 1px)'
                }}
                onPointerDown={(e) => {
                    // Focus canvas on click to ensure keyboard events work
                    if (canvasRef.current) {
                        canvasRef.current.focus();
                    }
                    handlePointerDown(e);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
            />

            <div className="fixed bottom-2 left-4 text-xs font-bold text-black dark:text-gray-500 pointer-events-none select-none uppercase tracking-widest bg-white dark:bg-black p-1 border border-black dark:border-gray-700">
                {elements.length} elements | Zoom: {Math.round(appState.zoom * 100)}%
            </div>
        </div>
    );
};

export default App;
