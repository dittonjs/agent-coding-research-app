import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StudyProvider } from "./contexts/StudyContext.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StudyProvider>
      <App />
    </StudyProvider>
  </BrowserRouter>
);
