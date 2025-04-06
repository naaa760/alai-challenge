import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useState } from "react";

export const TldrawComponent = () => {
  const [spokeCount, setSpokeCount] = useState(3);

  const handleAddSpoke = () => {
    if (spokeCount < 6) setSpokeCount(spokeCount + 1);
  };

  const handleRemoveSpoke = () => {
    if (spokeCount > 2) setSpokeCount(spokeCount - 1);
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
        <Tldraw />
      </div>
    </div>
  );
};
