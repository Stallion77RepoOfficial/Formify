// ==UserScript==
// @name         Formify 2.0rc1
// @version      2.0rc1
// @description  Formify 2.0
// @match        https://docs.google.com/forms/*
// @grant        GM_addStyle
// ==/UserScript==

/* ==================== STORAGE ==================== */
const getStore = () => JSON.parse(localStorage.getItem("formify") || "{}");
const setStore = v => localStorage.setItem("formify", JSON.stringify(v));
const getItem = k => getStore()[k];
const setItem = (k,v) => { const s=getStore(); s[k]=v; setStore(s); };

// Session storage for temporary API key
let sessionApiKey = null;

// Defaults
if(!getItem("chunkSize")) setItem("chunkSize", 3);
if(!getItem("waitTime")) setItem("waitTime", 3000);
if(getItem("saveApiKey") === undefined) setItem("saveApiKey", false);

/* ==================== PANEL STYLES ==================== */
GM_addStyle(`
@keyframes rgb-glow {
  0% { color: #ff0000; text-shadow: 0 0 10px #ff0000; }
  16% { color: #ff7700; text-shadow: 0 0 10px #ff7700; }
  33% { color: #ffff00; text-shadow: 0 0 10px #ffff00; }
  50% { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
  66% { color: #0099ff; text-shadow: 0 0 10px #0099ff; }
  83% { color: #9933ff; text-shadow: 0 0 10px #9933ff; }
  100% { color: #ff0000; text-shadow: 0 0 10px #ff0000; }
}

.formify-panel {
  all: initial !important;
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 2147483647 !important;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%) !important;
  color: #fff !important;
  width: 320px !important;
  padding: 20px !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 40px rgba(0,0,0,.5), 0 0 20px rgba(99,102,241,0.3) !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  font-size: 14px !important;
  border: 1px solid rgba(99,102,241,0.5) !important;
}

.formify-title {
  font-size: 24px !important;
  font-weight: bold !important;
  margin-bottom: 16px !important;
  animation: rgb-glow 3s linear infinite !important;
  text-align: center !important;
  display: block !important;
}

.formify-section {
  margin: 16px 0 !important;
  padding: 12px !important;
  background: rgba(255,255,255,0.05) !important;
  border-radius: 8px !important;
  display: block !important;
}

.formify-label {
  display: block !important;
  color: #9ca3af !important;
  font-size: 12px !important;
  margin-bottom: 6px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.formify-input {
  all: unset !important;
  display: block !important;
  width: 100% !important;
  padding: 10px 12px !important;
  background: rgba(255,255,255,0.1) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  border-radius: 6px !important;
  color: #fff !important;
  font-size: 14px !important;
  box-sizing: border-box !important;
  margin-bottom: 8px !important;
  transition: all 0.2s !important;
}

.formify-input:focus {
  border-color: #6366f1 !important;
  background: rgba(255,255,255,0.15) !important;
  outline: none !important;
}

.formify-btn {
  all: unset !important;
  display: block !important;
  width: 100% !important;
  padding: 12px !important;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border-radius: 8px !important;
  color: #fff !important;
  font-weight: 600 !important;
  text-align: center !important;
  cursor: pointer !important;
  transition: all 0.3s !important;
  margin-top: 8px !important;
  box-sizing: border-box !important;
}

.formify-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(99,102,241,0.4) !important;
}

.formify-btn:active {
  transform: translateY(0) !important;
}

.formify-btn-stop {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
}

.formify-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.formify-status {
  display: block !important;
  padding: 12px !important;
  background: rgba(99,102,241,0.1) !important;
  border-radius: 8px !important;
  color: #e0e7ff !important;
  font-size: 13px !important;
  text-align: center !important;
  margin: 12px 0 !important;
  border: 1px solid rgba(99,102,241,0.3) !important;
}

.formify-footer {
  display: block !important;
  text-align: center !important;
  margin-top: 16px !important;
  padding-top: 16px !important;
  border-top: 1px solid rgba(255,255,255,0.1) !important;
  color: #9ca3af !important;
  font-size: 12px !important;
}

.formify-close {
  position: absolute !important;
  top: 12px !important;
  right: 12px !important;
  width: 24px !important;
  height: 24px !important;
  cursor: pointer !important;
  color: #9ca3af !important;
  font-size: 20px !important;
  line-height: 24px !important;
  text-align: center !important;
  border-radius: 4px !important;
  transition: all 0.2s !important;
}

.formify-checkbox-container {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-top: 8px !important;
  cursor: pointer !important;
}

.formify-checkbox {
  all: unset !important;
  width: 18px !important;
  height: 18px !important;
  border: 2px solid rgba(255,255,255,0.3) !important;
  border-radius: 4px !important;
  display: inline-block !important;
  position: relative !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}

.formify-checkbox:checked {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border-color: #6366f1 !important;
}

.formify-checkbox:checked::after {
  content: "✓" !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  color: #fff !important;
  font-size: 12px !important;
  font-weight: bold !important;
}

.formify-checkbox-label {
  color: #d1d5db !important;
  font-size: 13px !important;
  cursor: pointer !important;
  user-select: none !important;
}

.formify-api-display {
  display: block !important;
  margin-top: 8px !important;
  padding: 8px 12px !important;
  background: rgba(34,197,94,0.1) !important;
  border: 1px solid rgba(34,197,94,0.3) !important;
  border-radius: 6px !important;
  color: #86efac !important;
  font-size: 12px !important;
  font-family: 'Courier New', monospace !important;
  word-break: break-all !important;
}

.formify-toggle {
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  width: 56px !important;
  height: 56px !important;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  box-shadow: 0 4px 20px rgba(99,102,241,0.4) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 24px !important;
  color: #fff !important;
  z-index: 2147483646 !important;
  transition: all 0.3s !important;
  border: none !important;
}

.formify-toggle:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 6px 30px rgba(99,102,241,0.5) !important;
}
`);

/* ==================== PANEL UI ==================== */
let panel = null;
let isRunning = false;
let shouldStop = false;

function createPanel(){
  if(panel) return;

  panel = document.createElement("div");
  panel.className = "formify-panel";

  const close = document.createElement("div");
  close.className = "formify-close";
  close.textContent = "×";
  close.onclick = () => togglePanel();

  const title = document.createElement("div");
  title.className = "formify-title";
  title.textContent = "Formify 2.0rc1";

  const apiSection = document.createElement("div");
  apiSection.className = "formify-section";

  const apiLabel = document.createElement("div");
  apiLabel.className = "formify-label";
  apiLabel.textContent = "Google AI API Key";

  const apiInput = document.createElement("input");
  apiInput.className = "formify-input";
  apiInput.type = "text";
  apiInput.placeholder = "AIzaSy...";
  apiInput.id = "formify-api-input";

  // Load saved or session key
  const savedKey = getItem("saveApiKey") ? getItem("apiKey") : "";
  apiInput.value = savedKey || sessionApiKey || "";

  apiInput.oninput = (e) => {
    const key = e.target.value;
    sessionApiKey = key;
    if(getItem("saveApiKey")){
      setItem("apiKey", key);
    }
    updateApiDisplay();
  };

  const checkboxContainer = document.createElement("label");
  checkboxContainer.className = "formify-checkbox-container";

  const checkbox = document.createElement("input");
  checkbox.className = "formify-checkbox";
  checkbox.type = "checkbox";
  checkbox.id = "formify-save-checkbox";
  checkbox.checked = getItem("saveApiKey") || false;
  checkbox.onchange = (e) => {
    const shouldSave = e.target.checked;
    setItem("saveApiKey", shouldSave);
    if(shouldSave){
      setItem("apiKey", sessionApiKey || apiInput.value);
    } else {
      setItem("apiKey", "");
    }
    updateApiDisplay();
  };

  const checkboxLabel = document.createElement("span");
  checkboxLabel.className = "formify-checkbox-label";
  checkboxLabel.textContent = "Save API Key";

  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  const apiDisplay = document.createElement("div");
  apiDisplay.className = "formify-api-display";
  apiDisplay.id = "formify-api-display";
  apiDisplay.style.display = "none";

  apiSection.appendChild(apiLabel);
  apiSection.appendChild(apiInput);
  apiSection.appendChild(checkboxContainer);
  apiSection.appendChild(apiDisplay);

  const settingsSection = document.createElement("div");
  settingsSection.className = "formify-section";

  const chunkLabel = document.createElement("div");
  chunkLabel.className = "formify-label";
  chunkLabel.textContent = "Questions per Request";

  const chunkInput = document.createElement("input");
  chunkInput.className = "formify-input";
  chunkInput.type = "number";
  chunkInput.min = "1";
  chunkInput.max = "10";
  chunkInput.value = getItem("chunkSize") || 3;
  chunkInput.oninput = (e) => setItem("chunkSize", parseInt(e.target.value));

  const waitLabel = document.createElement("div");
  waitLabel.className = "formify-label";
  waitLabel.textContent = "Wait Time (ms)";
  waitLabel.style.marginTop = "12px";

  const waitInput = document.createElement("input");
  waitInput.className = "formify-input";
  waitInput.type = "number";
  waitInput.min = "1000";
  waitInput.max = "10000";
  waitInput.step = "500";
  waitInput.value = getItem("waitTime") || 3000;
  waitInput.oninput = (e) => setItem("waitTime", parseInt(e.target.value));

  settingsSection.appendChild(chunkLabel);
  settingsSection.appendChild(chunkInput);
  settingsSection.appendChild(waitLabel);
  settingsSection.appendChild(waitInput);

  const statusDiv = document.createElement("div");
  statusDiv.className = "formify-status";
  statusDiv.id = "formify-status";
  statusDiv.textContent = "Ready to solve";

  const startBtn = document.createElement("button");
  startBtn.className = "formify-btn";
  startBtn.id = "formify-start";
  startBtn.textContent = "🚀 Start Solving";
  startBtn.onclick = startSolving;

  const stopBtn = document.createElement("button");
  stopBtn.className = "formify-btn formify-btn-stop";
  stopBtn.id = "formify-stop";
  stopBtn.textContent = "⏹ Stop";
  stopBtn.style.display = "none";
  stopBtn.onclick = stopSolving;

  const footer = document.createElement("div");
  footer.className = "formify-footer";
  footer.textContent = "Made by Stallion77 with ❤️";

  panel.appendChild(close);
  panel.appendChild(title);
  panel.appendChild(apiSection);
  panel.appendChild(settingsSection);
  panel.appendChild(statusDiv);
  panel.appendChild(startBtn);
  panel.appendChild(stopBtn);
  panel.appendChild(footer);

  document.body.appendChild(panel);
}

function createToggleButton(){
  const toggle = document.createElement("button");
  toggle.className = "formify-toggle";
  toggle.textContent = "⚙️";
  toggle.onclick = togglePanel;
  document.body.appendChild(toggle);
}

function togglePanel(){
  if(!panel) {
    createPanel();
  } else {
    panel.remove();
    panel = null;
  }
}

function updateStatus(text){
  const status = document.getElementById("formify-status");
  if(status) status.textContent = text;
}

function updateApiDisplay(){
  const display = document.getElementById("formify-api-display");
  if(!display) return;

  const currentKey = sessionApiKey || (getItem("saveApiKey") ? getItem("apiKey") : "");

  if(currentKey && currentKey.length > 10){
    const masked = currentKey.substring(0, 10) + "•••" + currentKey.substring(currentKey.length - 4);
    display.textContent = `Using: ${masked}`;
    display.style.display = "block";
  } else {
    display.style.display = "none";
  }
}

function setRunningState(running){
  isRunning = running;
  const startBtn = document.getElementById("formify-start");
  const stopBtn = document.getElementById("formify-stop");
  if(startBtn && stopBtn){
    startBtn.style.display = running ? "none" : "block";
    stopBtn.style.display = running ? "block" : "none";
  }
}

function stopSolving(){
  shouldStop = true;
  updateStatus("⏹ Stopping...");
}

/* ==================== PARSE FORM ==================== */
function parseForm(){
  const form = document.querySelector("form#mG61Hd");
  if(!form) throw new Error("Form not found");

  const nodes = [...form.querySelectorAll(".Qr7Oae[role='listitem']")];
  const questions = nodes.map(n=>{
    const info = n.querySelector("div[jsmodel='CP1oW']");
    const raw = info?.getAttribute("data-params")
      ?.replace("%.@.","[")
      .replace(/&quot;/g,"'");
    const q = JSON.parse(raw || "[]")[0];
    return {
      id: q?.[4]?.[0]?.[0],
      title: q?.[1],
      options: q?.[4]?.[0]?.[1]?.map(o=>o[0]) || []
    };
  });
  return { questions, nodes };
}

/* ==================== AI PROMPT ==================== */
function buildAIPrompt(questions){
  return `Return ONLY valid JSON array. No text before/after.
[{"id":"ID","answer":"EXACT_OPTION_TEXT"}]

Questions:
${JSON.stringify(questions.map(q=>({i:q.id,q:q.title,o:q.options})))}`;
}

/* ==================== AI CALL ==================== */
async function solveBatch(aiPrompt){
  const apiKey = sessionApiKey || (getItem("saveApiKey") ? getItem("apiKey") : "");
  if(!apiKey) throw new Error("API key required");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  );

  const j = await res.json();

  if(!res.ok){
    if(res.status === 429){
      throw new Error("Rate limit! Try again later or get new API key");
    }
    if(j.error){
      throw new Error(j.error.message);
    }
    throw new Error(`HTTP ${res.status}`);
  }

  if(!j.candidates?.[0]?.content?.parts?.[0]?.text){
    throw new Error("Invalid response");
  }

  const text = j.candidates[0].content.parts[0].text;
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/* ==================== SOLVE CHUNKS ==================== */
async function solveInChunks(questions, nodes){
  const CHUNK_SIZE = getItem("chunkSize") || 3;
  const WAIT_TIME = getItem("waitTime") || 3000;
  const allAnswers = [];

  for(let i = 0; i < questions.length; i += CHUNK_SIZE){
    if(shouldStop){
      updateStatus("⏹ Stopped by user");
      break;
    }

    const chunk = questions.slice(i, i + CHUNK_SIZE);
    updateStatus(`🔍 Solving ${i+1}-${Math.min(i+CHUNK_SIZE, questions.length)}/${questions.length}...`);

    try{
      const prompt = buildAIPrompt(chunk);
      const answers = await solveBatch(prompt);
      allAnswers.push(...answers);

      if(i + CHUNK_SIZE < questions.length){
        const remaining = Math.ceil((questions.length - i - CHUNK_SIZE) / CHUNK_SIZE);
        updateStatus(`⏳ Waiting... (${remaining} batches left)`);
        await new Promise(r => setTimeout(r, WAIT_TIME));
      }
    }catch(e){
      console.error(`Chunk error:`, e);
      updateStatus(`⚠️ Error: ${e.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  return allAnswers;
}

/* ==================== APPLY ANSWERS ==================== */
function applyAnswers(answers, nodes){
  const map = new Map(answers.map(a=>[a.id || a.i, a.answer]));
  let applied = 0;

  nodes.forEach(n=>{
    n.querySelectorAll("label").forEach(l=>{
      const txt = l.textContent.trim();
      if([...map.values()].includes(txt)){
        l.click();
        applied++;
      }
    });
  });

  return applied;
}

/* ==================== MAIN ==================== */
async function startSolving(){
  if(isRunning) return;

  shouldStop = false;
  setRunningState(true);

  try{
    const currentKey = sessionApiKey || (getItem("saveApiKey") ? getItem("apiKey") : "");
    if(!currentKey){
      throw new Error("Please enter API key first");
    }

    updateStatus("🔄 Parsing form...");
    const { questions, nodes } = parseForm();

    updateStatus(`📝 Found ${questions.length} questions`);
    const answers = await solveInChunks(questions, nodes);

    if(shouldStop){
      updateStatus("⏹ Stopped");
    } else {
      updateStatus("✍️ Applying answers...");
      const applied = applyAnswers(answers, nodes);
      updateStatus(`✅ Done! ${applied}/${questions.length} answered`);
    }

  }catch(e){
    updateStatus(`❌ Error: ${e.message}`);
    console.error("Formify error:", e);
  }finally{
    setRunningState(false);
  }
}

/* ==================== INIT ==================== */
setTimeout(() => {
  createToggleButton();
}, 1000);