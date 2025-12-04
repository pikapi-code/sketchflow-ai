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
             if(isPointNearLine(start.x, start.y, end.x, end.y, x, y, 15)) return el;
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
export const getSnapPoint = (element: SketchElement, point: Point): Point => {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const angle = Math.atan2(point.y - cy, point.x - cx);
    
    // Normalize angle to 0 - 2PI
    // const normAngle = angle < 0 ? angle + 2 * Math.PI : angle;

    if (element.type === 'ellipse') {
        const rx = element.width / 2;
        const ry = element.height / 2;
        return {
            x: cx + rx * Math.cos(angle),
            y: cy + ry * Math.sin(angle)
        };
    } else if (element.type === 'rectangle' || element.type === 'text') {
        // Intersect ray from center with box edges
        const hw = element.width / 2;
        const hh = element.height / 2;
        
        // Check intersection with vertical edges
        if (Math.abs(Math.tan(angle)) > hh / hw) {
            // Top or Bottom
            const sign = Math.sin(angle) > 0 ? 1 : -1;
            return {
                x: cx + (hh / Math.abs(Math.tan(angle))) * (Math.cos(angle) > 0 ? 1 : -1) * (sign > 0 ? 1 : -1) * (Math.tan(angle) > 0 ? 1 : -1), // simplified: x = cy + y/tan
                y: cy + sign * hh
            };
            // Easier: y is fixed at top/bottom, calculate x
            const y = cy + sign * hh;
            const x = cx + (y - cy) / Math.tan(angle);
            return { x, y };
        } else {
            // Left or Right
            const sign = Math.cos(angle) > 0 ? 1 : -1;
            const x = cx + sign * hw;
            const y = cy + (x - cx) * Math.tan(angle);
            return { x, y };
        }
    } else if (element.type === 'diamond') {
        // Diamond edges equation: |x-cx|/hw + |y-cy|/hh = 1
        const hw = element.width / 2;
        const hh = element.height / 2;
        // x = cx + r cos a, y = cy + r sin a
        // |r cos a|/hw + |r sin a|/hh = 1
        // r (|cos a|/hw + |sin a|/hh) = 1
        // r = 1 / ( ... )
        const dist = 1 / (Math.abs(Math.cos(angle)) / hw + Math.abs(Math.sin(angle)) / hh);
        return {
            x: cx + dist * Math.cos(angle),
            y: cy + dist * Math.sin(angle)
        };
    }

    // Default return center if unknown type
    return { x: cx, y: cy };
};

export const getResizeHandle = (x: number, y: number, element: SketchElement): 'start' | 'end' | null => {
    if ((element.type === 'line' || element.type === 'arrow') && element.points) {
        const [start, end] = element.points;
        const threshold = 10;
        if (distance({x, y}, start) < threshold) return 'start';
        if (distance({x, y}, end) < threshold) return 'end';
    }
    return null;
};
