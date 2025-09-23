"use client";

import { useCallback, useRef, useState } from "react";

export default function DropBox({
  label = "Drag & drop a file here, or click to browse",
  hint = "Accepted: .txt",
  accept = ".txt",
  onText,
  className = "",
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  const readFileAsText = (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const allowed = accept
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isAllowed = allowed.some((ext) => lower.endsWith(ext.replace(".", ".")));
    if (!isAllowed) {
      alert(`Unsupported file type. Allowed: ${accept}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      if (typeof onText === "function") onText(String(reader.result || ""), file.name);
    };
    reader.onerror = () => alert("Failed to read file");
    reader.readAsText(file);
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) readFileAsText(file);
    },
    [disabled]
  );

  const onBrowse = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (disabled) return;
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={onBrowse}
        role="button"
        aria-disabled={disabled}
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer select-none transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500 mt-1">{fileName || hint}</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => readFileAsText(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}


