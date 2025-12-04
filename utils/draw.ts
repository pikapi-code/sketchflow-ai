import rough from "roughjs";
import { SketchElement } from "../types";
import { getStroke } from "perfect-freehand";

// Helper for freehand lines
const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

export const drawElement = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rc: any, // rough.canvas instance
  context: CanvasRenderingContext2D,
  element: SketchElement,
  theme: 'light' | 'dark' = 'light'
) => {
  if (element.isDeleted) return;

  // AUTO INVERT COLOR LOGIC FOR NEUBRUTALISM
  // If stroke is black and theme is dark -> draw white
  // If stroke is white and theme is light -> draw black (optional, usually white on white is bad)
  let effectiveStrokeColor = element.strokeColor;
  if (theme === 'dark' && (element.strokeColor === '#000000' || element.strokeColor === '#1e1e1e')) {
    effectiveStrokeColor = '#ffffff';
  } else if (theme === 'light' && element.strokeColor === '#ffffff') {
    // effectiveStrokeColor = '#000000'; // Optional: force white text to be black in light mode? Maybe user wants invisible text. Leaving as is.
  }

  const options = {
    stroke: effectiveStrokeColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
    fill: element.backgroundColor !== "transparent" ? element.backgroundColor : undefined,
    fillStyle: element.fillStyle,
    seed: element.seed,
  };

  switch (element.type) {
    case "selection":
      // Drawn as overlay in component
      break;
    case "rectangle":
      rc.rectangle(element.x, element.y, element.width, element.height, options);
      break;
    case "diamond": {
      const midX = element.x + element.width / 2;
      const midY = element.y + element.height / 2;
      rc.polygon([
        [midX, element.y],
        [element.x + element.width, midY],
        [midX, element.y + element.height],
        [element.x, midY]
      ], options);
      break;
    }
    case "ellipse":
      rc.ellipse(
        element.x + element.width / 2,
        element.y + element.height / 2,
        element.width,
        element.height,
        options
      );
      break;
    case "line":
    case "arrow":
      if (element.points && element.points.length >= 2) {
        const [start, end] = element.points;
        if (element.type === "line") {
          rc.line(start.x, start.y, end.x, end.y, options);
        } else {
          // Draw arrow line
          rc.line(start.x, start.y, end.x, end.y, options);

          // Draw arrow head
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLen = 15 + element.strokeWidth;
          const x1 = end.x - headLen * Math.cos(angle - Math.PI / 6);
          const y1 = end.y - headLen * Math.sin(angle - Math.PI / 6);
          const x2 = end.x - headLen * Math.cos(angle + Math.PI / 6);
          const y2 = end.y - headLen * Math.sin(angle + Math.PI / 6);

          rc.polygon([[end.x, end.y], [x1, y1], [x2, y2]], { ...options, fill: effectiveStrokeColor, fillStyle: 'solid' });
        }
      }
      break;
    case "scribble":
      if (element.points) {
        const points = element.points.map((p) => [p.x, p.y]);
        const stroke = getStroke(points, {
          size: element.strokeWidth * 4,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        });
        const pathData = getSvgPathFromStroke(stroke);
        context.fillStyle = effectiveStrokeColor;
        context.fill(new Path2D(pathData));
      }
      break;
    case "text":
      // Draw background if not transparent
      if (element.backgroundColor && element.backgroundColor !== "transparent") {
        context.fillStyle = element.backgroundColor;
        context.fillRect(element.x, element.y, element.width, element.height);
      }
      // Draw text
      context.font = `${element.fontSize}px ${element.fontFamily || 'sans-serif'}`;
      context.fillStyle = effectiveStrokeColor;
      context.textAlign = "center";
      context.textBaseline = "middle";
      const lines = (element.text || "").split("\n");
      const lineHeight = (element.fontSize || 20) * 1.2;
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const totalHeight = lines.length * lineHeight;
      const startY = centerY - totalHeight / 2 + lineHeight / 2;
      lines.forEach((line, i) => {
        context.fillText(line, centerX, startY + i * lineHeight);
      });
      break;
  }

  // Render text for non-text elements (centered)
  if (element.type !== 'text' && element.text) {
    context.save();
    context.font = `${element.fontSize || 24}px ${element.fontFamily || 'sans-serif'}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    let x = element.x + element.width / 2;
    let y = element.y + element.height / 2;

    if ((element.type === 'line' || element.type === 'arrow') && element.points && element.points.length >= 2) {
      const [start, end] = element.points;
      x = (start.x + end.x) / 2;
      y = (start.y + end.y) / 2;
    }

    const lines = element.text.split("\n");
    const lineHeight = (element.fontSize || 24) * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    // For lines/arrows, erase the line where text will be to create a "cut" effect with transparent background
    if (element.type === 'line' || element.type === 'arrow') {
      const maxLineWidth = Math.max(...lines.map(line => context.measureText(line).width));
      const padding = 8;
      // Erase the line segment where text will be placed (creates transparent "cut")
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = 'rgba(255, 255, 255, 1)';
      context.fillRect(
        x - maxLineWidth / 2 - padding,
        y - totalHeight / 2 - padding,
        maxLineWidth + padding * 2,
        totalHeight + padding * 2
      );
      context.globalCompositeOperation = 'source-over';
    }

    context.fillStyle = effectiveStrokeColor;
    lines.forEach((line, i) => {
      context.fillText(line, x, startY + i * lineHeight);
    });
    context.restore();
  }
};