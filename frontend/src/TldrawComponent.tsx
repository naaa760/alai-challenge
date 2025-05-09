/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Tldraw,
  Editor,
  TLShapeId,
  createShapeId,
  TLRecord,
  StoreListener,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useRef, useState } from "react";

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

  const drawDiagram = useCallback((editor: Editor, count: number) => {
    try {
      editor.selectAll();
      const selectedIds = editor.getSelectedShapeIds();
      if (selectedIds.length) {
        editor.deleteShapes(selectedIds);
      }

      shapesRef.current = {
        hubId: createShapeId(),
        spokeLines: [],
        endpoints: [],
        textBoxes: [],
      };

      const centerX = 500;
      const centerY = 300;

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
      }).id as unknown as TLShapeId;

      shapesRef.current.hubId = hubId;

      const spokeLength = 200;
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
        }).id as unknown as TLShapeId;

        shapesRef.current.spokeLines.push(spokeLineId);

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
        }).id as unknown as TLShapeId;

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
          textX = endX + 30;
          textY = endY - 60;
        } else if (angle < Math.PI) {
          textX = endX - 230;
          textY = endY - 60;
        } else if (angle < (3 * Math.PI) / 2) {
          textX = endX - 230;
          textY = endY + 30;
        } else {
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
        }).id as unknown as TLShapeId;

        shapesRef.current.textBoxes.push(textBoxId);
      }

      // Adjust the view to show everything.
      setTimeout(() => {
        editor.zoomToFit();
      }, 100);
    } catch (error) {
      console.error("Error creating diagram:", error);
    }
  }, []);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      editor.store.listen(((
        record: TLRecord,
        source: string,
        _origin: unknown
      ) => {
        if (source === "user") {
          handleStoreChange(record);
        }
      }) as unknown as StoreListener<TLRecord>);

      drawDiagram(editor, spokeCount);
    },
    [spokeCount, drawDiagram]
  );

  const handleStoreChange = (record: TLRecord) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const shapes = shapesRef.current;

    if ("id" in record) {
      const recordId = record.id;

      if (
        shapes.textBoxes.some((id) => id.toString() === recordId.toString())
      ) {
        const textBoxId = shapes.textBoxes.find(
          (id) => id.toString() === recordId.toString()
        );

        if (textBoxId) {
          const textBoxIndex = shapes.textBoxes.indexOf(textBoxId);

          if (textBoxIndex >= 0) {
            const spokeLineId = shapes.spokeLines[textBoxIndex];
            const endpointId = shapes.endpoints[textBoxIndex];

            const textBox = editor.getShape(textBoxId);
            const spokeLine = editor.getShape(spokeLineId);
            const endpoint = editor.getShape(endpointId);
            const hub = editor.getShape(shapes.hubId);

            if (textBox && spokeLine && endpoint && hub) {
              // Calculate new endpoint position based on textbox position
              const textBoxCenter = {
                x: textBox.x + 100,
                y: textBox.y + 35,
              };

              editor.updateShape({
                id: endpointId,
                type: "geo",
                x: textBoxCenter.x - 20,
                y: textBoxCenter.y - 20,
              });

              const hubCenter = {
                x: hub.x + 50,
                y: hub.y + 50,
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
                        { x: textBoxCenter.x, y: textBoxCenter.y },
                      ],
                    },
                  ],
                },
              });
            }
          }
        }
      }

      if (recordId.toString() === shapes.hubId.toString()) {
        const hub = editor.getShape(shapes.hubId);
        if (!hub) return;

        const hubCenter = {
          x: hub.x + 50,
          y: hub.y + 50,
        };

        // Get the previous shape to calculate movement delta
        const shape = editor.getShape(recordId as unknown as TLShapeId);
        if (!shape || !("x" in shape) || !("y" in shape)) return;

        // Move all connected elements
        for (let i = 0; i < shapes.endpoints.length; i++) {
          const endpointId = shapes.endpoints[i];
          const spokeLineId = shapes.spokeLines[i];
          const textBoxId = shapes.textBoxes[i];

          const endpoint = editor.getShape(endpointId);
          const textBox = editor.getShape(textBoxId);

          if (endpoint && textBox) {
            const oldHubCenter = {
              x: shape.x + 50,
              y: shape.y + 50,
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

            editor.updateShape({
              id: textBoxId,
              type: "geo",
              x: textBox.x + (hub.x - shape.x),
              y: textBox.y + (hub.y - shape.y),
            });

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
    }
  };

  const preventCollisions = (
    editor: Editor,
    textBoxId: TLShapeId,
    x: number,
    y: number
  ) => {
    const shapes = shapesRef.current;
    const textBoxWidth = 200;
    const textBoxHeight = 70;

    for (const otherId of shapes.textBoxes) {
      if (otherId === textBoxId) continue;

      const otherBox = editor.getShape(otherId);
      if (!otherBox) continue;

      if (
        x < otherBox.x + textBoxWidth &&
        x + textBoxWidth > otherBox.x &&
        y < otherBox.y + textBoxHeight &&
        y + textBoxHeight > otherBox.y
      ) {
        const centerX = x + textBoxWidth / 2;
        const centerY = y + textBoxHeight / 2;
        const otherCenterX = otherBox.x + textBoxWidth / 2;
        const otherCenterY = otherBox.y + textBoxHeight / 2;

        const dx = centerX - otherCenterX;
        const dy = centerY - otherCenterY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const offsetX = (dx / distance) * textBoxWidth;
        const offsetY = (dy / distance) * textBoxHeight;

        return { x: x + offsetX, y: y + offsetY };
      }
    }

    return { x, y };
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
