import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDb } from "./src/db/database";
import apiRoutes from "./src/api/routes";
import { initCronJobs } from "./src/api/cron";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Database
  try {
    console.log("Initializing database...");
    await Promise.race([
      initDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database initialization timed out")), 5000))
    ]);
    console.log("Database initialized.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  // Initialize Cron Jobs
  initCronJobs();

  // API routes FIRST
  app.use("/api", apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
