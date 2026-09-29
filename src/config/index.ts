import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import type { Express } from "express";

const FRONTEND_URL = process.env.ORIGIN ?? "http://localhost:5173";

export default function config(app: Express): void {
  // Needed when the app is hosted behind a proxy
  app.set("trust proxy", 1);

  // Allow requests from the frontend
  app.use(
    cors({
      origin: [FRONTEND_URL],
    })
  );

  // Log requests during development
  app.use(logger("dev"));

  // Parse JSON request bodies
  app.use(express.json());

  // Parse URL-encoded request bodies
  app.use(express.urlencoded({ extended: false }));

  // Parse cookies
  app.use(cookieParser());
}