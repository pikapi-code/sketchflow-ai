import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SketchElement } from "../types";

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateDiagram = async (prompt: string): Promise<SketchElement[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define the schema for the model to strictly follow
  const elementSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ["rectangle", "ellipse", "diamond", "arrow", "text", "line"] },
      x: { type: Type.NUMBER, description: "X coordinate (approx 0-800)" },
      y: { type: Type.NUMBER, description: "Y coordinate (approx 0-600)" },
      width: { type: Type.NUMBER, description: "Width of the element" },
      height: { type: Type.NUMBER, description: "Height of the element" },
      text: { type: Type.STRING, description: "Label text (if type is text or container with label)" },
      strokeColor: { type: Type.STRING, description: "Hex color code" },
      points: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER }
          }
        },
        description: "Points for lines/arrows (start and end)"
      }
    },
    required: ["type", "x", "y", "width", "height"]
  };

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: elementSchema
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a diagram based on this request: "${prompt}". 
      Return a list of elements. 
      For flowchart connections, use 'arrow' type with defined start and end points relative to the x,y coordinates of the shapes they connect.
      Spread elements out so they don't overlap. Use varied colors for emphasis if appropriate.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a specialized diagram generator. You output JSON data representing whiteboard elements (shapes, arrows, text). Layout the diagram logically."
      }
    });

    const rawData = JSON.parse(response.text || "[]");

    // Map the raw response to our SketchElement type with defaults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements: SketchElement[] = rawData.map((el: any) => ({
      id: generateId(),
      type: el.type,
      x: el.x || 0,
      y: el.y || 0,
      width: el.width || 100,
      height: el.height || 100,
      strokeColor: el.strokeColor || "#000000",
      backgroundColor: "transparent",
      fillStyle: "hachure",
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      text: el.text || "",
      fontSize: 20,
      seed: Math.floor(Math.random() * 2 ** 31),
      points: el.points || (el.type === 'arrow' || el.type === 'line' ? [{x: 0, y:0}, {x: el.width, y: el.height}] : []),
    }));

    return elements;

  } catch (error) {
    console.error("Gemini Diagram Generation Error:", error);
    throw error;
  }
};