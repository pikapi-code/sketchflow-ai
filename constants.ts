import { CanvasConfig, ToolType } from "./types";

export const TOOLS: { id: ToolType; icon: string; label: string; shortcut: string }[] = [
  { id: 'selection', icon: 'mouse-pointer', label: 'Selection', shortcut: 'V' },
  { id: 'rectangle', icon: 'square', label: 'Rectangle', shortcut: 'R' },
  { id: 'diamond', icon: 'diamond', label: 'Diamond', shortcut: 'D' },
  { id: 'ellipse', icon: 'circle', label: 'Ellipse', shortcut: 'O' },
  { id: 'arrow', icon: 'arrow-right', label: 'Arrow', shortcut: 'A' },
  { id: 'line', icon: 'minus', label: 'Line', shortcut: 'L' },
  { id: 'scribble', icon: 'pencil', label: 'Draw', shortcut: 'P' },
  { id: 'text', icon: 'type', label: 'Text', shortcut: 'T' },
  { id: 'eraser', icon: 'eraser', label: 'Eraser', shortcut: 'E' },
];

export const DEFAULT_CONFIG: CanvasConfig = {
  strokeColor: "#000000",
  backgroundColor: "#ffffff",
  fillStyle: "solid",
  strokeWidth: 2,
  roughness: 1,
  opacity: 100,
  fontSize: 24,
};

export const COLORS = [
  "transparent",
  "#000000", // Hard Black
  "#ffffff", // White
  "#ff5252", // Vibrant Red
  "#448aff", // Vibrant Blue
  "#69f0ae", // Vibrant Green
  "#ffd740", // Vibrant Yellow
  "#e040fb", // Vibrant Purple
  "#ff6e40", // Vibrant Orange
  "#607d8b", // Blue Grey
];