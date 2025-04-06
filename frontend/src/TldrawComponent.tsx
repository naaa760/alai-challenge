import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useState } from "react";

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
          Add Spoke ({spokeCount})
        </button>
        <button onClick={handleRemoveSpoke} disabled={spokeCount <= 2}>
          Remove Spoke
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <Tldraw />
      </div>
    </div>
  );
};
