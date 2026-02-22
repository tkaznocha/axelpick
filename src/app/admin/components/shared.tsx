"use client";

import { useState, useRef, useEffect } from "react";

// ---------- InlineEditField ----------

interface InlineEditFieldProps {
  value: string | number;
  onSave: (value: string) => Promise<void> | void;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  label?: string;
  className?: string;
  displayFormatter?: (value: string | number) => string;
}

export function InlineEditField({
  value,
  onSave,
  type = "text",
  options,
  label,
  className = "",
  displayFormatter,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  async function handleSave() {
    if (editValue === String(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditValue(String(value));
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`text-left hover:bg-black/5 rounded px-1.5 py-0.5 -mx-1.5 transition-colors ${className}`}
        title={label ? `Edit ${label}` : "Click to edit"}
      >
        {displayFormatter ? displayFormatter(value) : String(value)}
      </button>
    );
  }

  const inputClass =
    "rounded-lg border border-emerald bg-background px-2 py-1 text-sm outline-none ring-1 ring-emerald";

  return (
    <span className="inline-flex items-center gap-1.5">
      {type === "select" && options ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClass}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${inputClass} w-auto`}
          style={{ minWidth: type === "number" ? "80px" : "120px" }}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-emerald px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {saving ? "..." : "Save"}
      </button>
      <button
        onClick={handleCancel}
        className="rounded border border-black/10 px-2 py-1 text-xs font-medium text-text-secondary hover:bg-black/5"
      >
        Cancel
      </button>
    </span>
  );
}

// ---------- ConfirmDialog ----------

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
