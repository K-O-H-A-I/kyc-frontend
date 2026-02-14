import { type AnalysisResult, type InsertAnalysisResult } from "@shared/schema";

export interface IStorage {
  // We don't strictly need these for the frontend-only demo, but it satisfies the template
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
}

export class MemStorage implements IStorage {
  private results: Map<number, AnalysisResult>;
  private currentId: number;

  constructor() {
    this.results = new Map();
    this.currentId = 1;
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.currentId++;
    const result: AnalysisResult = { 
      ...insertResult, 
      id, 
      timestamp: new Date(),
      actionRequired: insertResult.actionRequired ?? null 
    };
    this.results.set(id, result);
    return result;
  }
}

export const storage = new MemStorage();
