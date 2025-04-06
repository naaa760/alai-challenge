import { Tldraw, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useRef, useState } from "react";

export const TldrawComponent = () => {
  const [spokeCount, setSpokeCount] = useState(3);
  const editorRef = useRef<Editor | null>(null);

  const handleAddSpoke = () => {
    if (spokeCount < 6) {
      setSpokeCount(spokeCount + 1);
      if (editorRef.current) {
        drawDiagram(editorRef.current, spokeCount + 1);
      }
    }
  };

  const handleRemoveSpoke = () => {
    if (spokeCount > 2) {
      setSpokeCount(spokeCount - 1);
      if (editorRef.current) {
        drawDiagram(editorRef.current, spokeCount - 1);
      }
    }
  };

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      drawDiagram(editor, spokeCount);
    },
    [spokeCount]
  );

  const drawDiagram = (editor: Editor, count: number) => {
    try {
      // Clear the canvas
      editor.selectAll();
      const selectedIds = editor.getSelectedShapeIds();
      if (selectedIds.length) {
        editor.deleteShapes(selectedIds);
      }

      // Set up center coordinates
      const centerX = 500;
      const centerY = 300;

      // Create hub
      const hubId = editor.createShape({
        type: "geo",
        x: centerX - 50,
        y: centerY - 50,
        props: {
          geo: "ellipse",
          w: 100,
          h: 100,
          fill: "solid",
          color: "blue",
        },
      }).id;

      // Create spokes and endpoints
      const spokeLength = 180;
      const angleStep = (2 * Math.PI) / count;

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const endX = centerX + Math.cos(angle) * spokeLength;
        const endY = centerY + Math.sin(angle) * spokeLength;

        // Create the connection line using a rectangle
        // We'll create points for the line to define it manually
        const points = [
          [centerX, centerY],
          [endX, endY],
        ];

        // Create a simple shape instead of a line
        editor.createShape({
          type: "draw", // Use draw shape instead of line
          x: 0,
          y: 0,
          props: {
            segments: [
              {
                type: "straight",
                points: [
                  { x: centerX, y: centerY },
                  { x: endX, y: endY },
                ],
              },
            ],
            color: "blue",
          },
        });

        // Create endpoint
        const endpointId = editor.createShape({
          type: "geo",
          x: endX - 15,
          y: endY - 15,
          props: {
            geo: "ellipse",
            w: 30,
            h: 30,
            fill: "solid",
            color: "blue",
          },
        }).id;

        // Calculate text position based on quadrant
        let textX, textY;

        if (angle < Math.PI / 2) {
          // Top-right quadrant
          textX = endX + 20;
          textY = endY - 60;
        } else if (angle < Math.PI) {
          // Top-left quadrant
          textX = endX - 220;
          textY = endY - 60;
        } else if (angle < (3 * Math.PI) / 2) {
          // Bottom-left quadrant
          textX = endX - 220;
          textY = endY + 20;
        } else {
          // Bottom-right quadrant
          textX = endX + 20;
          textY = endY + 20;
        }

        // Add text box background
        editor.createShape({
          type: "geo",
          x: textX,
          y: textY,
          props: {
            geo: "rectangle",
            w: 200,
            h: 60,
            fill: "solid",
            color: "light-blue",
          },
        });
      }

      // Adjust view to show everything
      setTimeout(() => {
        editor.zoomToFit();
      }, 100);
    } catch (error) {
      console.error("Error creating diagram:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleAddSpoke} disabled={spokeCount >= 6}>
            Add Spoke
          </button>
          <button onClick={handleRemoveSpoke} disabled={spokeCount <= 2}>
            Remove Spoke
          </button>
          <span>Current Spokes: {spokeCount}</span>
        </div>
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
          <p>
            <strong>Instructions:</strong> Use the drawing tools below to create
            a hub and spoke diagram with {spokeCount} spokes.
          </p>
          <p>
            You should have one central hub with {spokeCount} connections to
            outer nodes.
          </p>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
};
