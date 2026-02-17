import apiClient from "./apiClient.js";

export async function fetchTagSuggestions(term) {
  const res = await apiClient.post("/documentTags", { term: term || "" });
  return res.data;
}

export async function uploadDocument({ file, data }) {
  const form = new FormData();
  form.append("file", file);
  form.append("data", typeof data === "string" ? data : JSON.stringify(data));
  const res = await apiClient.post("/saveDocumentEntry", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function searchDocuments(payload) {
  const res = await apiClient.post("/searchDocumentEntry", payload);
  return res.data;
}

