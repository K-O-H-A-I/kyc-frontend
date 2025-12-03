// Simple, framework-free frontend for the KYC orchestrator.
//
// Implements the contract:
//   POST /uploads/presign -> PUT to S3 -> POST /jobs -> GET /jobs/{jobId}
//
// Update this if your API Gateway stage changes.
const API_BASE = "https://cjv956i6qf.execute-api.ap-south-1.amazonaws.com";

const els = {
  apiBaseDisplay: document.getElementById("apiBaseDisplay"),
  jobForm: document.getElementById("job-form"),
  userId: document.getElementById("userId"),
  images: document.getElementById("images"),
  videos: document.getElementById("videos"),
  audios: document.getElementById("audios"),
  imagesCount: document.getElementById("images-count"),
  videosCount: document.getElementById("videos-count"),
  audiosCount: document.getElementById("audios-count"),
  imageDeepfakeToggle: document.getElementById("imageDeepfakeToggle"),
  imageFacematchToggle: document.getElementById("imageFacematchToggle"),
  startJobBtn: document.getElementById("startJobBtn"),
  startJobBtnLabel: document.getElementById("startJobBtnLabel"),
  startJobBtnSpinner: document.getElementById("startJobBtnSpinner"),
  log: document.getElementById("log"),
  clearLogBtn: document.getElementById("clearLogBtn"),
  jobIdInput: document.getElementById("jobIdInput"),
  loadJobBtn: document.getElementById("loadJobBtn"),
  stopPollingBtn: document.getElementById("stopPollingBtn"),
  activeJobBadge: document.getElementById("activeJobBadge"),
  jobSummary: document.getElementById("jobSummary"),
  jobStatusBadge: document.getElementById("jobStatusBadge"),
  jobIdDisplay: document.getElementById("jobIdDisplay"),
  jobUserId: document.getElementById("jobUserId"),
  jobInputs: document.getElementById("jobInputs"),
  jobCreatedAt: document.getElementById("jobCreatedAt"),
  resultsContainer: document.getElementById("resultsContainer"),
};

els.apiBaseDisplay.textContent = API_BASE.replace(/\/+$/, "");

// ---------- Utilities ----------
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  els.log.textContent += `[${timestamp}] ${message}\n`;
  els.log.scrollTop = els.log.scrollHeight;
}

function setFileCount(inputEl, labelEl) {
  const count = inputEl.files?.length || 0;
  if (count === 0) {
    labelEl.textContent = "No files selected";
  } else if (count === 1) {
    labelEl.textContent = "1 file selected";
  } else {
    labelEl.textContent = `${count} files selected`;
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    els.startJobBtn.disabled = true;
    els.startJobBtnSpinner.classList.remove("hidden");
    els.startJobBtnLabel.textContent = "Submitting...";
  } else {
    els.startJobBtn.disabled = false;
    els.startJobBtnSpinner.classList.add("hidden");
    els.startJobBtnLabel.textContent = "Start KYC Job";
  }
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function toLocalDateTime(epochMs) {
  if (!epochMs) return "";
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}


function summarizeResult(value) {
  if (!value || typeof value !== "object") return "";
  const toolName = value.tool || "";
  const output = value.output;
  if (!output || typeof output !== "object") {
    return toolName;
  }

  const predictions = output.predictions;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return toolName;
  }

  let best = predictions[0];
  for (const pred of predictions) {
    if (!pred || typeof pred !== "object") continue;
    if (typeof pred.score !== "number") continue;
    if (typeof best.score !== "number" || pred.score > best.score) {
      best = pred;
    }
  }

  const label = best.label || "N/A";
  const scoreText =
    typeof best.score === "number"
      ? (best.score * 100).toFixed(1) + "%"

      : "";

  if (toolName && scoreText) {
    return toolName + ": " + label + " (" + scoreText + ")";
  }
  if (toolName) {
    return toolName + ": " + label;
  }
  if (scoreText) {
    return label + " (" + scoreText + ")";
  }
  return label;
}

function clearResults() {
  els.resultsContainer.innerHTML = '<p class="placeholder">No results yet. Submit a job and wait for it to complete.</p>';
}

// ---------- File input listeners ----------
[["images", "imagesCount"], ["videos", "videosCount"], ["audios", "audiosCount"]].forEach(
  ([inputId, labelId]) => {
    const inputEl = els[inputId];
    const labelEl = els[labelId];
    if (!inputEl || !labelEl) return;
    inputEl.addEventListener("change", () => setFileCount(inputEl, labelEl));
  }
);

// ---------- Polling ----------
let pollTimer = null;
const POLL_INTERVAL_MS = 3000;

function setPollingActive(jobId) {
  els.stopPollingBtn.disabled = false;
  els.activeJobBadge.textContent = `Auto-refreshing job ${jobId}`;
  els.activeJobBadge.classList.remove("pill-muted");
  els.activeJobBadge.classList.add("pill-active");
}

function setPollingStopped() {
  els.stopPollingBtn.disabled = true;
  els.activeJobBadge.textContent = "No active job";
  els.activeJobBadge.classList.remove("pill-active");
  els.activeJobBadge.classList.add("pill-muted");
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  setPollingStopped();
}

els.stopPollingBtn.addEventListener("click", () => {
  stopPolling();
  log("Auto-refresh turned off by user.");
});

// ---------- API calls ----------
async function requestPresign(file) {
  const filename = file.name || `upload-${Date.now()}.bin`;
  const contentType = file.type || "application/octet-stream";

  log(`Requesting presign URL for "${filename}" (${contentType})`);

  const res = await fetch(API_BASE.replace(/\/+$/, "") + "/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, contentType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Presign failed (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  if (!data.uploadUrl || !data.s3Key) {
    throw new Error("Presign response missing uploadUrl or s3Key");
  }

  return { uploadUrl: data.uploadUrl, s3Key: data.s3Key, contentType };
}

async function uploadToS3(file, uploadUrl, contentType) {
  log(`Uploading "${file.name}" to S3...`);

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }

  log(`Upload of "${file.name}" completed.`);
}

async function uploadMediaList(fileList, kind) {
  const keys = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList.item(i);
    if (!file) continue;
    const { uploadUrl, s3Key, contentType } = await requestPresign(file);
    await uploadToS3(file, uploadUrl, contentType);
    keys.push(s3Key);
    log(`[${kind}] Stored as ${s3Key}`);
  }
  return keys;
}

async function submitJob(userId, inputs) {
  log("Submitting job to /jobs ...");

  const res = await fetch(API_BASE.replace(/\/+$/, "") + "/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId || "guest",
      inputs,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Job submission failed (${res.status}): ${data.error || res.statusText}`
    );
  }

  if (!data.jobId) {
    throw new Error("Job submission response missing jobId");
  }

  log(`Job submitted successfully. jobId=${data.jobId}, status=${data.status}`);
  return data;
}

async function fetchJob(jobId, fromPoll = false) {
  if (!jobId) {
    log("No jobId provided for fetch.");
    return;
  }

  const cleanBase = API_BASE.replace(/\/+$/, "");
  const url = `${cleanBase}/jobs/${encodeURIComponent(jobId)}`;

  if (!fromPoll) {
    log(`Fetching job status for ${jobId} ...`);
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log(`Failed to fetch job (${res.status}): ${text || res.statusText}`);
    if (res.status === 404 && fromPoll) {
      // stop polling if job truly doesn't exist
      stopPolling();
    }
    return;
  }

  const data = await res.json();
  renderJob(data);

  if (fromPoll) {
    if (data.status === "COMPLETED" || data.status === "FAILED") {
      log(`Job ${jobId} finished with status=${data.status}. Stopping auto-refresh.`);
      stopPolling();
    }
  }
}

// ---------- Rendering ----------
function renderJob(data) {
  if (!data || !data.jobId) {
    els.jobSummary.classList.add("hidden");
    clearResults();
    return;
  }

  // Summary card
  els.jobSummary.classList.remove("hidden");
  els.jobIdDisplay.textContent = data.jobId;
  els.jobUserId.textContent = (data.metadata && data.metadata.userId) || "N/A";

  // Status badge
  const status = data.status || "-";
  els.jobStatusBadge.textContent = status;
  els.jobStatusBadge.className = "badge";
  els.jobStatusBadge.classList.add(`status-${status}`);

  // Created at (if present)
  let createdText = "";
  if (data.createdAt) {
    createdText = `Created at ${toLocalDateTime(data.createdAt)}`;
  }
  els.jobCreatedAt.textContent = createdText;

  // Inputs from metadata (the backend stores metadata: inputs)
  els.jobInputs.innerHTML = "";
  const md = data.metadata || {};
  const inputChips = [];

  if (md.images && Array.isArray(md.images) && md.images.length > 0) {
    inputChips.push(`images ×${md.images.length}`);
  }
  if (md.audio && Array.isArray(md.audio) && md.audio.length > 0) {
    inputChips.push(`audio ×${md.audio.length}`);
  }
  if (md.video && Array.isArray(md.video) && md.video.length > 0) {
    inputChips.push(`video ×${md.video.length}`);
  }

  if (inputChips.length === 0) {
    const span = document.createElement("span");
    span.textContent = "None recorded";
    span.className = "chip";
    els.jobInputs.appendChild(span);
  } else {
    inputChips.forEach((text) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = text;
      els.jobInputs.appendChild(chip);
    });
  }

  // Results
  const results = data.results || {};
  const toolKeys = Object.keys(results);

  if (toolKeys.length === 0) {
    clearResults();
    return;
  }

  els.resultsContainer.innerHTML = "";

  toolKeys.forEach((key) => {
    const value = results[key];

    const card = document.createElement("div");
    card.className = "card";

    const titleRow = document.createElement("div");
    titleRow.className = "result-card-title";

    const keySpan = document.createElement("span");
    keySpan.className = "key";
    keySpan.textContent = key;

    const toolSpan = document.createElement("span");
    toolSpan.className = "tool";

    if (value && typeof value === "object" && "tool" in value) {
      toolSpan.textContent = value.tool;
    } else {
      toolSpan.textContent = "";
    }

    titleRow.appendChild(keySpan);
    titleRow.appendChild(toolSpan);

    const summaryText = summarizeResult(value);
    let summaryEl = null;
    if (summaryText) {
      summaryEl = document.createElement("div");
      summaryEl.className = "result-summary";
      summaryEl.textContent = summaryText;
    }

    const pre = document.createElement("pre");
    pre.className = "result-json";
    pre.textContent = prettyJson(value);

    card.appendChild(titleRow);
    if (summaryEl) {
      card.appendChild(summaryEl);
    }
    card.appendChild(pre);
    els.resultsContainer.appendChild(card);
  });
}

// ---------- Form submit ----------
els.jobForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userId = els.userId.value.trim() || "demo_user";

  const images = els.images.files || [];
  const videos = els.videos.files || [];
  const audios = els.audios.files || [];

  if (images.length === 0 && videos.length === 0 && audios.length === 0) {
    alert("Please select at least one image, video, or audio file.");
    return;
  }

  setLoading(true);
  log("---- New job ----");

  try {
    const [imageKeys, videoKeys, audioKeys] = await Promise.all([
      uploadMediaList(images, "images"),
      uploadMediaList(videos, "video"),
      uploadMediaList(audios, "audio"),
    ]);


    const imageModels = [];
    if (els.imageDeepfakeToggle && els.imageDeepfakeToggle.checked) {
      imageModels.push("image-deepfake");
    }
    if (els.imageFacematchToggle && els.imageFacematchToggle.checked) {
      imageModels.push("image-facematch");
    }

    const inputs = {
      images: imageKeys,
      audio: audioKeys,
      video: videoKeys,
    };

    if (imageModels.length > 0) {
      inputs.imageModels = imageModels;
    }

    const jobInfo = await submitJob(userId, inputs);

    // Remember jobId in the input for convenience
    els.jobIdInput.value = jobInfo.jobId;

    // Start auto-polling
    stopPolling();
    setPollingActive(jobInfo.jobId);
    pollTimer = setInterval(() => {
      fetchJob(jobInfo.jobId, true);
    }, POLL_INTERVAL_MS);

    // Fetch immediately once so user sees something fast
    await fetchJob(jobInfo.jobId, true);
  } catch (err) {
    console.error(err);
    log(`Error: ${err.message || err}`);
    alert("Something went wrong. Check the log area for details.");
  } finally {
    setLoading(false);
  }
});

// ---------- Load button ----------
els.loadJobBtn.addEventListener("click", async () => {
  const jobId = els.jobIdInput.value.trim();
  if (!jobId) {
    alert("Please enter a jobId to load.");
    return;
  }
  await fetchJob(jobId, false);
});

// ---------- Clear log ----------
els.clearLogBtn.addEventListener("click", () => {
  els.log.textContent = "";
});
