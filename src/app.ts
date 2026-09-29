import "dotenv/config";
import express from "express";

import config from "./config";
import errorHandling from "./error-handling";

import indexRoutes from "./routes/index.routes";
import authRoutes from "./routes/auth.routes";
import bookRoutes from "./routes/book.routes"

const app = express();

// Register middleware and other configuration
config(app);

// Register routes
app.use("/api", indexRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", bookRoutes)

// Register error handlers last
errorHandling(app);

export default app ;