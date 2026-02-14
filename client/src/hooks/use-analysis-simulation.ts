import React, { useState, useCallback, useEffect } from 'react';
import type { ToolType, AnalysisResult, KpiStats } from '@shared/schema';

// Mock types for our simulation
type AnalysisRequest = {
  filename?: string;
  content?: string;
  toolType: ToolType;
  file?: File;
  claimedLocation?: string;
  claimedEvent?: string;
};

// Initial KPI stats
const INITIAL_STATS: KpiStats = {
  total: 124,
  rejected: 12,
  manual: 5,
  approved: 107
};

// Helper to generate mock results based on deterministic rules
function generateMockResult(req: AnalysisRequest): AnalysisResult {
  const isFake = (req.filename || req.content || "").toLowerCase().includes("_fake");
  const isReal = (req.filename || req.content || "").toLowerCase().includes("_real");
  
  let previewUrl: string | null = null;
  if (req.file && req.file.type.startsWith('image/')) {
    previewUrl = URL.createObjectURL(req.file);
  }

  // Default to uncertain/manual review unless specified
  let riskScore = Math.floor(Math.random() * 20) + 40; // 40-60
  let priority = "MEDIUM";
  let decision = "MANUAL_REVIEW";
  let evidence: string[] = ["Inconclusive patterns", "Standard encoding detected"];
  let metadata: any = null;
  let geolocation: any = null;
  let factCheck: any = null;

  // Special Fact Check demo trigger (sensex budget day)
  const filenameLower = (req.filename || "").toLowerCase();
  const isSensexDemo = req.toolType === 'fact-check' && (
    filenameLower.includes("14001") ||
    filenameLower.includes("sensex_budgetday") ||
    filenameLower.includes("fact_sensex")
  );

  if (isSensexDemo) {
    riskScore = Math.floor(Math.random() * 7) + 8; // 8-15
    priority = "LOW";
    decision = "APPROVE";
    evidence = [
      "Over the past 15 years, the Sensex and Nifty have shown mixed but slightly positive performance on Budget day. The Sensex delivered an average return of 0.35%, while the Nifty followed a similar trend. Markets tend to perform better in the weeks after the Budget as investors focus more on fundamentals than on day-one reactions."
    ];
    factCheck = {
      verdict: "verified",
      confidence: 0.92,
      referenceId: "sensex_budgetday_15y",
      trigger: "filename:14001",
      title: "Sensex averages 0.35% gain on Budget day over last 15 years",
      publisher: "Free Press Journal"
    };

    return {
      id: Math.floor(Math.random() * 100000),
      filename: req.filename || `fact_check_${Date.now()}.txt`,
      toolType: req.toolType,
      riskScore,
      priority,
      decision,
      evidence,
      actionRequired: null,
      timestamp: new Date(),
      previewUrl,
      metadata: null,
      geolocation: null,
      factCheck,
      propaganda: null,
      verification: null,
    };
  }

  // Doom 64 / Aubrey Hodges fact check demo (MEDIUM / MANUAL_REVIEW)
  const isDoom64Demo = req.toolType === 'fact-check' && (
    filenameLower.includes("doom64") ||
    filenameLower.includes("aubrey") ||
    filenameLower.includes("hodges") ||
    filenameLower.includes("ongaku") ||
    filenameLower.includes("fact_42001")
  );

  if (isDoom64Demo) {
    riskScore = 58; // Fixed MEDIUM
    priority = "MEDIUM";
    decision = "MANUAL_REVIEW";
    
    const extractedEntities = [
      "Aubrey Hodges (game composer)",
      "Doom 64 (Nintendo 64 shooter)",
      "Nintendo 64",
      "Midway",
      "id Software",
      "Nightdive Studios",
      "The Ongaku (republisher / source label)"
    ];

    const keyClaims = [
      "Aubrey Hodges created a classic dark ambient score for the Nintendo 64 shooter Doom 64, revisiting it ~20 years later for an augmented album release.",
      "Doom 64 is not the 64th game in the Doom series.",
      "Doom 64 was developed by Midway with oversight from id Software.",
      "The game recently got a fresh port for PC and consoles by Nightdive Studios."
    ];

    const evidenceCards = [
      "Publisher/credits snippet present in screenshot (The Ongaku republish line).",
      "Known franchise info usually requires a reliable external source (developer/publisher credits).",
      "Port claim requires verification against release notes / store listing."
    ];

    const whyManualReview = [
      "Multiple factual claims; some require external confirmation (credits, release timing, port details).",
      "Screenshot is partial; not enough context to confirm all claims.",
      "Marking as MEDIUM risk to route to analyst review (demo)."
    ];

    evidence = [
      ...keyClaims.slice(0, 2),
      "Extracted from uploaded screenshot (demo)"
    ];

    factCheck = {
      verdict: "needs_review",
      confidence: 0.62,
      referenceId: "doom64_ongaku_42001",
      trigger: "filename:42001",
      title: "Doom 64 / Aubrey Hodges",
      publisher: "The Ongaku",
      caseId: "FACT_DOOM64_42001",
      displayTitle: "Article claim review: Doom 64 / Aubrey Hodges",
      extractedEntities,
      keyClaims,
      evidenceCards,
      whyManualReview,
      verdictStatus: "Likely credible but needs manual verification",
      recommendedAction: "Manual Review"
    };

    return {
      id: Math.floor(Math.random() * 100000),
      filename: req.filename || `fact_check_${Date.now()}.txt`,
      toolType: req.toolType,
      riskScore,
      priority,
      decision,
      evidence,
      actionRequired: "Analyst verification needed",
      timestamp: new Date(),
      previewUrl,
      metadata: null,
      geolocation: null,
      factCheck,
      propaganda: null,
      verification: null,
    };
  }

  // Propaganda demo trigger (quiet hour / gossamer ledger)
  const isPropagandaDemo = req.toolType === 'propaganda' && (
    filenameLower.includes("25001") ||
    filenameLower.includes("quiet_hour") ||
    filenameLower.includes("gossamer_ledger")
  );

  if (isPropagandaDemo) {
    riskScore = 78; // Fixed score for consistency
    priority = "CRITICAL";
    decision = "REJECT";
    
    const propagandaData = {
      trigger: "filename:25001",
      score: 78,
      riskLevel: "CRITICAL",
      indicatorsFound: [
        "Loaded framing / rhetorical question (\"for your safety…or for their control?\")",
        "Call-to-action language (\"Don't let them…\")",
        "'They'/oppressor framing (\"The silence they seek…\")",
        "Emotional appeal / fear of suppression (\"silence of submission\")"
      ],
      evidenceExcerpts: [
        "Source header: \"The Gossamer Ledger\"",
        "Headline: \"QUIET HOUR ORDINANCE: 'FOR YOUR SAFETY,' OR FOR THEIR CONTROL?\"",
        "Byline/date: By A. Thorne | October 26, 2023",
        "\"Is 'quiet' just code for compliance?\"",
        "\"Don't let them turn down the volume on your rights.\"",
        "\"The silence they seek is the silence of submission.\""
      ],
      matchedFacts: []
    };

    evidence = propagandaData.evidenceExcerpts;

    return {
      id: Math.floor(Math.random() * 100000),
      filename: req.filename || `propaganda_${Date.now()}.txt`,
      toolType: req.toolType,
      riskScore,
      priority,
      decision,
      evidence,
      actionRequired: null,
      timestamp: new Date(),
      previewUrl,
      metadata: null,
      geolocation: null,
      factCheck: null,
      propaganda: propagandaData,
      verification: null,
    };
  }

  if (req.toolType === 'verification') {
    // Location prediction based on filename triggers
    let predictedLocation = "Unknown";
    let predictedEvent = "Unknown";
    let locationConfidence = 0.35;
    let locationReasons: string[] = ["Insufficient cues for reliable verification (demo)"];
    
    if (filenameLower.includes("eiffel") || filenameLower.includes("paris") || filenameLower.includes("31001")) {
      predictedLocation = "Paris, France";
      predictedEvent = "landmark photo";
      locationConfidence = 0.94;
      locationReasons = ["Landmark match: Eiffel Tower silhouette", "Urban skyline consistent with Paris"];
    } else if (filenameLower.includes("quake_turkey") || filenameLower.includes("turkey_32001") || filenameLower.includes("32001")) {
      predictedLocation = "Kahramanmaras, Turkey";
      predictedEvent = "earthquake";
      locationConfidence = 0.88;
      locationReasons = ["Reference match: earthquake scene (demo)", "Context cues consistent with quake aftermath (demo)"];
    } else if (filenameLower.includes("flood_kanchipuram") || filenameLower.includes("kanchipuram") || filenameLower.includes("tamilnadu") || filenameLower.includes("33001")) {
      predictedLocation = "Kanchipuram District, Tamil Nadu, India";
      predictedEvent = "flood";
      locationConfidence = 0.90;
      locationReasons = ["Reference match: flood aerial inundation (demo)", "Urban inundation context consistent with district flooding (demo)"];
    }

    // Compare claimed vs predicted
    const claimedLocation = (req.claimedLocation || "").toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const claimedEvent = req.claimedEvent || "";
    const predictedNormalized = predictedLocation.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    
    let matchStatus: "match" | "mismatch" | "insufficient" = "insufficient";
    let locationMessage = "";
    
    if (predictedLocation === "Unknown") {
      riskScore = 55;
      priority = "MEDIUM";
      decision = "MANUAL_REVIEW";
      matchStatus = "insufficient";
      locationMessage = "Cannot confirm location; insufficient cues.";
    } else if (!claimedLocation) {
      riskScore = 50;
      priority = "MEDIUM";
      decision = "MANUAL_REVIEW";
      matchStatus = "insufficient";
      locationMessage = "Provide a claimed location to verify.";
    } else {
      // Check if claimed contains predicted country or key city
      const predictedParts = predictedNormalized.split(' ');
      const hasMatch = predictedParts.some(part => part.length > 2 && claimedLocation.includes(part));
      
      if (hasMatch) {
        riskScore = 12;
        priority = "LOW";
        decision = "APPROVE";
        matchStatus = "match";
        locationMessage = "Claim consistent with predicted location.";
      } else {
        riskScore = 85;
        priority = "CRITICAL";
        decision = "REJECT";
        matchStatus = "mismatch";
        locationMessage = "Claim mismatch: Not consistent with predicted location.";
      }
    }

    // Build verification data for export
    const verificationData = {
      claimedLocation: req.claimedLocation || "",
      claimedEvent: claimedEvent,
      predictedLocation,
      predictedEvent,
      confidence: locationConfidence,
      matchStatus,
      reasons: [...locationReasons, locationMessage]
    };

    // Section A: Metadata Analysis (keep existing but simplified)
    let metaDecision = "MANUAL_REVIEW";
    let metaEvidence = ["Analysis required"];
    
    if (isFake) {
      metaDecision = "REJECT";
      metaEvidence = [
        "Edited software footprint (Adobe Photoshop)",
        "EXIF timestamp mismatch",
        "Anomalous header structures"
      ];
    } else if (isReal) {
      metaDecision = "APPROVE";
      metaEvidence = [
        "Clean metadata profile",
        "Consistent device fingerprints",
        "No software traces found"
      ];
    } else {
      metaEvidence = ["Standard metadata patterns", "Partial review suggested"];
    }
    metadata = { decision: metaDecision, evidence: metaEvidence };

    // Section B: Geolocation Verification
    let geoDecision = matchStatus === "match" ? "APPROVE" : matchStatus === "mismatch" ? "REJECT" : "MANUAL_REVIEW";
    let geoEvidence = [locationMessage, ...locationReasons];
    geolocation = { decision: geoDecision, evidence: geoEvidence };

    evidence = ["Combined verification complete. See sections for details."];

    return {
      id: Math.floor(Math.random() * 100000),
      filename: req.filename || `verification_${Date.now()}.txt`,
      toolType: req.toolType,
      riskScore,
      priority,
      decision,
      evidence,
      actionRequired: decision === "MANUAL_REVIEW" ? "Analyst verification needed" : null,
      timestamp: new Date(),
      previewUrl,
      metadata,
      geolocation,
      factCheck: null,
      propaganda: null,
      verification: verificationData,
    };

  } else {
    // Existing logic for other tools
    if (isFake) {
      riskScore = Math.floor(Math.random() * 10) + 88; // 88-98
      priority = "CRITICAL";
      decision = "REJECT";
      evidence = [
        "High probability of digital manipulation",
        "Inconsistent error level analysis (ELA)",
        "Metadata anomalies detected in header"
      ];
      if (req.toolType === 'fact-check') {
        evidence = [
          "Contradicts verified sources (Reuters, AP)",
          "Language matches known disinformation patterns",
          "Source domain has low trust score"
        ];
      } else if (req.toolType === 'propaganda') {
        riskScore = 85;
        evidence = [
          "Identified emotional manipulation techniques",
          "Presence of binary (us-vs-them) framing",
          "Loaded language detected in multiple segments"
        ];
      }
    } else if (isReal) {
      riskScore = Math.floor(Math.random() * 10) + 2; // 2-12
      priority = "LOW";
      decision = "APPROVE";
      evidence = [
        "Verified digital signature present",
        "Consistent sensor pattern noise",
        "No manipulation traces found"
      ];
      if (req.toolType === 'fact-check') {
        evidence = [
          "Corroborated by multiple credible sources",
          "Text consistent with established timeline",
          "No known bias detected"
        ];
      } else if (req.toolType === 'propaganda') {
        riskScore = 15;
        evidence = [
          "Objective and neutral tone throughout",
          "Consistent use of factual evidence",
          "Balanced representation of multiple perspectives"
        ];
      }
    } else {
      if (req.toolType === 'propaganda') {
        riskScore = 55;
        evidence = [
          "Moderate use of persuasive techniques",
          "Partial bias detected in selective reporting",
          "Some emotional language found"
        ];
      } else if (req.toolType === 'fact-check') {
        riskScore = 62;
      }
    }
  }

  return {
    id: Math.floor(Math.random() * 100000),
    filename: req.filename || `text_analysis_${Date.now()}.txt`,
    toolType: req.toolType,
    riskScore,
    priority,
    decision,
    evidence,
    actionRequired: decision === "MANUAL_REVIEW" ? "Analyst verification needed" : null,
    timestamp: new Date(),
    previewUrl,
    metadata,
    geolocation,
    factCheck,
    propaganda: null,
    verification: null,
  };
}

export function useAnalysisSimulation() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<KpiStats>(INITIAL_STATS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Revoke object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      results.forEach(r => {
        if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
      });
    };
  }, [results]);

  const runAnalysis = useCallback(async (req: AnalysisRequest) => {
    setIsAnalyzing(true);
    setToastMessage("Uploading and processing...");
    
    // Simulate network latency (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newResult = generateMockResult(req);
    
    setResults(prev => [newResult, ...prev]);
    setIsAnalyzing(false);
    setToastMessage("Analysis complete");
    
    // Auto-update stats based on the result
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      approved: newResult.decision === "APPROVE" ? prev.approved + 1 : prev.approved,
      rejected: newResult.decision === "REJECT" ? prev.rejected + 1 : prev.rejected,
      manual: newResult.decision === "MANUAL_REVIEW" ? prev.manual + 1 : prev.manual,
    }));

    // Clear toast after 3s
    setTimeout(() => setToastMessage(null), 3000);
    
    return newResult;
  }, []);

  const updateDecision = useCallback((id: number, decision: "APPROVE" | "REJECT" | "MANUAL_REVIEW") => {
    setResults(prev => prev.map(r => {
      if (r.id === id && r.decision !== decision) {
        // Adjust stats if changing decision
        setStats(curr => {
          const newStats = { ...curr };
          // Decrement old category
          if (r.decision === "APPROVE") newStats.approved--;
          else if (r.decision === "REJECT") newStats.rejected--;
          else if (r.decision === "MANUAL_REVIEW") newStats.manual--;
          
          // Increment new category
          if (decision === "APPROVE") newStats.approved++;
          else if (decision === "REJECT") newStats.rejected++;
          else if (decision === "MANUAL_REVIEW") newStats.manual++;
          
          return newStats;
        });
        
        return { ...r, decision, actionRequired: null };
      }
      return r;
    }));
  }, []);

  return {
    isAnalyzing,
    results,
    stats,
    toastMessage,
    runAnalysis,
    updateDecision
  };
}
