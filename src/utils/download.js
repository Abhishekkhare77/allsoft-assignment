export async function downloadFromUrl(url, filename) {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const name = filename || "download";
  downloadBlob(blob, name);
  return blob;
}

export function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

