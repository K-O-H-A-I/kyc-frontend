import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // API routes are not required for this frontend-only demo as logic is client-side.
  // We just serve the app.
  
  return httpServer;
}
