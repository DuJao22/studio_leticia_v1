import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDb } from "./src/db/database";
import apiRoutes from "./src/api/routes";
import { initCronJobs } from "./src/api/cron";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Initialize Database
  try {
    console.log("Initializing database...");
    // Increase timeout to 15 seconds for remote connection
    await Promise.race([
      initDb(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database initialization timed out after 15s")), 15000))
    ]);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("CRITICAL: Failed to initialize database:", err);
    // In production, we might want to exit if DB is critical
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting due to database initialization failure.");
      process.exit(1);
    }
  }

  // Global error handlers
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  });

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
