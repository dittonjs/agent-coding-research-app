import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { StudyProvider } from "./contexts/StudyContext.jsx";
import EventTracker from "./contexts/EventTracker.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <EventTracker>
      <StudyProvider>
        <App />
      </StudyProvider>
    </EventTracker>
  </BrowserRouter>
);
