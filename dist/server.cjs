var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var DB_FILE = import_path.default.join(process.cwd(), "kanban_db.json");
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI functionality will run in fallback simulation mode.");
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var DEFAULT_BOARD = {
  id: "default-project",
  title: "D\u1EF1 \xE1n Kh\u1EDFi nghi\u1EC7p X",
  columns: [
    { id: "todo", title: "C\u1EA7n l\xE0m", color: "bg-slate-100 border-slate-200 text-slate-800" },
    { id: "in_progress", title: "\u0110ang l\xE0m", color: "bg-indigo-50/70 border-indigo-100 text-indigo-900" },
    { id: "review", title: "Xem x\xE9t & \u0110\xE1nh gi\xE1", color: "bg-amber-50/70 border-amber-100 text-amber-900" },
    { id: "done", title: "Ho\xE0n th\xE0nh", color: "bg-emerald-50/70 border-emerald-100 text-emerald-900" }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Thi\u1EBFt k\u1EBF wireframe & UI/UX trang ch\u1EE7",
      description: "Ph\xE1c th\u1EA3o s\u01A1 \u0111\u1ED3 m\xE0n h\xECnh Desktop v\xE0 Mobile cho trang landing page c\u1EE7a s\u1EA3n ph\u1EA9m.",
      category: "Design",
      priority: "high",
      subtasks: [
        { id: "sub-1-1", text: "V\u1EBD nh\xE1p tr\xEAn gi\u1EA5y", completed: true },
        { id: "sub-1-2", text: "Thi\u1EBFt k\u1EBF Figma component", completed: false },
        { id: "sub-1-3", text: "Xin \xFD ki\u1EBFn g\xF3p \xFD c\u1EE7a team", completed: false }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      columnId: "todo"
    },
    {
      id: "task-2",
      title: "C\xE0i \u0111\u1EB7t c\u01A1 s\u1EDF d\u1EEF li\u1EC7u & API Gateway",
      description: "Thi\u1EBFt l\u1EADp database PostgreSQL v\xE0 \u0111\u1ECBnh ngh\u0129a c\xE1c API routes c\u01A1 b\u1EA3n cho \u1EE9ng d\u1EE5ng qu\u1EA3n l\xFD.",
      category: "Backend",
      priority: "medium",
      subtasks: [
        { id: "sub-2-1", text: "Thi\u1EBFt k\u1EBF database schema", completed: true },
        { id: "sub-2-2", text: "T\u1EA1o router NodeJS", completed: true }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      columnId: "in_progress"
    },
    {
      id: "task-3",
      title: "T\u1EA1o c\u1EA5u tr\xFAc layout Kanban b\u1EB1ng React",
      description: "S\u1EAFp x\u1EBFp giao di\u1EC7n c\u1ED9t hi\u1EC3n th\u1ECB, h\u1ED7 tr\u1EE3 xem danh s\xE1ch c\xF4ng vi\u1EC7c tr\u1EF1c quan.",
      category: "Frontend",
      priority: "high",
      subtasks: [
        { id: "sub-3-1", text: "Kh\u1EDFi t\u1EA1o d\u1EF1 \xE1n Vite", completed: true },
        { id: "sub-3-2", text: "C\xE0i \u0111\u1EB7t Tailwind CSS", completed: true }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      columnId: "done"
    }
  ]
};
function readDB() {
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Error reading database file, using fallback:", error);
  }
  return DEFAULT_BOARD;
}
function writeDB(data) {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}
if (!import_fs.default.existsSync(DB_FILE)) {
  writeDB(DEFAULT_BOARD);
}
app.get("/api/board", (req, res) => {
  const data = readDB();
  res.json(data);
});
app.post("/api/board", (req, res) => {
  const updatedData = req.body;
  if (!updatedData || !updatedData.columns || !updatedData.tasks) {
    return res.status(400).json({ error: "D\u1EEF li\u1EC7u b\u1EA3ng kh\xF4ng h\u1EE3p l\u1EC7." });
  }
  writeDB(updatedData);
  res.json({ success: true, message: "\u0110\xE3 l\u01B0u b\u1EA3ng th\xE0nh c\xF4ng." });
});
var fallbackClassify = (title, desc) => {
  const lowerTitle = (title + " " + desc).toLowerCase();
  let category = "Frontend";
  let priority = "medium";
  if (lowerTitle.includes("design") || lowerTitle.includes("thi\u1EBFt k\u1EBF") || lowerTitle.includes("giao di\u1EC7n") || lowerTitle.includes("figma") || lowerTitle.includes("ui") || lowerTitle.includes("ux")) {
    category = "Design";
  } else if (lowerTitle.includes("api") || lowerTitle.includes("database") || lowerTitle.includes("sql") || lowerTitle.includes("server") || lowerTitle.includes("backend") || lowerTitle.includes("c\u01A1 s\u1EDF d\u1EEF li\u1EC7u")) {
    category = "Backend";
  } else if (lowerTitle.includes("marketing") || lowerTitle.includes("sale") || lowerTitle.includes("qu\u1EA3ng c\xE1o") || lowerTitle.includes("kh\xE1ch h\xE0ng")) {
    category = "Marketing";
  } else if (lowerTitle.includes("test") || lowerTitle.includes("ki\u1EC3m th\u1EED") || lowerTitle.includes("bug") || lowerTitle.includes("l\u1ED7i")) {
    category = "Testing";
  }
  if (lowerTitle.includes("g\u1EA5p") || lowerTitle.includes("khan c\u1EA5p") || lowerTitle.includes("ngay") || lowerTitle.includes("quan tr\u1ECDng") || lowerTitle.includes("critical") || lowerTitle.includes("high")) {
    priority = "high";
  } else if (lowerTitle.includes("thong th\u1EA3") || lowerTitle.includes("r\u1EA3nh") || lowerTitle.includes("low") || lowerTitle.includes("nh\u1EB9")) {
    priority = "low";
  }
  return {
    category,
    priority,
    reason: `Ph\xE2n lo\u1EA1i t\u1EF1 \u0111\u1ED9ng (D\u1EF1a tr\xEAn t\u1EEB kh\xF3a c\xF3 trong ti\xEAu \u0111\u1EC1/m\xF4 t\u1EA3). Th\xEAm kh\xF3a API Gemini trong c\xE0i \u0111\u1EB7t \u0111\u1EC3 d\xF9ng m\xF4 h\xECnh AI th\u1EADt.`
  };
};
var fallbackDecompose = (title) => {
  return [
    { text: `T\xECm hi\u1EC3u c\xE1c y\xEAu c\u1EA7u c\u1EE5 th\u1EC3 li\xEAn quan \u0111\u1EBFn "${title}"` },
    { text: `Ph\xE1c th\u1EA3o gi\u1EA3i ph\xE1p v\xE0 ph\xE2n t\xE1ch c\xE1c ph\u1EA7n c\u1EA5u ph\u1EA7n ch\xEDnh` },
    { text: `Ti\u1EBFn h\xE0nh tri\u1EC3n khai th\u1EF1c t\u1EBF c\xF4ng vi\u1EC7c` },
    { text: `Ki\u1EC3m tra ch\u1EA5t l\u01B0\u1EE3ng v\xE0 xem x\xE9t l\u1EA1i k\u1EBFt qu\u1EA3 ho\xE0n th\xE0nh` }
  ];
};
app.post("/api/ai/classify", async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Y\xEAu c\u1EA7u ti\xEAu \u0111\u1EC1 task." });
  }
  const ai = getGeminiClient();
  if (!ai) {
    const backup = fallbackClassify(title, description || "");
    return res.json(backup);
  }
  try {
    const prompt = `Ph\xE2n lo\u1EA1i c\xF4ng vi\u1EC7c (Kanban Task) sau \u0111\xE2y:
Ti\xEAu \u0111\u1EC1: "${title}"
M\xF4 t\u1EA3: "${description || "Kh\xF4ng c\xF3 m\xF4 t\u1EA3"}"

H\xE3y tr\u1EA3 v\u1EC1 \u0111\u1ECBnh d\u1EA1ng JSON v\u1EDBi c\xE1c th\xF4ng tin sau:
1. category: G\u1EE3i \xFD nh\xE3n ph\xF9 h\u1EE3p nh\u1EA5t (v\xED d\u1EE5: "Frontend", "Backend", "Design", "Marketing", "Testing", "DevOps", "Database" ho\u1EB7c m\u1ED9t nh\xE3n chuy\xEAn m\xF4n ng\u1EAFn g\u1ECDn b\u1EB1ng Ti\u1EBFng Anh 1-2 t\u1EEB, vi\u1EBFt hoa ch\u1EEF c\xE1i \u0111\u1EA7u).
2. priority: \u0110\u1ED9 \u01B0u ti\xEAn ph\xF9 h\u1EE3p nh\u1EA5t d\u1EF1a tr\xEAn t\xEDnh ch\u1EA5t c\xF4ng vi\u1EC7c ("low", "medium", "high").
3. reason: M\u1ED9t c\xE2u ng\u1EAFn g\u1ECDn gi\u1EA3i th\xEDch l\xFD do g\u1EE3i \xFD nh\xE3n n\xE0y (b\u1EB1ng Ti\u1EBFng Vi\u1EC7t).`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            category: { type: import_genai.Type.STRING, description: "Ph\xE2n lo\u1EA1i tags" },
            priority: { type: import_genai.Type.STRING, description: "low, medium, high" },
            reason: { type: import_genai.Type.STRING, description: "Gi\u1EA3i th\xEDch b\u1EB1ng Ti\u1EBFng Vi\u1EC7t" }
          },
          required: ["category", "priority", "reason"]
        }
      }
    });
    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (error) {
    console.error("Gemini Classify Error:", error);
    res.json(fallbackClassify(title, description || ""));
  }
});
app.post("/api/ai/decompose", async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Ti\xEAu \u0111\u1EC1 c\xF4ng vi\u1EC7c l\xE0 b\u1EAFt bu\u1ED9c." });
  }
  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ subtasks: fallbackDecompose(title) });
  }
  try {
    const prompt = `H\xE3y \u0111\xF3ng vai tr\xF2 l\xE0 m\u1ED9t qu\u1EA3n l\xFD d\u1EF1 \xE1n chuy\xEAn nghi\u1EC7p v\xE0 ph\xE2n t\xE1ch c\xF4ng vi\u1EC7c l\u1EDBn sau \u0111\xE2y th\xE0nh 4 \u0111\u1EBFn 6 \u0111\u1EA7u vi\u1EC7c nh\u1ECF/subtasks h\xE0nh \u0111\u1ED9ng \u0111\u01B0\u1EE3c ngay:
C\xF4ng vi\u1EC7c l\u1EDBn: "${title}"
M\xF4 t\u1EA3 chi ti\u1EBFt: "${description || "Kh\xF4ng c\xF3 m\xF4 t\u1EA3"}"

H\xE3y tr\u1EA3 v\u1EC1 m\u1ED9t danh s\xE1ch JSON m\u1EABu c\xF3 c\u1EA5u tr\xFAc nh\u01B0 sau:
{
  "subtasks": [
    { "text": "H\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3 1" },
    { "text": "H\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3 2" }
  ]
}
Y\xEAu c\u1EA7u: N\u1ED9i dung h\xE0nh \u0111\u1ED9ng vi\u1EBFt r\xF5 r\xE0ng, d\u1EC5 hi\u1EC3u, b\u1EB1ng Ti\u1EBFng Vi\u1EC7t, m\u1ED7i \u0111\u1EA7u vi\u1EC7c kho\u1EA3ng 5-15 t\u1EEB.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            subtasks: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  text: { type: import_genai.Type.STRING }
                },
                required: ["text"]
              }
            }
          },
          required: ["subtasks"]
        }
      }
    });
    const result = JSON.parse(response.text?.trim() || '{"subtasks": []}');
    res.json(result);
  } catch (error) {
    console.error("Gemini Decompose Error:", error);
    res.json({ subtasks: fallbackDecompose(title) });
  }
});
app.post("/api/ai/summarize", async (req, res) => {
  const { columns, tasks } = req.body;
  if (!columns || !tasks) {
    return res.status(400).json({ error: "Y\xEAu c\u1EA7u \u0111\u1EA7y \u0111\u1EE7 d\u1EEF li\u1EC7u c\u1EA5u tr\xFAc b\u1EA3ng." });
  }
  const ai = getGeminiClient();
  const summaryPrompt = `D\u01B0\u1EDBi \u0111\xE2y l\xE0 th\u1ED1ng k\xEA hi\u1EC7n t\u1EA1i c\u1EE7a b\u1EA3ng Kanban c\xF4ng vi\u1EC7c:
Danh s\xE1ch c\u1ED9t: ${JSON.stringify(columns)}
Danh s\xE1ch c\xE1c task hi\u1EC7n c\xF3: ${JSON.stringify(tasks.map((t) => ({
    title: t.title,
    columnId: t.columnId,
    priority: t.priority,
    category: t.category,
    subtasks_total: t.subtasks?.length || 0,
    subtasks_done: t.subtasks?.filter((s) => s.completed).length || 0
  })))}

H\xE3y vi\u1EBFt m\u1ED9t b\xE1o c\xE1o t\xF3m t\u1EAFt ti\u1EBFn \u0111\u1ED9 c\u1EF1c k\u1EF3 chuy\xEAn nghi\u1EC7p v\xE0 truy\u1EC1n c\u1EA3m h\u1EE9ng b\u1EB1ng Ti\u1EBFng Vi\u1EC7t d\u01B0\u1EDBi \u0111\u1ECBnh d\u1EA1ng Markdown:
Gi\u1ECDng v\u0103n: Tr\u1EF1c quan, t\xEDch c\u1EF1c, s\xE1ng r\xF5, t\u1EADp trung v\xE0o gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1.
Bao g\u1ED3m:
1. T\u1ED5ng quan ng\u1EAFn g\u1ECDn (V\xED d\u1EE5: S\u1ED1 vi\u1EC7c ho\xE0n th\xE0nh, t\u1EC9 l\u1EC7 ho\xE0n th\xE0nh chung).
2. Ph\xE2n t\xEDch c\xE1c n\xFAt th\u1EAFt c\u1ED5 chai ti\u1EC1m \u1EA9n (C\xF3 task n\xE0o quan tr\u1ECDng b\u1ECB tr\xEC tr\u1EC7 kh\xF4ng? C\xF3 qu\xE1 nhi\u1EC1u vi\u1EC7c \u1EDF \u0110ang l\xE0m / Review kh\xF4ng?).
3. G\u1EE3i \xFD h\xE0nh \u0111\u1ED9ng ti\u1EBFp theo c\u1EE5 th\u1EC3 cho \u0111\u1ED9i ng\u0169 ph\xE1t tri\u1EC3n.
H\xE3y d\xF9ng \u0111\u1ECBnh d\u1EA1ng Markdown \u0111\u1EB9p, d\xF9ng bullet points r\xF5 r\xE0ng. Kh\xF4ng n\xF3i qu\xE1 d\xE0i d\xF2ng.`;
  if (!ai) {
    const total = tasks.length;
    const completedCount = tasks.filter((t) => t.columnId === "done").length;
    const doingCount = tasks.filter((t) => t.columnId === "in_progress").length;
    const rate = total > 0 ? Math.round(completedCount / total * 100) : 0;
    const fallbackText = `### \u{1F4CA} B\xE1o c\xE1o Ti\u1EBFn \u0111\u1ED9 D\u1EF1 \xE1n (B\u1EA3n gi\u1EA3 l\u1EADp)

Ch\xE0o b\u1EA1n, \u0111\xE2y l\xE0 t\xF3m t\u1EAFt nhanh ti\u1EBFn tr\xECnh c\xF4ng vi\u1EC7c t\u1EEB Tr\u1EE3 l\xFD \u1EA3o do ch\u01B0a k\xEDch ho\u1EA1t k\u1EBFt n\u1ED1i API Gemini:

*   **T\u1ED5ng s\u1ED1 c\xF4ng vi\u1EC7c:** **${total} tasks**
*   **Ho\xE0n th\xE0nh:** **${completedCount}** (${rate}%)
*   **\u0110ang x\u1EED l\xFD:** **${doingCount}** tasks \u0111ang t\xEDch c\u1EF1c th\u1EF1c hi\u1EC7n.

#### \u{1F50D} \u0110i\u1EC3m ngh\u1EBDn ti\xEAu bi\u1EC3u:
*   Ph\xE1t hi\u1EC7n c\xF3 **${tasks.filter((t) => t.priority === "high" && t.columnId !== "done").length} c\xF4ng vi\u1EC7c \u01B0u ti\xEAn cao (High Priority)** v\u1EABn ch\u01B0a \u0111\u01B0\u1EE3c ho\xE0n th\xE0nh. \u0110\u1ED9i ng\u0169 n\xEAn l\u01B0u \xFD gi\u1EA3i ph\xF3ng c\xE1c task n\xE0y tr\u01B0\u1EDBc.

#### \u{1F4A1} \u0110\u1EC1 xu\u1EA5t h\xE0nh \u0111\u1ED9ng:
1.  **\u0110\u1EA9y nhanh ti\u1EBFn \u0111\u1ED9 c\xE1c c\xF4ng vi\u1EC7c trong c\u1ED9t \u0110ang L\xE0m** \u0111\u1EC3 nhanh ch\xF3ng ki\u1EC3m th\u1EED v\xE0 \u0111\xF3ng g\xF3i.
2.  **Chia nh\u1ECF c\xE1c task l\u1EDBn** c\xF3 ch\u1EE9a nhi\u1EC1u subtasks ch\u01B0a t\xEDch ho\xE0n th\xE0nh \u0111\u1EC3 ph\xE2n ph\u1ED1i cho c\xE1c th\xE0nh vi\xEAn t\u1ED1t h\u01A1n.

*K\xEDch ho\u1EA1t API Key \u1EDF g\xF3c m\xE0n h\xECnh (Settings -> Secrets) \u0111\u1EC3 nh\u1EADn ph\xE2n t\xEDch chuy\xEAn s\xE2u chi ti\u1EBFt t\u1EEB Gemini AI th\u1EADt!*`;
    return res.json({ summary: fallbackText });
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: summaryPrompt
    });
    res.json({ summary: response.text });
  } catch (error) {
    console.error("Gemini summary error:", error);
    res.status(500).json({ error: "L\u1ED7i t\u1EA1o d\u1EF1 \xE1n t\xF3m t\u1EAFt t\u1EEB Gemini." });
  }
});
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, board } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Y\xEAu c\u1EA7u l\u1EDDi nh\u1EAFn t\u1EEB ng\u01B0\u1EDDi d\xF9ng." });
  }
  const ai = getGeminiClient();
  const textContext = board ? `B\u1EA3ng Kanban hi\u1EC7n t\u1EA1i mang t\xEAn: "${board.title || "D\u1EF1 \xE1n"}"
C\xE1c c\u1ED9t: ${board.columns?.map((c) => `${c.id} (${c.title})`).join(", ")}
C\xE1c task hi\u1EC7n t\u1EA1i:
${board.tasks?.map((t) => `- [C\u1ED9t ${t.columnId}] Title: "${t.title}", Tag: ${t.category}, Priority: ${t.priority}, C\xF3 ${t.subtasks?.length || 0} subtasks`).join("\n")}` : "Kh\xF4ng c\xF3 th\xF4ng tin b\u1EA3ng";
  const systemInstruction = `B\u1EA1n l\xE0 Tr\u1EE3 l\xFD D\u1EF1 \xE1n AI th\xF4ng minh t\xEDch h\u1EE3p tr\u1EF1c ti\u1EBFp trong Kanban Board (\u1EE9ng d\u1EE5ng gi\u1ED1ng Trello).
D\u01B0\u1EDBi \u0111\xE2y l\xE0 ng\u1EEF c\u1EA3nh th\u1EF1c t\u1EBF c\u1EE7a d\u1EF1 \xE1n c\u1EE7a ng\u01B0\u1EDDi d\xF9ng:
${textContext}

Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n:
1. Tr\u1EA3 l\u1EDDi ng\u01B0\u1EDDi d\xF9ng m\u1ED9t c\xE1ch th\xE2n thi\u1EC7n, nhi\u1EC7t t\xECnh b\u1EB1ng Ti\u1EBFng Vi\u1EC7t.
2. Tr\u1EE3 gi\xFAp ng\u01B0\u1EDDi d\xF9ng l\u1EADp k\u1EBF ho\u1EA1ch, ph\xE2n lo\u1EA1i ho\u1EB7c t\xF3m t\u1EAFt ti\u1EBFn tr\xECnh.
3. Khi ng\u01B0\u1EDDi d\xF9ng n\xF3i mu\u1ED1n t\u1EA1o c\xF4ng vi\u1EC7c m\u1EDBi (v\xED d\u1EE5: "th\xEAm task h\u1ECDc React", "t\u1EA1o th\u1EBB vi\u1EC7c Thi\u1EBFt k\u1EBF Database \u1EDF c\u1ED9t C\u1EA7n l\xE0m"), ho\u1EB7c ph\xE2n r\xE3 task c\u1EE5 th\u1EC3, b\u1EA1n c\u1EA7n tr\u1EA3 l\u1EDDi b\u1EB1ng v\u0103n b\u1EA3n k\xE8m \u0111\u1EC1 xu\u1EA5t m\u1ED9t Thao T\xE1c Nhanh (Action Payload) d\u1EA1ng JSON \u0111\u1EC3 \u1EE9ng d\u1EE5ng t\u1EF1 \u0111\u1ED9ng th\u1EF1c hi\u1EC7n tr\xEAn UI!

Ph\u1EA3n h\u1ED3i c\u1EE7a b\u1EA1n PH\u1EA2I LU\xD4N L\xC0 m\u1ED9t \u0111\u1ED1i t\u01B0\u1EE3ng JSON c\xF3 c\u1EA5u tr\xFAc nh\u01B0 sau:
{
  "text": "L\u1EDDi tho\u1EA1i tr\u1EA3 l\u1EDDi c\u1EE7a b\u1EA1n, vi\u1EBFt b\u1EB1ng Markdown Ti\u1EBFng Vi\u1EC7t th\u1EADt th\xE2n thi\u1EC7n, chuy\xEAn nghi\u1EC7p.",
  "suggestedActions": [
    {
      "label": "T\xEAn n\xFAt b\u1EA5m hi\u1EC3n th\u1ECB ng\u1EAFn g\u1ECDn (v\xED d\u1EE5: '\u2795 Th\xEAm vi\u1EC7c v\xE0 Ph\xE2n lo\u1EA1i')",
      "action": "CREATE_TASK" ho\u1EB7c "DECOMPOSE" ho\u1EB7c "SUMMARIZE",
      "payload": {
        // N\u1EBFu action l\xE0 CREATE_TASK:
        "title": "Ti\xEAu \u0111\u1EC1 c\xF4ng vi\u1EC7c",
        "description": "M\xF4 t\u1EA3 n\u1EBFu c\xF3",
        "category": "Nh\xE3n c\xF4ng vi\u1EC7c",
        "priority": "low" ho\u1EB7c "medium" ho\u1EB7c "high",
        "columnId": "todo" ho\u1EB7c "in_progress" ho\u1EB7c "review" ho\u1EB7c "done" (t\xECm c\u1ED9t ph\xF9 h\u1EE3p nh\u1EA5t)
        
        // N\u1EBFu action l\xE0 DECOMPOSE:
        "taskId": "id c\u1EE7a task n\u1EBFu ng\u01B0\u1EDDi d\xF9ng nh\u1EAFc \u0111\u1EBFn m\u1ED9t task c\u1EE5 th\u1EC3 ho\u1EB7c ti\xEAu \u0111\u1EC1 task"
      }
    }
  ]
}
L\u01B0u \xFD: N\u1EBFu kh\xF4ng c\u1EA7n th\u1EF1c hi\u1EC7n h\xE0nh \u0111\u1ED9ng t\u1EF1 \u0111\u1ED9ng g\xEC \u0111\u1EB7c bi\u1EC7t, h\xE3y \u0111\u1EC3 "suggestedActions" l\xE0 m\u1ED9t m\u1EA3ng r\u1ED7ng [] ho\u1EB7c ch\u1EE9a n\xFAt 'T\xF3m t\u1EAFt ti\u1EBFn tr\xECnh' (action "SUMMARIZE"). Kh\xF4ng b\u1ECBa t\xEAn id c\u1EE7a task n\u1EBFu kh\xF4ng ch\u1EAFc ch\u1EAFn.`;
  if (!ai) {
    let replyText = `T\xF4i \u0111\xE3 nh\u1EADn \u0111\u01B0\u1EE3c c\xE2u h\u1ECFi: "${message}". \u0110\u1EC3 tr\u1EE3 gi\xFAp b\u1EA1n qu\u1EA3n l\xFD board t\u1ED1t nh\u1EA5t, vui l\xF2ng c\u1EA5u h\xECnh API Key c\u1EE7a b\u1EA1n trong b\u1EA3ng **Secrets**. 

Tuy nhi\xEAn, d\u1EF1a tr\xEAn n\u1ED9i dung b\u1EA1n g\u1EEDi, \u0111\xE2y l\xE0 t\u01B0 duy g\u1EE3i \xFD cho b\u1EA1n: B\u1EA1n c\xF3 th\u1EC3 th\xEAm task v\xE0 ph\xE2n lo\u1EA1i ch\xFAng v\xE0o c\xE1c c\u1ED9t t\u01B0\u01A1ng \u1EE9ng, t\u1EADp trung gi\u1EA3i quy\u1EBFt c\xE1c th\u1EBB c\xF3 \u0111\u1ED9 \u01B0u ti\xEAn **High** tr\u01B0\u1EDBc ti\xEAn!`;
    const actions = [];
    const msgLower = message.toLowerCase();
    if (msgLower.includes("th\xEAm") || msgLower.includes("t\u1EA1o") || msgLower.includes("create") || msgLower.includes("add")) {
      const detectedTitle = message.replace(/(thêm|tạo|task|công việc|thẻ|thẻ việc|ở cột|cột|vào cột)/gi, "").trim();
      const taskTitle = detectedTitle ? detectedTitle.charAt(0).toUpperCase() + detectedTitle.slice(1) : "C\xF4ng vi\u1EC7c m\u1EDBi t\u1EEB Chatbot";
      replyText = `T\xF4i c\u1EA3m th\u1EA5y b\u1EA1n mu\u1ED1n th\xEAm m\u1ED9t c\xF4ng vi\u1EC7c m\u1EDBi: **"${taskTitle}"**. T\xF4i \u0111\xE3 chu\u1EA9n b\u1ECB m\u1ED9t n\xFAt thao t\xE1c nhanh \u1EDF b\xEAn d\u01B0\u1EDBi, b\u1EA1n ch\u1EC9 c\u1EA7n m\u1ED9t l\u01B0\u1EE3t nh\u1EA5p chu\u1ED9t \u0111\u1EC3 t\u1EF1 \u0111\u1ED9ng \u0111\u01B0a c\xF4ng vi\u1EC7c n\xE0y v\xE0o c\u1ED9t **C\u1EA7n l\xE0m** v\xE0 ph\xE2n lo\u1EA1i n\xF3 ngay l\u1EADp t\u1EE9c!`;
      actions.push({
        label: `\u2795 Th\xEAm nhanh task "${taskTitle.slice(0, 20)}..."`,
        action: "CREATE_TASK",
        payload: {
          title: taskTitle,
          description: "\u0110\u01B0\u1EE3c kh\u1EDFi t\u1EA1o nhanh t\u1EEB \u0111\u1EC1 xu\u1EA5t chatbot AI",
          category: msgLower.includes("thi\u1EBFt k\u1EBF") || msgLower.includes("giao di\u1EC7n") ? "Design" : "Frontend",
          priority: "medium",
          columnId: "todo"
        }
      });
    } else {
      actions.push({
        label: "\u{1F4CA} T\xF3m t\u1EAFt ti\u1EBFn \u0111\u1ED9 d\u1EF1 \xE1n ngay",
        action: "SUMMARIZE",
        payload: {}
      });
    }
    return res.json({ text: replyText, suggestedActions: actions });
  }
  try {
    const formattedHistory = (history || []).slice(-10).map((h) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));
    const contents = [...formattedHistory, { role: "user", parts: [{ text: message }] }];
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.json({
      text: "Xin l\u1ED7i, \u0111\xE3 x\u1EA3y ra m\u1ED9t l\u1ED7i nh\u1ECF khi k\u1EBFt n\u1ED1i v\u1EDBi m\xE1y ch\u1EE7 AI. Tuy nhi\xEAn, t\xF4i v\u1EABn s\u1EB5n s\xE0ng \u0111\u1ED3ng h\xE0nh c\xF9ng b\u1EA1n qu\u1EA3n l\xFD c\xE1c th\u1EBB c\xF4ng vi\u1EC7c n\xE0y!",
      suggestedActions: []
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
