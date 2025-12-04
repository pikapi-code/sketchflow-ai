export type ToolType = "selection" | "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "scribble" | "text" | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SketchElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "hachure" | "solid" | "zigzag" | "cross-hatch" | "dots" | "none";
  strokeWidth: number;
  roughness: number;
  opacity: number;
  points?: Point[]; // For scribble, arrow, line
  text?: string;    // For text tool
  fontSize?: number;
  fontFamily?: string;
  seed: number;     // Random seed for roughjs consistency
  isDeleted?: boolean;

  // For sticky lines
  startBinding?: string; // ID of element attached to start point
  endBinding?: string;   // ID of element attached to end point
}

export interface AppState {
  tool: ToolType;
  elements: SketchElement[];
  selection: string[]; // IDs of selected elements
  viewOffset: Point;   // Pan offset
  zoom: number;
  history: SketchElement[][];
  historyStep: number;
  isDragging: boolean;
  theme: 'light' | 'dark';
  isLoadingAI: boolean;
}

export interface CanvasConfig {
  strokeColor: string;
  backgroundColor: string;
  fillStyle: SketchElement['fillStyle'];
  strokeWidth: number;
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}