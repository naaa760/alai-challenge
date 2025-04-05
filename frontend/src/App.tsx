import { TldrawComponent } from "./TldrawComponent";
import "./index.css";

function App() {
  return (
    <div className="App" style={{ height: "100vh", width: "100%" }}>
      <header>
        <h1>Hub and Spoke Diagram</h1>
        <p>Add or remove spokes using the buttons in the top right</p>
      </header>
      <main style={{ flex: 1 }}>
        <TldrawComponent />
      </main>
    </div>
  );
}

export default App;
