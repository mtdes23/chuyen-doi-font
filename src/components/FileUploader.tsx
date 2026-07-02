"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileIcon, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FileStatus = "idle" | "processing" | "success" | "error";

interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  result?: string;
  errorMessage?: string;
}

interface FileUploaderProps {
  accept: string;
  maxFiles?: number;
  multiple?: boolean;
  processFile: (file: File) => Promise<string>;
  onDownload?: (file: UploadedFile) => void;
  label?: string;
  description?: string;
}

export default function FileUploader({
  accept,
  maxFiles = 10,
  multiple = true,
  processFile,
  onDownload,
  label = "Click or drag files here",
  description = "Upload files to process"
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles - files.length);
      const newEntries: UploadedFile[] = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "idle" as FileStatus
      }));
      setFiles(prev => [...prev, ...newEntries]);
    }
  }, [maxFiles, files.length]);

  const addFiles = (selectedFiles: File[]) => {
    const validFiles = Array.from(selectedFiles).slice(0, maxFiles - files.length);
    const newEntries: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "idle" as FileStatus
    }));
    setFiles(prev => [...prev, ...newEntries]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "success") continue;

      setFiles(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: "processing" };
        return next;
      });

      try {
        const result = await processFile(files[i].file);
        setFiles(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: "success", result };
          return next;
        });
      } catch (err: unknown) {
        setFiles(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status: "error", errorMessage: err instanceof Error ? err.message : "Error" };
          return next;
        });
      }
    }
  };

  const downloadFile = (entry: UploadedFile) => {
    if (!entry.result) return;
    if (onDownload) {
      onDownload(entry);
      return;
    }
    const byteCharacters = atob(entry.result);
    const byteArray = new Uint8Array(Array.from(byteCharacters, c => c.charCodeAt(0)));
    const blob = new Blob([byteArray]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.file.name.replace(/\.[^.]+$/, "") + ".processed";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProcessing = files.some(f => f.status === "processing");
  const allDone = files.length > 0 && files.every(f => f.status === "success" || f.status === "error");

  return (
    <div className="flex flex-col gap-4">
      {!files.length ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            multiple={multiple}
            ref={fileInputRef}
            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            accept={accept}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-2xl transition-all ${isDragging ? "bg-blue-500/20" : "bg-slate-800/80"}`}>
              <Upload className={`w-10 h-10 ${isDragging ? "text-blue-400" : "text-slate-400"}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-200">{label}</p>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">{files.length} file{files.length !== 1 && "s"}</h3>
            <div className="flex gap-2">
              {!isProcessing && !allDone && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-600/50"
                >
                  Add More
                </button>
              )}
              <button
                onClick={() => setFiles([])}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            <input
              type="file"
              multiple={multiple}
              ref={fileInputRef}
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              accept={accept}
              className="hidden"
            />
          </div>

          <div className="max-h-[35vh] overflow-y-auto space-y-2 custom-scrollbar">
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 truncate">{f.file.name}</span>
                    <span className="text-xs text-slate-500">{(f.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {f.status === "idle" && (
                      <button onClick={() => removeFile(f.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {f.status === "processing" && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <span className="text-xs text-blue-400">Processing</span>
                      </div>
                    )}
                    {f.status === "success" && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-xs text-green-400">Done</span>
                        </div>
                        <button onClick={() => downloadFile(f)} className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {f.status === "error" && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10" title={f.errorMessage}>
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs text-red-400 truncate max-w-[100px]">{f.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-700/50">
            {!allDone ? (
              <button
                onClick={processAll}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2.5 px-6 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>Process {files.filter(f => f.status !== "success").length} Files</>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  files.filter(f => f.status === "success").forEach(downloadFile);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2.5 px-6 rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/25"
              >
                Download All
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
