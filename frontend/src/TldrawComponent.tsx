import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  useEditor,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useState } from "react";

export const TldrawComponent = () => {
  const [spokeCount, setSpokeCount] = useState(3);

  const handleAddSpoke = () => {
    if (spokeCount < 6) {
      setSpokeCount(spokeCount + 1);
    }
  };

  const handleRemoveSpoke = () => {
    if (spokeCount > 2) {
      setSpokeCount(spokeCount - 1);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "10px", display: "flex", gap: "10px" }}>
        <button onClick={handleAddSpoke} disabled={spokeCount >= 6}>
          Add Spoke
        </button>
        <button onClick={handleRemoveSpoke} disabled={spokeCount <= 2}>
          Remove Spoke
        </button>
        <span>Current Spokes: {spokeCount}</span>
      </div>
      <div style={{ flex: 1 }}>
        <Tldraw
          store={createTLStore({ shapeUtils: defaultShapeUtils })}
          components={{
            Canvas: (props) => (
              <CustomCanvas {...props} spokeCount={spokeCount} />
            ),
          }}
        />
      </div>
    </div>
  );
};

interface CustomCanvasProps {
  spokeCount: number;
  children?: React.ReactNode;
}

const CustomCanvas = ({ spokeCount, ...props }: CustomCanvasProps) => {
  const editor = useEditor();

  useEffect(() => {
    if (!editor) return;

    try {
      // Clear the canvas
      const allShapes = editor.getShapeIds();
      if (allShapes.length > 0) {
        editor.deleteShapes(allShapes);
      }

      // Create the hub circle
      const hubId = editor.createShape({
        type: "geo",
        x: 400,
        y: 300,
        props: {
          geo: "ellipse",
          w: 100,
          h: 100,
        },
      });

      // Create spokes
      const spokeLength = 150;
      const angleStep = (2 * Math.PI) / spokeCount;

      for (let i = 0; i < spokeCount; i++) {
        const angle = i * angleStep;
        const endX = 400 + Math.sin(angle) * spokeLength;
        const endY = 300 - Math.cos(angle) * spokeLength;

        // Create the line
        const lineId = editor.createShape({
          type: "line",
          x: 400,
          y: 300,
          props: {
            handles: {
              start: { x: 0, y: 0 },
              end: { x: endX - 400, y: endY - 300 },
            },
          },
        });

        // Create the endpoint circle
        const endpointId = editor.createShape({
          type: "geo",
          x: endX - 10,
          y: endY - 10,
          props: {
            geo: "ellipse",
            w: 20,
            h: 20,
          },
        });

        // Create bindings between elements
        editor.createBinding({
          fromId: hubId,
          toId: lineId,
          type: "arrow",
        });

        editor.createBinding({
          fromId: lineId,
          toId: endpointId,
          type: "arrow",
        });
      }
    } catch (error) {
      console.error("Error in TldrawComponent:", error);
    }
  }, [editor, spokeCount]);

  return props.children;
};
