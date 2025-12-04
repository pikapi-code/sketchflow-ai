import { SketchElement, Point, Box } from "../types";

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const isPointNearLine = (x1: number, y1: number, x2: number, y2: number, px: number, py: number, tolerance: number = 5) => {
    const d = distance({ x: x1, y: y1 }, { x: x2, y: y2 });
    const d1 = distance({ x: x1, y: y1 }, { x: px, y: py });
    const d2 = distance({ x: x2, y: y2 }, { x: px, y: py });
    return Math.abs(d - (d1 + d2)) < tolerance / 10; // Simple approximation
};

export const getElementAtPosition = (x: number, y: number, elements: SketchElement[]): SketchElement | null => {
    // Iterate in reverse to select top-most element
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.isDeleted) continue;

        if (el.type === 'rectangle' || el.type === 'ellipse' || el.type === 'diamond' || el.type === 'text') {
            // Text is technically a box too
            const right = el.x + (el.width || 10);
            const bottom = el.y + (el.height || 10);

            // Slightly looser hit testing for ease of use
            const tolerance = 5;
            if (x >= el.x - tolerance && x <= right + tolerance && y >= el.y - tolerance && y <= bottom + tolerance) {
                return el;
            }
        } else if (el.type === 'arrow' || el.type === 'line') {
            if (el.points && el.points.length >= 2) {
                const [start, end] = el.points;
                if (isPointNearLine(start.x, start.y, end.x, end.y, x, y, 15)) return el;
            }
        } else if (el.type === 'scribble') {
            const right = el.x + el.width;
            const bottom = el.y + el.height;
            if (x >= el.x && x <= right && y >= el.y && y <= bottom) {
                return el;
            }
        }
    }
    return null;
};

export const getElementsInsideBox = (elements: SketchElement[], box: Box): string[] => {
    const x1 = Math.min(box.x, box.x + box.width);
    const x2 = Math.max(box.x, box.x + box.width);
    const y1 = Math.min(box.y, box.y + box.height);
    const y2 = Math.max(box.y, box.y + box.height);

    return elements
        .filter(el => !el.isDeleted)
        .filter(el => {
            const elX1 = el.x;
            const elX2 = el.x + el.width;
            const elY1 = el.y;
            const elY2 = el.y + el.height;

            return (
                elX1 < x2 && elX2 > x1 &&
                elY1 < y2 && elY2 > y1
            );
        })
        .map(el => el.id);
};

// Calculate the point on the element border that is closest to the given point
// Uses simple ray casting from center for Rect/Ellipse/Diamond
// Calculate the point on the element border that is closest to the given point
// Uses simple ray casting from center for Rect/Ellipse/Diamond
export const getSnapPoint = (element: SketchElement, point: Point): Point => {
    const x1 = element.x;
    const y1 = element.y;
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    let anchors: Point[] = [];

    if (element.type === 'ellipse') {
        // For ellipse, we want 8 points on the circumference
        // 0, 45, 90, 135, 180, 225, 270, 315 degrees
        const rx = element.width / 2;
        const ry = element.height / 2;
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        anchors = angles.map(deg => {
            const rad = (deg * Math.PI) / 180;
            return {
                x: cx + rx * Math.cos(rad),
                y: cy + ry * Math.sin(rad)
            };
        });
    } else if (element.type === 'diamond') {
        // For diamond, the 4 main points are the vertices (midpoints of bbox sides)
        // The other 4 points (corners of bbox) should map to the midpoints of the diamond edges
        anchors = [
            { x: cx, y: y1 }, // Top Vertex (N)
            { x: x2, y: cy }, // Right Vertex (E)
            { x: cx, y: y2 }, // Bottom Vertex (S)
            { x: x1, y: cy }, // Left Vertex (W)
            // Midpoints of edges
            { x: (cx + x2) / 2, y: (y1 + cy) / 2 }, // NE Edge Midpoint
            { x: (x2 + cx) / 2, y: (cy + y2) / 2 }, // SE Edge Midpoint
            { x: (cx + x1) / 2, y: (y2 + cy) / 2 }, // SW Edge Midpoint
            { x: (x1 + cx) / 2, y: (cy + y1) / 2 }, // NW Edge Midpoint
        ];
    } else {
        // Rectangle / Text / Default
        anchors = [
            { x: x1, y: y1 }, // nw
            { x: cx, y: y1 }, // n
            { x: x2, y: y1 }, // ne
            { x: x2, y: cy }, // e
            { x: x2, y: y2 }, // se
            { x: cx, y: y2 }, // s
            { x: x1, y: y2 }, // sw
            { x: x1, y: cy }, // w
        ];
    }

    let closestPoint = anchors[0];
    let minDistance = Infinity;

    for (const anchor of anchors) {
        const d = distance(point, anchor);
        if (d < minDistance) {
            minDistance = d;
            closestPoint = anchor;
        }
    }

    return closestPoint;
};

export type ResizeHandle = 'start' | 'end' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

export const getResizeHandle = (x: number, y: number, element: SketchElement): ResizeHandle | null => {
    const threshold = 10;
    if ((element.type === 'line' || element.type === 'arrow') && element.points) {
        const [start, end] = element.points;
        if (distance({ x, y }, start) < threshold) return 'start';
        if (distance({ x, y }, end) < threshold) return 'end';
    } else {
        // Box handles
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x + element.width;
        const y2 = element.y + element.height;
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;

        // Corners
        if (distance({ x, y }, { x: x1, y: y1 }) < threshold) return 'nw';
        if (distance({ x, y }, { x: x2, y: y1 }) < threshold) return 'ne';
        if (distance({ x, y }, { x: x2, y: y2 }) < threshold) return 'se';
        if (distance({ x, y }, { x: x1, y: y2 }) < threshold) return 'sw';

        // Sides
        if (Math.abs(x - cx) < threshold && Math.abs(y - y1) < threshold) return 'n';
        if (Math.abs(x - cx) < threshold && Math.abs(y - y2) < threshold) return 's';
        if (Math.abs(x - x1) < threshold && Math.abs(y - cy) < threshold) return 'w';
        if (Math.abs(x - x2) < threshold && Math.abs(y - cy) < threshold) return 'e';
    }
    return null;
};

export const getCursorForHandle = (handle: ResizeHandle): string => {
    switch (handle) {
        case 'n': return 'ns-resize';
        case 's': return 'ns-resize';
        case 'w': return 'ew-resize';
        case 'e': return 'ew-resize';
        case 'nw': return 'nwse-resize';
        case 'se': return 'nwse-resize';
        case 'ne': return 'nesw-resize';
        case 'sw': return 'nesw-resize';
        default: return 'default';
    }
};
