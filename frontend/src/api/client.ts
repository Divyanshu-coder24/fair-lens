import axios from "axios";

const http = axios.create({ baseURL: "/api" });

export const errMsg = (e: any): string => e?.response?.data?.detail ?? e?.message ?? "Something went wrong.";

export interface Chat { role: "user" | "model"; text: string }

export const api = {
  loadDemo: () => http.post("/demo/load").then(r => r.data),
  uploadModel: (f: File) => { const d = new FormData(); d.append("file", f); return http.post("/model/upload", d).then(r => r.data); },
  uploadDataset: (f: File) => { const d = new FormData(); d.append("file", f); return http.post("/dataset/upload", d).then(r => r.data); },
  audit: (target_column: string, sensitive_column: string) =>
    http.post("/audit", { target_column, sensitive_column }).then(r => r.data),
  counterfactual: (sample_count: number) => http.post("/counterfactual", { sample_count }).then(r => r.data),
  agentAudit: () => http.post("/agent/audit", {}, { timeout: 180000 }).then(r => r.data),
  chat: (message: string, history: Chat[]) =>
    http.post("/agent/chat", { message, history }, { timeout: 180000 }).then(r => r.data),
};
