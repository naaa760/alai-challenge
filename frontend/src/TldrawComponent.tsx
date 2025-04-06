import {
  Tldraw,
  Editor,
  TLShape,
  TLShapeId,
  createShapeId,
  TLRecord,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useEffect, useRef, useState } from "react";

// Define shape IDs and relationships for tracking
interface DiagramShapes {
  hubId: TLShapeId;
  spokeLines: TLShapeId[];
  endpoints: TLShapeId[];
  textBoxes: TLShapeId[];
}

export const TldrawComponent = () => {
  const [spokeCount, setSpokeCount] = useState(3);
  const editorRef = useRef<Editor | null>(null);
  const shapesRef = useRef<DiagramShapes>({
    hubId: createShapeId(),
    spokeLines: [],
    endpoints: [],
    textBoxes: [],
  });

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

      // Set up event listeners for shape changes
      editor.store.listen(handleStoreChange);

      drawDiagram(editor, spokeCount);
    },
    [spokeCount]
  );

  // Handle store changes to implement binding behavior
  const handleStoreChange = (record: TLRecord, source: "user" | "remote") => {
    if (source !== "user" || !editorRef.current) return;

    const editor = editorRef.current;
    const shapes = shapesRef.current;

    // Check if a textbox was moved
    if (record.type === "shape" && shapes.textBoxes.includes(record.id)) {
      const textBoxId = record.id;
      const textBoxIndex = shapes.textBoxes.indexOf(textBoxId);

      if (textBoxIndex >= 0) {
        // Get the corresponding spoke line and endpoint
        const spokeLineId = shapes.spokeLines[textBoxIndex];
        const endpointId = shapes.endpoints[textBoxIndex];

        // Get the shapes
        const textBox = editor.getShape(textBoxId);
        const spokeLine = editor.getShape(spokeLineId);
        const endpoint = editor.getShape(endpointId);
        const hub = editor.getShape(shapes.hubId);

        if (textBox && spokeLine && endpoint && hub) {
          // Calculate new endpoint position based on textbox position
          const textBoxCenter = {
            x: textBox.x + 100, // Half of textbox width
            y: textBox.y + 35, // Half of textbox height
          };

          // Update endpoint position
          editor.updateShape({
            id: endpointId,
            type: "geo",
            x: textBoxCenter.x - 20,
            y: textBoxCenter.y - 20,
          });

          // Update spoke line
          const hubCenter = {
            x: hub.x + 50, // Half of hub width
            y: hub.y + 50, // Half of hub height
          };

          // Update the line to connect hub to new endpoint position
          editor.updateShape({
            id: spokeLineId,
            type: "draw",
            props: {
              segments: [
                {
                  type: "straight",
                  points: [
                    { x: hubCenter.x, y: hubCenter.y },
                    { x: textBoxCenter.x, y: textBoxCenter.y },
                  ],
                },
              ],
            },
          });
        }
      }
    }

    // Check if hub was moved
    if (record.type === "shape" && record.id === shapes.hubId) {
      const hub = editor.getShape(shapes.hubId);
      if (!hub) return;

      const hubCenter = {
        x: hub.x + 50, // Half of hub width
        y: hub.y + 50, // Half of hub height
      };

      // Move all connected elements
      for (let i = 0; i < shapes.endpoints.length; i++) {
        const endpointId = shapes.endpoints[i];
        const spokeLineId = shapes.spokeLines[i];
        const textBoxId = shapes.textBoxes[i];

        const endpoint = editor.getShape(endpointId);
        const textBox = editor.getShape(textBoxId);

        if (endpoint && textBox) {
          // Calculate the vector from old hub position to endpoint
          const oldHubCenter = {
            x: record.x + 50,
            y: record.y + 50,
          };

          const dx = endpoint.x - oldHubCenter.x;
          const dy = endpoint.y - oldHubCenter.y;

          // Move endpoint by the same amount hub moved
          editor.updateShape({
            id: endpointId,
            type: "geo",
            x: hubCenter.x + dx - 20,
            y: hubCenter.y + dy - 20,
          });

          // Move textbox by the same amount
          editor.updateShape({
            id: textBoxId,
            type: "geo",
            x: textBox.x + (hub.x - record.x),
            y: textBox.y + (hub.y - record.y),
          });

          // Update spoke line
          const newEndpointCenter = {
            x: hubCenter.x + dx,
            y: hubCenter.y + dy,
          };

          editor.updateShape({
            id: spokeLineId,
            type: "draw",
            props: {
              segments: [
                {
                  type: "straight",
                  points: [
                    { x: hubCenter.x, y: hubCenter.y },
                    { x: newEndpointCenter.x, y: newEndpointCenter.y },
                  ],
                },
              ],
            },
          });
        }
      }
    }
  };

  // Function to check and prevent collisions between textboxes
  const preventCollisions = (
    editor: Editor,
    textBoxId: TLShapeId,
    x: number,
    y: number
  ) => {
    const shapes = shapesRef.current;
    const textBoxWidth = 200;
    const textBoxHeight = 70;

    // Check for collisions with other textboxes
    for (const otherId of shapes.textBoxes) {
      if (otherId === textBoxId) continue;

      const otherBox = editor.getShape(otherId);
      if (!otherBox) continue;

      // Simple collision detection
      if (
        x < otherBox.x + textBoxWidth &&
        x + textBoxWidth > otherBox.x &&
        y < otherBox.y + textBoxHeight &&
        y + textBoxHeight > otherBox.y
      ) {
        // Collision detected, adjust position
        // Move in the direction away from the other box
        const centerX = x + textBoxWidth / 2;
        const centerY = y + textBoxHeight / 2;
        const otherCenterX = otherBox.x + textBoxWidth / 2;
        const otherCenterY = otherBox.y + textBoxHeight / 2;

        const dx = centerX - otherCenterX;
        const dy = centerY - otherCenterY;

        // Normalize and apply offset
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx / distance) * textBoxWidth;
        const offsetY = (dy / distance) * textBoxHeight;

        return { x: x + offsetX, y: y + offsetY };
      }
    }

    return { x, y };
  };

  const drawDiagram = (editor: Editor, count: number) => {
    try {
      // Clear the canvas
      editor.selectAll();
      const selectedIds = editor.getSelectedShapeIds();
      if (selectedIds.length) {
        editor.deleteShapes(selectedIds);
      }

      // Reset shape tracking
      shapesRef.current = {
        hubId: createShapeId(),
        spokeLines: [],
        endpoints: [],
        textBoxes: [],
      };

      // Set up center coordinates
      const centerX = 500;
      const centerY = 300;

      // Create a background circle for visual interest
      editor.createShape({
        type: "geo",
        x: centerX - 70,
        y: centerY - 70,
        props: {
          geo: "ellipse",
          w: 140,
          h: 140,
          fill: "solid",
          color: "light-violet",
        },
      });

      // Create hub with a more vibrant color
      const hubId = editor.createShape({
        type: "geo",
        x: centerX - 50,
        y: centerY - 50,
        props: {
          geo: "ellipse",
          w: 100,
          h: 100,
          fill: "solid",
          color: "violet",
        },
      }).id;

      // Store hub ID for tracking
      shapesRef.current.hubId = hubId;

      // Create spokes and endpoints
      const spokeLength = 200; // Longer spokes for better spacing
      const angleStep = (2 * Math.PI) / count;

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const endX = centerX + Math.cos(angle) * spokeLength;
        const endY = centerY + Math.sin(angle) * spokeLength;

        // Create a decorative circle at the midpoint
        const midX = centerX + Math.cos(angle) * (spokeLength / 2);
        const midY = centerY + Math.sin(angle) * (spokeLength / 2);

        editor.createShape({
          type: "geo",
          x: midX - 5,
          y: midY - 5,
          props: {
            geo: "ellipse",
            w: 10,
            h: 10,
            fill: "solid",
            color: "yellow",
          },
        });

        // Create the connection line using a draw shape
        const spokeLineId = editor.createShape({
          type: "draw",
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
            color: "light-violet",
          },
        }).id;

        // Store spoke line ID
        shapesRef.current.spokeLines.push(spokeLineId);

        // Create endpoint with a different color
        const endpointId = editor.createShape({
          type: "geo",
          x: endX - 20,
          y: endY - 20,
          props: {
            geo: "ellipse",
            w: 40,
            h: 40,
            fill: "solid",
            color: "blue",
          },
        }).id;

        // Store endpoint ID
        shapesRef.current.endpoints.push(endpointId);

        // Create a smaller inner circle for visual interest
        editor.createShape({
          type: "geo",
          x: endX - 10,
          y: endY - 10,
          props: {
            geo: "ellipse",
            w: 20,
            h: 20,
            fill: "solid",
            color: "white",
          },
        });

        // Calculate text position based on quadrant
        let textX, textY;

        if (angle < Math.PI / 2) {
          // Top-right quadrant
          textX = endX + 30;
          textY = endY - 60;
        } else if (angle < Math.PI) {
          // Top-left quadrant
          textX = endX - 230;
          textY = endY - 60;
        } else if (angle < (3 * Math.PI) / 2) {
          // Bottom-left quadrant
          textX = endX - 230;
          textY = endY + 30;
        } else {
          // Bottom-right quadrant
          textX = endX + 30;
          textY = endY + 30;
        }

        // Check for collisions and adjust position if needed
        const adjustedPos = preventCollisions(
          editor,
          createShapeId(),
          textX,
          textY
        );
        textX = adjustedPos.x;
        textY = adjustedPos.y;

        // Add text box background with rounded corners
        const textBoxId = editor.createShape({
          type: "geo",
          x: textX,
          y: textY,
          props: {
            geo: "rectangle",
            w: 200,
            h: 70,
            fill: "solid",
            color: "light-blue",
          },
        }).id;

        // Store text box ID
        shapesRef.current.textBoxes.push(textBoxId);
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          padding: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          background: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", color: "#333" }}>
          Hub and Spoke Diagram
        </h2>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button
            onClick={handleAddSpoke}
            disabled={spokeCount >= 6}
            style={{
              padding: "10px 20px",
              backgroundColor: spokeCount >= 6 ? "#ccc" : "#4a6cf7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: spokeCount >= 6 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "background-color 0.3s",
            }}
          >
            Add Spoke
          </button>
          <button
            onClick={handleRemoveSpoke}
            disabled={spokeCount <= 2}
            style={{
              padding: "10px 20px",
              backgroundColor: spokeCount <= 2 ? "#ccc" : "#f74a6c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: spokeCount <= 2 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "background-color 0.3s",
            }}
          >
            Remove Spoke
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#e9ecef",
              padding: "8px 15px",
              borderRadius: "20px",
              fontWeight: "bold",
              color: "#495057",
            }}
          >
            Current Spokes: {spokeCount}
          </div>
        </div>
        <div
          style={{
            padding: "15px",
            backgroundColor: "#e9f7ff",
            borderRadius: "8px",
            borderLeft: "4px solid #4a6cf7",
          }}
        >
          <p
            style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#333" }}
          >
            <span style={{ marginRight: "8px" }}>📝</span>
            Instructions:
          </p>
          <p style={{ margin: "0 0 5px 0", color: "#555" }}>
            This diagram shows a hub with {spokeCount} connected spokes.
          </p>
          <p style={{ margin: "0 0 5px 0", color: "#555" }}>
            Use the buttons above to add or remove spokes (min: 2, max: 6).
          </p>
          <p style={{ margin: "0", color: "#555" }}>
            <strong>Extra features:</strong> Try moving the hub or text boxes -
            everything will move together!
          </p>
        </div>
      </div>
      <div style={{ flex: 1, border: "1px solid #e9ecef" }}>
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
};
