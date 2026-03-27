import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { create } from "express-handlebars";
import { loadUser } from "./middleware/auth.js";

import authController from "./controllers/auth.js";
import studyController from "./controllers/study.js";
import adminController from "./controllers/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const VITE_ORIGIN = process.env.VITE_ORIGIN || "http://localhost:5173";

// Handlebars setup
const hbs = create({ defaultLayout: false });
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(loadUser);

// API Routes
app.use("/api/auth", authController);
app.use("/api/study", studyController);
app.use("/api/admin", adminController);

// Serve the React app
if (process.env.NODE_ENV === "production") {
  // In production, serve the built files from client/dist
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
} else {
  // In development, redirect asset/file requests to the Vite dev server
  app.use((req, res, next) => {
    if (req.path.includes(".")) {
      return res.redirect(`${VITE_ORIGIN}${req.path}`);
    }
    next();
  });

  // In development, Express serves the HTML which loads JS from Vite dev server
  app.get("*", (req, res) => {
    res.render("index", { viteOrigin: VITE_ORIGIN });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
