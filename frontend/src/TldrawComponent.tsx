import { Tldraw, TLShapeId, createShapeId } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useState, useCallback } from "react";

export function TldrawComponent() {
  const [spokeCount, setSpokeCount] = useState(3); // Default to 3 spokes
  const [hubId, setHubId] = useState<TLShapeId | null>(null);
  const [spokeIds, setSpokeIds] = useState<
    { id: TLShapeId; textId: TLShapeId; bindingId: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const createHubAndSpokes = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor: any) => {
      if (!editor) return;

      // Delete any existing diagram
      if (hubId) {
        editor.deleteShapes([
          hubId,
          ...spokeIds.flatMap((spoke) => [spoke.id, spoke.textId]),
        ]);
      }

      // Create the hub - use minimal properties
      const newHubId = createShapeId();
      editor.createShape({
        id: newHubId,
        type: "geo",
        x: 400,
        y: 300,
        props: {
          geo: "ellipse",
          w: 150,
          h: 150,
        },
      });

      // Create a separate text shape for the hub label
      const hubTextId = createShapeId();
      editor.createShape({
        id: hubTextId,
        type: "text",
        x: 400 - 30,
        y: 300 - 15,
        props: {
          value: "HUB",
          w: 60,
          align: "middle",
        },
      });

      setHubId(newHubId);

      // Create the spokes
      const newSpokeIds = [];
      const angleStep = (2 * Math.PI) / spokeCount;
      const radius = 250; // Distance from hub center to spoke text

      for (let i = 0; i < spokeCount; i++) {
        const angle = i * angleStep;
        const x = 400 + Math.cos(angle) * radius;
        const y = 300 + Math.sin(angle) * radius;

        // Create text box
        const textId = createShapeId();
        editor.createShape({
          id: textId,
          type: "text",
          x: x - 150, // Center the text
          y: y - 30,
          props: {
            value:
              "Non ullamco eiusmod cupidatat deserunt\noccaecat qui non sit sit cillum pariatur culpa in.",
            w: 300,
            autoSize: false,
            align: "middle",
            color: "black",
          },
        });

        // Create line (spoke) - simplified
        const lineId = createShapeId();
        editor.createShape({
          id: lineId,
          type: "line",
          x: 400,
          y: 300,
          props: {
            handles: {
              start: {
                id: "start",
                type: "vertex",
                x: 0,
                y: 0,
              },
              end: {
                id: "end",
                type: "vertex",
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              },
            },
          },
        });

        // Create binding between line and text
        const bindingId = editor.createBindings([
          {
            id: createShapeId(),
            type: "binding",
            fromId: lineId,
            toId: textId,
            fromHandleId: "end",
          },
        ])[0];

        // Create binding between line and hub
        editor.createBindings([
          {
            id: createShapeId(),
            type: "binding",
            fromId: lineId,
            toId: newHubId,
            fromHandleId: "start",
          },
        ]);

        newSpokeIds.push({ id: lineId, textId, bindingId });
      }

      setSpokeIds(newSpokeIds);
    },
    [hubId, spokeIds, spokeCount]
  );

  useEffect(() => {
    if (editorInstance) {
      createHubAndSpokes(editorInstance);
    }
  }, [spokeCount, editorInstance, createHubAndSpokes]);

  const addSpoke = () => {
    if (spokeCount < 6) {
      setSpokeCount(spokeCount + 1);
    }
  };

  const removeSpoke = () => {
    if (spokeCount > 2) {
      setSpokeCount(spokeCount - 1);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Tldraw
        onMount={(editor) => {
          setEditorInstance(editor);

          // Set up hub dragging to move the entire diagram
          editor.addListener("change", ({ changes }) => {
            if (hubId && changes.updated[hubId]) {
              const hub = editor.getShape(hubId);
              if (hub) {
                // Get hub's position change
                const dx = hub.x - 400;
                const dy = hub.y - 300;

                // Move all spoke texts to maintain the diagram structure
                spokeIds.forEach((spoke) => {
                  const text = editor.getShape(spoke.textId);
                  if (text) {
                    editor.updateShape({
                      id: spoke.textId,
                      type: text.type,
                      x: text.x + dx,
                      y: text.y + dy,
                    });
                  }
                });
              }
            }
          });
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button onClick={addSpoke} disabled={spokeCount >= 6}>
          Add Spoke
        </button>
        <button onClick={removeSpoke} disabled={spokeCount <= 2}>
          Remove Spoke
        </button>
      </div>
    </div>
  );
}
