import { useState } from "react";
import api from "../../services/api/axios";

export const REPORT_REASONS = [
  { value: "UNMARKED_SPOILER", label: "Unmarked spoiler" },
  { value: "INSULT", label: "Insult or harassment" },
  { value: "OTHER", label: "Other" },
];

export const REPORT_REASON_LABELS = REPORT_REASONS.reduce((labels, reason) => ({
  ...labels,
  [reason.value]: reason.label,
}), {});

export default function ReportDialog({ open, target, onClose, onSubmitted }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !target) return null;

  const submitReport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/reports", {
        target_type: target.type,
        target_id: target.id,
        reason,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit this report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={submitReport}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report content</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the reason that best matches the issue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {REPORT_REASONS.map((item) => (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                reason === item.value
                  ? "border-[#D0021B] bg-[#D0021B]/10 text-[#D0021B]"
                  : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={item.value}
                checked={reason === item.value}
                onChange={(event) => setReason(event.target.value)}
                className="w-4 h-4 accent-[#D0021B]"
              />
              {item.label}
            </label>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#D0021B] text-sm font-bold text-white hover:bg-[#b30218] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}
