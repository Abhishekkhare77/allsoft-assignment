import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../components/Modal.jsx";
import TagInput from "../components/TagInput.jsx";
import {
  MAJOR_HEAD_OPTIONS,
  MINOR_HEAD_BY_MAJOR,
} from "../constants/options.js";
import { searchDocuments } from "../services/documentService.js";
import { formatDDMMYYYY } from "../utils/date.js";
import { downloadFromUrl, downloadBlob } from "../utils/download.js";
import { createZipBlob } from "../utils/zip.js";

function normalizeRows(raw) {
  const candidate =
    raw?.data?.data ||
    raw?.data?.rows ||
    raw?.data?.items ||
    raw?.data ||
    raw?.rows ||
    raw?.items ||
    raw?.documents ||
    raw?.result ||
    raw;
  return Array.isArray(candidate) ? candidate : [];
}

function getFileNameFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

function getRowLabel(row) {
  return (
    row?.document_name ||
    row?.documentName ||
    row?.file_name ||
    row?.fileName ||
    row?.name ||
    row?.title ||
    getFileNameFromUrl(row?.file_url) ||
    (row?.document_id != null ? `Document ${row.document_id}` : "Document")
  );
}

function getRowUrl(row) {
  const url = row?.file_url;
  if (!url) return null;
  const s = String(url);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base =
    import.meta.env.VITE_FILE_BASE_URL || import.meta.env.VITE_API_URL || "";
  if (!base) return s;
  return `${String(base).replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

function getFetchUrlForZip(url) {
  if (!url) return null;
  const u = new URL(url);
  if (
    import.meta.env.DEV &&
    u.hostname === "allsoft-consulting.s3.ap-south-1.amazonaws.com"
  ) {
    return `/s3-proxy${u.pathname}${u.search}`;
  }

  return url;
}

function extFromName(name) {
  const s = String(name || "");
  const i = s.lastIndexOf(".");
  if (i === -1) return "";
  return s.slice(i + 1).toLowerCase();
}

function guessKind(row) {
  const name = getRowLabel(row);
  const ext = extFromName(name);
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  const mime = String(
    row?.mime_type || row?.mimeType || row?.type || "",
  ).toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  return "unknown";
}

function PreviewBody({ row }) {
  const url = getRowUrl(row);
  const kind = guessKind(row);
  const label = getRowLabel(row);

  if (!url) {
    return (
      <div className="text-sm text-slate-700">
        Preview URL not available in API response.
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        title={label}
        src={url}
        className="h-[70dvh] w-full border border-slate-200"
      />
    );
  }

  if (kind === "image") {
    return (
      <img
        alt={label}
        src={url}
        className="mx-auto max-h-[70dvh] w-auto border border-slate-200"
      />
    );
  }

  return (
    <div className="text-sm text-slate-700">
      Preview not supported for this file type.
    </div>
  );
}

export default function Search() {
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState(null);
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [zipBusy, setZipBusy] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      major_head: "",
      minor_head: "",
      from_date: "",
      to_date: "",
      uploaded_by: "",
      search_value: "",
    },
  });

  const major = watch("major_head");
  const minorOptions = useMemo(
    () => (major ? MINOR_HEAD_BY_MAJOR[major] || [] : []),
    [major],
  );

  const onSubmit = async (values) => {
    const payload = {
      major_head: values.major_head || "",
      minor_head: values.minor_head || "",
      from_date: values.from_date ? formatDDMMYYYY(values.from_date) : "",
      to_date: values.to_date ? formatDDMMYYYY(values.to_date) : "",
      tags: (tags || []).map((t) => ({ tag_name: t })),
      uploaded_by: values.uploaded_by || "",
      start: 0,
      length: 50,
      filterId: "",
      search: { value: values.search_value || "" },
    };

    setStatus({ type: "loading", message: "Searching..." });
    try {
      const raw = await searchDocuments(payload);
      const nextRows = normalizeRows(raw);
      setRows(nextRows);
      const count = raw?.recordsFiltered ?? nextRows.length;
      setStatus({ type: "success", message: `Found ${count} result(s).` });
    } catch {
      setRows([]);
      setStatus({
        type: "error",
        message: "Search failed. Please verify token and try again.",
      });
    }
  };

  const onDownload = async (row) => {
    const url = getRowUrl(row);
    const name = getRowLabel(row);
    if (!url) {
      setStatus({
        type: "error",
        message: "Download URL not available in API response.",
      });
      return;
    }
    setStatus({ type: "loading", message: "Downloading..." });
    try {
      await downloadFromUrl(url, name);
      setStatus({ type: "success", message: "Downloaded." });
    } catch {
      setStatus({ type: "error", message: "Download failed." });
    }
  };

  const onDownloadAllZip = async () => {
    if (!rows.length) return;
    const candidates = rows
      .map((r) => ({ row: r, url: getRowUrl(r), name: getRowLabel(r) }))
      .filter((x) => Boolean(x.url));

    if (!candidates.length) {
      setStatus({
        type: "error",
        message: "No downloadable URLs available to build ZIP.",
      });
      return;
    }

    setZipBusy(true);
    setStatus({
      type: "loading",
      message: `Building ZIP from ${candidates.length} file(s)...`,
    });
    try {
      const files = [];
      const usedNames = new Set();
      for (const c of candidates) {
        const fetchUrl = getFetchUrlForZip(c.url) || c.url;
        const res = await fetch(fetchUrl, { credentials: "omit" });
        if (!res.ok) continue;
        const blob = await res.blob();
        const buf = await blob.arrayBuffer();
        let name = c.name;
        if (usedNames.has(name)) {
          const ext = name.includes(".")
            ? name.slice(name.lastIndexOf("."))
            : "";
          const base = name.includes(".")
            ? name.slice(0, name.lastIndexOf("."))
            : name;
          let i = 1;
          while (usedNames.has(`${base}_${i}${ext}`)) i++;
          name = `${base}_${i}${ext}`;
        }
        usedNames.add(name);
        files.push({ name, data: new Uint8Array(buf) });
      }
      if (!files.length) {
        setStatus({
          type: "error",
          message: "Could not download files to build ZIP.",
        });
        return;
      }
      const zip = await createZipBlob(files);
      downloadBlob(zip, "documents.zip");
      setStatus({ type: "success", message: "ZIP downloaded." });
    } catch {
      setStatus({ type: "error", message: "ZIP download failed." });
    } finally {
      setZipBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">
          Search Documents
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Filter by category, tags, and date range.
        </div>
      </div>

      <div className=" border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Category
              </label>
              <select
                className="w-full  border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("major_head")}
              >
                <option value="">All</option>
                {MAJOR_HEAD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Name / Department
              </label>
              <select
                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("minor_head")}
                disabled={!major}
              >
                <option value="">All</option>
                {minorOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                From Date
              </label>
              <input
                type="date"
                className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("from_date")}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                To Date
              </label>
              <input
                type="date"
                className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("to_date")}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Uploaded By
              </label>
              <input
                className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("uploaded_by")}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Free Text
              </label>
              <input
                className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("search_value")}
              />
              {errors.search_value ? (
                <div className="text-xs font-medium text-red-600">
                  {errors.search_value.message}
                </div>
              ) : null}
            </div>
          </div>

          <TagInput value={tags} onChange={setTags} />

          {status ? (
            <div
              className={` px-3 py-2 text-sm ${
                status.type === "error"
                  ? "bg-red-50 text-red-700"
                  : status.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDownloadAllZip}
              disabled={zipBusy || !rows.length}
              className=" border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Download All (ZIP)
            </button>
            <button
              type="submit"
              className=" bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className=" border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Results</div>
          <div className="text-xs text-slate-500">{rows.length} item(s)</div>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto w-92 md:w-full">
            <table className="text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, idx) => (
                  <tr
                    key={row?.document_id ?? row?.id ?? row?._id ?? idx}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {getRowLabel(row)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {guessKind(row)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(row?.major_head || row?.majorHead || "").toString() ||
                        "—"}{" "}
                      /{" "}
                      {(row?.minor_head || row?.minorHead || "").toString() ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(
                        row?.uploaded_by ||
                        row?.uploadedBy ||
                        row?.user_id ||
                        row?.userId ||
                        ""
                      ).toString() || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDDMMYYYY(
                        row?.document_date || row?.documentDate || row?.date,
                      ) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreview(row)}
                          className=" border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownload(row)}
                          className=" bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-sm text-slate-600">
            No results yet. Run a search.
          </div>
        )}
      </div>

      <Modal
        open={Boolean(preview)}
        title={preview ? `Preview: ${getRowLabel(preview)}` : "Preview"}
        onClose={() => setPreview(null)}
      >
        {preview ? <PreviewBody row={preview} /> : null}
      </Modal>
    </div>
  );
}
