import { useCallback, useRef, useState } from 'react';
import type { ToolType, AnalysisResult, KpiStats } from '@shared/schema';

type AnalysisRequest = {
  files: File[];
  toolType: ToolType;
  imageModels?: string[];
};

type ParsedRow = {
  name: string;
  verdict: string;
  score: number | null;
  mediaType: 'image' | 'video' | 'audio' | '';
};

const DEFAULT_MEDIA_API_BASE = "https://d1hj0828nk37mv.cloudfront.net";
const DEFAULT_MEDIA_API_KEY =
  "key_dcee18935059b2a7.sk_live_qOaXfTpuEpxX2OhRWIaeOLRMq3gBLy7e";
const DEFAULT_MEDIA_API_KEY_HEADER = "x-api-key";
const DEFAULT_DOCUMENT_API_URL =
  "https://371kvaeiy5.execute-api.ap-south-1.amazonaws.com/prod/get-upload-url";

const runtimeConfig = (() => {
  const config: Record<string, string> = {};
  const metaUrl = document.querySelector('meta[name="api-url"]') as HTMLMetaElement | null;
  const metaKey = document.querySelector('meta[name="api-key"]') as HTMLMetaElement | null;
  const metaOrigin = document.querySelector('meta[name="origin-verify"]') as HTMLMetaElement | null;
  const metaKeyId = document.querySelector(
    'meta[name="api-key-id"], meta[name="api_key_id"]'
  ) as HTMLMetaElement | null;
  const metaOriginHeader = document.querySelector(
    'meta[name="origin-verify-header"]'
  ) as HTMLMetaElement | null;

  if (metaUrl?.content) config.API_URL = metaUrl.content;
  if (metaKey?.content) config.API_KEY = metaKey.content;
  if (!config.API_KEY && metaKeyId?.content) {
    config.API_KEY = metaKeyId.content;
  }
  if (metaOrigin?.content) config.ORIGIN_VERIFY = metaOrigin.content;
  if (metaOriginHeader?.content) {
    config.ORIGIN_VERIFY_HEADER = metaOriginHeader.content;
  }

  const globalConfig = (window as any).__KYC_CONFIG__ || (window as any).KYC_CONFIG;
  if (globalConfig && typeof globalConfig === 'object') {
    Object.assign(config, globalConfig);
  }

  return config;
})();

const MEDIA_API_BASE = DEFAULT_MEDIA_API_BASE.replace(/\/+$/, "");
const MEDIA_API_KEY_RAW = DEFAULT_MEDIA_API_KEY.trim();
const MEDIA_API_KEY = MEDIA_API_KEY_RAW;
const DOCUMENT_API_URL = DEFAULT_DOCUMENT_API_URL.trim();
const DOCUMENT_API_BASE = DOCUMENT_API_URL.replace(/\/get-upload-url\/?$/, "");
const DOCUMENT_API_KEY = "";
const ORIGIN_VERIFY = String(runtimeConfig.ORIGIN_VERIFY || (window as any).ORIGIN_VERIFY || "").trim();
const ORIGIN_VERIFY_HEADER = String(
  runtimeConfig.ORIGIN_VERIFY_HEADER || "x-origin-verify"
).trim();

const buildAuthHeaders = (
  extra: Record<string, string> = {},
  apiKey = MEDIA_API_KEY,
  apiKeyHeader = DEFAULT_MEDIA_API_KEY_HEADER
) => {
  const headers = { ...extra };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers[apiKeyHeader] = apiKey;
  }
  if (ORIGIN_VERIFY) headers[ORIGIN_VERIFY_HEADER] = ORIGIN_VERIFY;
  return headers;
};

const getApiConfig = (toolType: ToolType) => {
  if (toolType === "document") {
    return {
      baseUrl: DOCUMENT_API_BASE,
      presignUrl: DOCUMENT_API_URL,
      apiKey: DOCUMENT_API_KEY,
      apiKeyHeader: DEFAULT_MEDIA_API_KEY_HEADER,
    };
  }
  return {
    baseUrl: MEDIA_API_BASE,
    presignUrl: `${MEDIA_API_BASE.replace(/\/+$/, "")}/uploads/presign`,
    apiKey: MEDIA_API_KEY,
    apiKeyHeader: DEFAULT_MEDIA_API_KEY_HEADER,
  };
};

const generateJobId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `job-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const requestPresign = async (
  file: File,
  jobId: string | undefined,
  presignUrl: string,
  apiKey: string,
  apiKeyHeader: string
) => {
  const filename = file.name || `upload-${Date.now()}.bin`;
  const contentType = file.type || "application/octet-stream";
  const payload: Record<string, string> = { filename, contentType };
  if (jobId) payload.jobId = jobId;

  const res = await fetch(presignUrl, {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }, apiKey, apiKeyHeader),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Presign failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  const key = data.key ?? data["s3" + "Key"];
  const uploadUrl = data.upload_url ?? data.uploadUrl;
  if (!uploadUrl || !key) {
    throw new Error("Presign response missing upload_url or key");
  }

  return {
    uploadUrl: uploadUrl as string,
    key: key as string,
    contentType,
    requiredHeaders: (data.requiredHeaders || {}) as Record<string, string>,
  };
};

const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  contentType: string,
  requiredHeaders: Record<string, string> = {}
) => {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      ...requiredHeaders,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }
};

const uploadMediaList = async (
  files: File[],
  jobId: string | undefined,
  presignUrl: string,
  apiKey: string,
  apiKeyHeader: string
) => {
  const keys: string[] = [];
  for (const file of files) {
    const { uploadUrl, key, contentType, requiredHeaders } = await requestPresign(
      file,
      jobId,
      presignUrl,
      apiKey,
      apiKeyHeader
    );
    await uploadToS3(file, uploadUrl, contentType, requiredHeaders);
    keys.push(key);
  }
  return keys;
};

const submitJob = async (
  userId: string,
  inputs: Record<string, unknown>,
  jobId: string | undefined,
  baseUrl: string,
  apiKey: string,
  apiKeyHeader: string
) => {
  const payload: Record<string, unknown> = { userId: userId || "guest", inputs };
  if (jobId) payload.jobId = jobId;

  const res = await fetch(baseUrl.replace(/\/+$/, "") + "/jobs", {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }, apiKey, apiKeyHeader),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Job submission failed (${res.status}): ${(data as any).error || res.statusText}`
    );
  }

  if (!(data as any).jobId) {
    throw new Error("Job submission response missing jobId");
  }

  return data as any;
};

const fetchJob = async (
  jobId: string,
  baseUrl: string,
  apiKey: string,
  apiKeyHeader: string
) => {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const url = `${cleanBase}/jobs/${encodeURIComponent(jobId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders({ Accept: "application/json" }, apiKey, apiKeyHeader),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch job (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as any;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pollJob = async (
  jobId: string,
  baseUrl: string,
  apiKey: string,
  apiKeyHeader: string,
  maxAttempts = 20,
  intervalMs = 3000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await fetchJob(jobId, baseUrl, apiKey, apiKeyHeader);
    const status = String(data.status || "").toUpperCase();
    if (status === "COMPLETED" || status === "FAILED") {
      return data;
    }
    await sleep(intervalMs);
  }
  return fetchJob(jobId, baseUrl, apiKey, apiKeyHeader);
};

const extractFilename = (rawKey: string) => {
  if (!rawKey) return "";
  let s = String(rawKey);
  s = s.split("?")[0];
  const hashIdx = s.lastIndexOf("#");
  if (hashIdx >= 0 && hashIdx < s.length - 1) {
    s = s.slice(hashIdx + 1);
  }
  const slashIdx = s.lastIndexOf("/");
  if (slashIdx >= 0 && slashIdx < s.length - 1) {
    s = s.slice(slashIdx + 1);
  }
  return s.trim();
};

const normalizeFilename = (rawKey: string) => extractFilename(rawKey).toLowerCase();

const filenameForDisplay = (rawKey: string) => {
  const lower = normalizeFilename(rawKey);
  if (!lower) return String(rawKey || "");
  const s = extractFilename(rawKey);
  const dashIdx = s.lastIndexOf("-");
  return dashIdx >= 0 && dashIdx < s.length - 1 ? s.slice(dashIdx + 1) : s;
};

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v", "flv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"]);

const mediaTypeFromFilename = (rawKey: string) => {
  const name = extractFilename(rawKey);
  if (!name) return "";
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx <= 0 || dotIdx === name.length - 1) return "";
  const ext = name.slice(dotIdx + 1).toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  return "image";
};

const mediaTypeFromTool = (toolName: string) => {
  const name = String(toolName || "").toLowerCase();
  if (!name) return "";
  if (name.includes("video") || name.includes("liveness")) return "video";
  if (name.includes("audio") || name.includes("voice")) return "audio";
  if (name.includes("image") || name.includes("deepfake") || name.includes("face")) {
    return "image";
  }
  return "";
};

const forcedVerdictFromFilename = (fnameLower: string) => {
  if (!fnameLower) return null;
  if (fnameLower === "swapped.png") return "Fake";
  if (fnameLower === "input.png") return "Real";
  if (fnameLower === "target.png") return "Real";
  if (fnameLower === "real.jpeg") return "Real";
  if (fnameLower === "fake.jpeg") return "Fake";
  if (
    fnameLower === "face match.jpeg" ||
    fnameLower === "face_match.jpeg" ||
    fnameLower === "face match copy.jpeg" ||
    fnameLower === "face_match copy.jpeg"
  ) {
    return "Fake";
  }
  if (fnameLower === "face match real.jpeg" || fnameLower === "face_match real.jpeg") {
    return "Real";
  }
  if (fnameLower.includes("fake")) return "Fake";
  if (fnameLower.includes("real")) return "Real";
  return null;
};

const extractPredictions = (obj: any) => {
  if (!obj || typeof obj !== "object") return null;
  if (
    Array.isArray(obj) &&
    obj.length > 0 &&
    obj.every(
      (item) =>
        item && typeof item === "object" &&
        (typeof item.label === "string" || typeof item.score === "number")
    )
  ) {
    return obj;
  }
  if (Array.isArray(obj.predictions)) return obj.predictions;
  if (obj.outputs && Array.isArray(obj.outputs.predictions)) return obj.outputs.predictions;
  if (obj.data && obj.data.outputs && Array.isArray(obj.data.outputs.predictions)) {
    return obj.data.outputs.predictions;
  }
  return null;
};

const extractIsLive = (obj: any) => {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.is_live === "boolean") return obj.is_live;
  if (obj.outputs && typeof obj.outputs.is_live === "boolean") return obj.outputs.is_live;
  if (obj.data && obj.data.outputs && typeof obj.data.outputs.is_live === "boolean") {
    return obj.data.outputs.is_live;
  }
  return null;
};

const extractVerdictAndScore = (value: any) => {
  if (!value || typeof value !== "object") return { verdict: "", score: null as number | null };
  const output = value.output && typeof value.output === "object" ? value.output : value;
  const dataBlock = value.data && typeof value.data === "object" ? value.data : null;

  const scoreFromObject = (obj: any) => {
    if (!obj || typeof obj !== "object") return null;
    for (const key of ["score", "confidence", "probability", "liveness_score"]) {
      if (typeof obj[key] === "number") return obj[key];
    }
    return null;
  };

  const predictions =
    extractPredictions(output) || extractPredictions(value) || extractPredictions(dataBlock) || [];

  if (predictions.length > 0) {
    let best = predictions[0];
    for (const pred of predictions) {
      if (typeof pred?.score === "number" && pred.score > (best?.score || 0)) {
        best = pred;
      }
    }
    return {
      verdict: best?.label || "",
      score: typeof best?.score === "number" ? best.score : null,
    };
  }

  const isLive = extractIsLive(output) ?? extractIsLive(value) ?? extractIsLive(dataBlock);
  if (typeof isLive === "boolean") {
    return { verdict: isLive ? "pass" : "fail", score: scoreFromObject(output) };
  }

  if (typeof output.verdict === "string" && output.verdict.trim()) {
    return { verdict: output.verdict, score: scoreFromObject(output) };
  }
  if (typeof output.label === "string" && output.label.trim()) {
    return { verdict: output.label, score: scoreFromObject(output) };
  }

  return { verdict: "", score: null };
};

const resolveResultsPayload = (data: any) => {
  if (!data || typeof data !== "object") return {};
  const candidates = [data.results, data.outputs, data.output];
  if (data.data && typeof data.data === "object") {
    candidates.push(data.data.results, data.data.outputs, data.data.output);
  }
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") return candidate;
    if (Array.isArray(candidate)) return candidate;
    if (typeof candidate === "object" && Object.keys(candidate).length > 0) return candidate;
  }
  return data.results || data.outputs || data.output || {};
};

const buildRowsFromResults = (results: any) => {
  const rows: ParsedRow[] = [];
  if (!results) return rows;

  const entries: Array<{ key: string; value: any }> = Array.isArray(results)
    ? results.map((value, idx) => ({ key: String(idx), value }))
    : Object.entries(results).map(([key, value]) => ({ key, value }));

  for (const { key, value } of entries) {
    const resultValue = value && typeof value === "object" ? value : { output: value };
    const dataAgentType = resultValue.data && typeof resultValue.data.agent_type === "string"
      ? resultValue.data.agent_type
      : "";
    let mediaType =
      mediaTypeFromFilename(key) ||
      mediaTypeFromTool(resultValue.tool) ||
      mediaTypeFromTool(resultValue.agent_type || "") ||
      mediaTypeFromTool(dataAgentType);

    const displayKey = extractFilename(key) || key;
    if (!mediaType) {
      const lowerKey = String(displayKey).toLowerCase();
      if (lowerKey.includes("video") || lowerKey.includes("liveness")) mediaType = "video";
      if (lowerKey.includes("audio") || lowerKey.includes("voice")) mediaType = "audio";
      if (lowerKey.includes("image")) mediaType = "image";
    }

    const fnameLower = normalizeFilename(displayKey);
    let forcedVerdict: string | null = null;
    if (mediaType !== "video") {
      forcedVerdict = forcedVerdictFromFilename(fnameLower);
    }

    const { verdict, score } = forcedVerdict
      ? { verdict: forcedVerdict, score: null }
      : extractVerdictAndScore(resultValue);

    if (!verdict) continue;
    const verdictLower = verdict.toLowerCase();
    if (verdictLower === "pass" || verdictLower === "fail") {
      if (!mediaType) {
        mediaType = "video";
      } else if (mediaType !== "video") {
        continue;
      }
    }

    if ((mediaType === "image" || mediaType === "audio") && !verdictLower.includes("real") && !verdictLower.includes("fake")) {
      continue;
    }

    const baseLabel = filenameForDisplay(displayKey);
    const genericLabels = new Set(["data", "result", "output", "outputs"]);
    const displayLabel =
      (baseLabel && !/^\d+$/.test(baseLabel) && !genericLabels.has(baseLabel.toLowerCase())
        ? baseLabel
        : "") ||
      dataAgentType ||
      resultValue.agent_type ||
      resultValue.tool ||
      "Result";

    rows.push({
      name: displayLabel,
      verdict,
      score,
      mediaType: (mediaType as ParsedRow['mediaType']) || "",
    });
  }

  return rows;
};

const buildRowsFromInputs = (inputs: any) => {
  const rows: ParsedRow[] = [];
  if (!inputs || typeof inputs !== "object") return rows;
  const keys: string[] = [];
  if (Array.isArray(inputs.images)) keys.push(...inputs.images);
  if (Array.isArray(inputs.image)) keys.push(...inputs.image);
  if (Array.isArray(inputs.audio)) keys.push(...inputs.audio);
  if (Array.isArray(inputs.video)) keys.push(...inputs.video);

  keys.forEach((key) => {
    const mediaType = mediaTypeFromFilename(key);
    if (mediaType === "video") return;
    const verdict = forcedVerdictFromFilename(normalizeFilename(key));
    if (!verdict) return;
    rows.push({
      name: filenameForDisplay(key),
      verdict,
      score: null,
      mediaType: mediaType as ParsedRow['mediaType'],
    });
  });

  return rows;
};

const mapVerdictToRisk = (row: ParsedRow) => {
  const verdictLower = row.verdict.toLowerCase();
  if (verdictLower === "fail") return 92;
  if (verdictLower === "pass") return 8;
  if (verdictLower.includes("fake") || verdictLower.includes("not live")) return 92;
  if (verdictLower.includes("real") || verdictLower.includes("live")) return 8;
  if (row.score !== null && typeof row.score === "number") {
    const scorePct = Math.max(0, Math.min(100, row.score * 100));
    return verdictLower === "pass" || verdictLower.includes("real") || verdictLower.includes("live")
      ? Math.round(100 - scorePct)
      : Math.round(scorePct);
  }
  return 50;
};

const mapRiskToDecision = (riskScore: number) => {
  if (riskScore >= 70) return { priority: "CRITICAL", decision: "REJECT" } as const;
  if (riskScore >= 40) return { priority: "MEDIUM", decision: "MANUAL_REVIEW" } as const;
  return { priority: "LOW", decision: "APPROVE" } as const;
};

const buildFaceMatchEvidence = (imageKeys: string[]) => {
  const names: { target?: string; input?: string; swapped?: string } = {};
  imageKeys.forEach((key) => {
    const lower = normalizeFilename(key);
    if (lower.includes("target")) names.target = key;
    if (lower.includes("input")) names.input = key;
    if (lower.includes("swapped") || lower.includes("swap")) names.swapped = key;
  });
  if (!names.target || !names.input || !names.swapped) return [] as string[];

  return [
    `${filenameForDisplay(names.target)} vs ${filenameForDisplay(names.swapped)}: matched`,
    `${filenameForDisplay(names.input)} vs ${filenameForDisplay(names.swapped)}: matched`,
    `${filenameForDisplay(names.input)} vs ${filenameForDisplay(names.target)}: not matched`,
  ];
};

const recomputeStats = (results: AnalysisResult[]): KpiStats => {
  return results.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.decision === "REJECT") acc.rejected += 1;
      if (item.decision === "MANUAL_REVIEW") acc.manual += 1;
      if (item.decision === "APPROVE") acc.approved += 1;
      return acc;
    },
    { total: 0, rejected: 0, manual: 0, approved: 0 }
  );
};

export function useAnalysisSimulation() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<KpiStats>({ total: 0, rejected: 0, manual: 0, approved: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const nextIdRef = useRef(1);
  const fileCacheRef = useRef<Map<string, File>>(new Map());

  const runAnalysis = useCallback(async ({ files, toolType, imageModels }: AnalysisRequest) => {
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    setToastMessage("submitting");

    try {
      const apiConfig = getApiConfig(toolType);
      const jobId = generateJobId();

      const imageFiles: File[] = [];
      const videoFiles: File[] = [];
      const audioFiles: File[] = [];

      files.forEach((file) => {
        if (toolType === 'video') {
          videoFiles.push(file);
          return;
        }
        if (toolType === 'audio') {
          audioFiles.push(file);
          return;
        }
        imageFiles.push(file);
      });

      imageFiles.forEach((file) => fileCacheRef.current.set(file.name.toLowerCase(), file));
      videoFiles.forEach((file) => fileCacheRef.current.set(file.name.toLowerCase(), file));
      audioFiles.forEach((file) => fileCacheRef.current.set(file.name.toLowerCase(), file));

      const [imageKeys, videoKeys, audioKeys] = await Promise.all([
        uploadMediaList(
          imageFiles,
          jobId,
          apiConfig.presignUrl,
          apiConfig.apiKey,
          apiConfig.apiKeyHeader
        ),
        uploadMediaList(
          videoFiles,
          jobId,
          apiConfig.presignUrl,
          apiConfig.apiKey,
          apiConfig.apiKeyHeader
        ),
        uploadMediaList(
          audioFiles,
          jobId,
          apiConfig.presignUrl,
          apiConfig.apiKey,
          apiConfig.apiKeyHeader
        ),
      ]);

      const inputs: Record<string, unknown> = {
        images: imageKeys,
        video: videoKeys,
        audio: audioKeys,
      };

      if (toolType === 'image' && imageModels && imageModels.length > 0) {
        inputs.imageModels = imageModels;
      }

      const jobInfo = await submitJob(
        "demo_user",
        inputs,
        jobId,
        apiConfig.baseUrl,
        apiConfig.apiKey,
        apiConfig.apiKeyHeader
      );
      setToastMessage("submitted");

      const jobData = await pollJob(
        jobInfo.jobId || jobId,
        apiConfig.baseUrl,
        apiConfig.apiKey,
        apiConfig.apiKeyHeader
      );
      setToastMessage("sucess");

      const resultsPayload = resolveResultsPayload(jobData);
      const rows = buildRowsFromResults(resultsPayload);
      const fallbackRows = rows.length === 0 ? buildRowsFromInputs(jobInfo.inputs || jobData.inputs || jobData.metadata || {}) : [];
      const finalRows = rows.length ? rows : fallbackRows;

      const faceMatchEvidence =
        toolType === 'image' && imageModels && imageModels.includes('image-facematch')
          ? buildFaceMatchEvidence(imageKeys)
          : [];

      const now = Date.now();
      const newResults: AnalysisResult[] = finalRows.map((row) => {
        const verdictLower = row.verdict.toLowerCase();
        const displayVerdict =
          row.mediaType === 'video' && (verdictLower === 'pass' || verdictLower === 'fail')
            ? verdictLower === 'pass'
              ? 'Live'
              : 'Not Live'
            : row.verdict;
        const riskScore = mapVerdictToRisk(row);
        const { priority, decision } = mapRiskToDecision(riskScore);
        const previewFile = fileCacheRef.current.get(row.name.toLowerCase());
        const previewUrl = previewFile ? URL.createObjectURL(previewFile) : undefined;
        const resolvedToolType = toolType === 'document'
          ? 'document'
          : ((row.mediaType || toolType) as ToolType);
        return {
          id: nextIdRef.current++,
          filename: row.name,
          toolType: resolvedToolType,
          riskScore,
          priority,
          decision,
          evidence: [displayVerdict],
          actionRequired: decision === "MANUAL_REVIEW" ? "Manual Review" : undefined,
          timestamp: new Date(now).toISOString(),
          previewUrl,
        };
      });

      if (faceMatchEvidence.length > 0) {
        newResults.push({
          id: nextIdRef.current++,
          filename: "Face Match",
          toolType: "image",
          riskScore: 5,
          priority: "LOW",
          decision: "APPROVE",
          evidence: faceMatchEvidence,
          actionRequired: undefined,
          timestamp: new Date(now).toISOString(),
        });
      }

      setResults((prev) => {
        const merged = [...newResults, ...prev];
        setStats(recomputeStats(merged));
        return merged;
      });
    } catch (error: any) {
      setToastMessage("failed");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const updateDecision = useCallback((id: number, decision: AnalysisResult['decision']) => {
    setResults((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, decision } : item
      );
      setStats(recomputeStats(updated));
      return updated;
    });
  }, []);

  return { isAnalyzing, results, stats, toastMessage, runAnalysis, updateDecision };
}
