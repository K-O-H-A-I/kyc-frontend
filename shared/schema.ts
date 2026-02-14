import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We don't need a real DB for a frontend-only demo, but we define the shapes here for type safety.

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  toolType: text("tool_type").notNull(), // 'document', 'fact-check', 'propaganda', 'verification'
  riskScore: integer("risk_score").notNull(),
  priority: text("priority").notNull(), // 'LOW', 'MEDIUM', 'CRITICAL'
  decision: text("decision").notNull(), // 'APPROVE', 'REJECT', 'MANUAL_REVIEW'
  evidence: jsonb("evidence").$type<string[]>().notNull(),
  actionRequired: text("action_required"),
  timestamp: timestamp("timestamp").defaultNow(),
  previewUrl: text("preview_url"),
  metadata: jsonb("metadata").$type<{
    decision: string;
    evidence: string[];
  }>(),
  geolocation: jsonb("geolocation").$type<{
    decision: string;
    evidence: string[];
  }>(),
  factCheck: jsonb("fact_check").$type<{
    verdict: string;
    confidence: number;
    referenceId: string;
    trigger: string;
    title?: string;
    publisher?: string;
    // Extended fields for detailed fact check
    caseId?: string;
    displayTitle?: string;
    extractedEntities?: string[];
    keyClaims?: string[];
    evidenceCards?: string[];
    whyManualReview?: string[];
    verdictStatus?: string;
    recommendedAction?: string;
  }>(),
  propaganda: jsonb("propaganda").$type<{
    trigger: string;
    score: number;
    riskLevel: string;
    indicatorsFound: string[];
    evidenceExcerpts: string[];
    matchedFacts: string[];
  }>(),
  verification: jsonb("verification").$type<{
    claimedLocation: string;
    claimedEvent: string;
    predictedLocation: string;
    predictedEvent: string;
    confidence: number;
    matchStatus: "match" | "mismatch" | "insufficient";
    reasons: string[];
  }>(),
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults);

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type ToolType = 'document' | 'fact-check' | 'propaganda' | 'verification';

export type KpiStats = {
  total: number;
  rejected: number;
  manual: number;
  approved: number;
};
