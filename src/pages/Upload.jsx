import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import TagInput from "../components/TagInput.jsx";
import {
  MAJOR_HEAD_OPTIONS,
  MINOR_HEAD_BY_MAJOR,
} from "../constants/options.js";
import { uploadDocument } from "../services/documentService.js";
import { useAuth } from "../state/auth/AuthContext.jsx";
import { formatDDMMYYYY, formatYYYYMMDD } from "../utils/date.js";
import toast from "react-hot-toast";

function isAllowedFile(file) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  if (type === "application/pdf") return true;
  if (type.startsWith("image/")) return true;
  const name = String(file.name || "").toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  );
}

export default function Upload() {
  const { mobileNumber } = useAuth();
  const [tags, setTags] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      document_date: formatYYYYMMDD(new Date()),
      major_head: "Personal",
      minor_head: "",
      document_remarks: "",
      file: null,
    },
  });

  const major = useWatch({ control, name: "major_head" });
  const minorOptions = useMemo(() => MINOR_HEAD_BY_MAJOR[major] || [], [major]);

  useEffect(() => {
    if (!minorOptions.length) return;
    setValue("minor_head", minorOptions[0], { shouldValidate: true });
  }, [major, minorOptions, setValue]);

  const onSubmit = async (values) => {
    const file = values.file?.[0];
    if (!isAllowedFile(file)) {
      toast.error("Only Image and PDF files are allowed.");
      return;
    }

    const payload = {
      major_head: values.major_head,
      minor_head: values.minor_head,
      document_date: formatDDMMYYYY(values.document_date),
      document_remarks: values.document_remarks || "",
      tags: (tags || []).map((t) => ({ tag_name: t })),
      user_id: mobileNumber || "user",
    };

    try {
      const res = await uploadDocument({ file, data: payload });
      toast.success("Upload successful.");
      return res;
    } catch {
      toast.error("Upload failed. Please verify token and try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">
          Upload Document
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Upload a PDF or image with metadata and tags.
        </div>
      </div>

      <div className=" border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Document Date
              </label>
              <input
                type="date"
                className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("document_date", { required: "Date is required" })}
              />
              {errors.document_date ? (
                <div className="text-xs font-medium text-red-600">
                  {errors.document_date.message}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Category
              </label>
              <select
                className="w-full  border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("major_head", { required: true })}
              >
                {MAJOR_HEAD_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                {major === "Personal" ? "Name" : "Department"}
              </label>
              <select
                className="w-full  border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("minor_head", {
                  required: "This field is required",
                })}
              >
                {minorOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {errors.minor_head ? (
                <div className="text-xs font-medium text-red-600">
                  {errors.minor_head.message}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                File (PDF / Image)
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="w-full  border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                {...register("file", { required: "File is required" })}
              />
              {errors.file ? (
                <div className="text-xs font-medium text-red-600">
                  {errors.file.message}
                </div>
              ) : null}
            </div>
          </div>

          <TagInput value={tags} onChange={setTags} />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-800">
              Remarks
            </label>
            <textarea
              rows={3}
              className="w-full  border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              {...register("document_remarks")}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              className=" bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
