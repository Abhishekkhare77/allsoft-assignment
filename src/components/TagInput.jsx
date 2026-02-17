import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTagSuggestions } from "../services/documentService.js";

export default function TagInput({
  value,
  onChange,
  label = "Tags",
  placeholder = "Add tag...",
}) {
  const tags = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchTagSuggestions("");
        const items = Array.isArray(res?.data) ? res.data : [];
        const labels = items
          .map((x) => String(x?.label ?? "").trim())
          .filter(Boolean);
        if (!cancelled) setAllSuggestions(uniqCaseInsensitive(labels));
      } catch {
        if (!cancelled) setAllSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSuggestions = useMemo(() => {
    const q = term.trim().toLowerCase();
    const selected = new Set(tags.map((t) => String(t).trim().toLowerCase()));
    return allSuggestions
      .filter((s) => {
        const v = String(s).trim();
        const l = v.toLowerCase();
        if (!v) return false;
        if (selected.has(l)) return false;
        if (!q) return true;
        return l.includes(q);
      })
      .slice(0, 10);
  }, [allSuggestions, tags, term]);

  const addTag = (next) => {
    const trimmed = String(next || "").trim();
    if (!trimmed) return;
    const nextTags = uniqCaseInsensitive([...tags, trimmed]);
    onChange(nextTags);
    setTerm("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeTag = (tag) => {
    const lower = String(tag).toLowerCase();
    onChange(tags.filter((t) => String(t).toLowerCase() !== lower));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
          >
            <span className="max-w-48 truncate">{t}</span>
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="rounded-full px-1 text-slate-600 hover:bg-slate-200"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <div className="relative min-w-48 flex-1">
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(term);
              }
              if (e.key === "Backspace" && !term && tags.length) {
                removeTag(tags[tags.length - 1]);
              }
            }}
            placeholder={placeholder}
            className="w-full border-0 bg-transparent p-1 text-sm outline-none"
          />
          {open && (loading || filteredSuggestions.length > 0) ? (
            <div className="absolute left-0 right-0 top-9 z-10 max-h-56 overflow-auto  border border-slate-200 bg-white shadow">
              {loading ? (
                <div className="px-3 py-2 text-sm text-slate-500">Loading…</div>
              ) : (
                filteredSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(s)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="text-xs text-slate-500">
        Press Enter or comma to add. Backspace removes last tag.
      </div>
    </div>
  );
}

function uniqCaseInsensitive(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr || []) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
