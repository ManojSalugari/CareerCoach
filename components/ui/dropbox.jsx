"use client";

import { useCallback, useRef, useState } from "react";

export default function DropBox({
  label = "Drag & drop a file here, or click to browse",
  hint = "Accepted: .txt, .md, .pdf",
  accept = ".txt,.md,.pdf",
  onText,
  className = "",
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  const readPdfText = async (file) => {
    try {
      let pdfjsLib;
      try {
        pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      } catch {
        pdfjsLib = await import("pdfjs-dist/build/pdf");
      }
      const workerVersion = pdfjsLib.version || "4.4.168";
      const setWorkerSrc = (src) => {
        if (typeof pdfjsLib.GlobalWorkerOptions !== "undefined") {
          pdfjsLib.GlobalWorkerOptions.workerSrc = src;
        }
      };

      // 1) Try CDN worker
      setWorkerSrc(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.js`);
      const arrayBuffer = await file.arrayBuffer();
      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } catch (err1) {
        // 2) Fallback: fetch worker script, create blob URL (same-origin)
        try {
          const resp = await fetch(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.js`, { mode: "cors" });
          const script = await resp.text();
          const blob = new Blob([script], { type: "text/javascript" });
          const blobUrl = URL.createObjectURL(blob);
          setWorkerSrc(blobUrl);
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } catch (err2) {
          console.error("Worker setup failed", err1, err2);
          throw new Error("Worker blocked");
        }
      }
      const numPages = pdf.numPages;
      let fullText = "";
      for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        fullText += strings.join(" ") + "\n\n";
      }
      const text = fullText.trim();
      if (!text) {
        throw new Error("No extractable text found (likely scanned image PDF).");
      }
      return text;
    } catch (e) {
      console.error("PDF text extraction error", e);
      alert(
        e?.message?.includes("No extractable text")
          ? "Failed to extract text: PDF appears to be scanned/image-only (OCR required)."
          : "Failed to extract text from PDF (worker blocked or invalid file). Try another PDF or paste text manually."
      );
      return "";
    }
  };

  const serverExtractPdf = async (file) => {
    try {
      const resp = await fetch("/api/pdf-extract", {
        method: "POST",
        headers: { "content-type": "application/pdf" },
        body: file,
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return data.text || "";
    } catch (e) {
      console.error("Server PDF extract failed", e);
      return "";
    }
  };

  const readFileAsText = async (file) => {
    if (!file) return;
    const lower = (file.name || "").toLowerCase();
    const allowed = (accept || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const isAllowed = allowed.length === 0 || allowed.some((ext) => lower.endsWith(ext));
    if (!isAllowed) {
      alert(`Unsupported file type. Allowed: ${accept}`);
      return;
    }
    if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      // Prefer server-side extraction to avoid browser worker/CORS issues
      let text = await serverExtractPdf(file);
      if (!text) {
        text = await readPdfText(file);
      }
      setFileName(file.name);
      if (text && typeof onText === "function") onText(text, file.name);
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
          onChange={async (e) => readFileAsText(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}


