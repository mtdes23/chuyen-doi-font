"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Type,
  File as FileIcon,
  Loader2,
  Archive,
  Coffee,
  X,
  Heart,
  Download,
  Trash2,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import JSZip from "jszip";

type FileStatus = "idle" | "converting" | "success" | "error";
type FontFormat = "ttf" | "otf" | "woff" | "woff2" | "eot" | "var-ttf" | "svg" | "afm";

const FORMAT_CATEGORIES = {
  desktop: { label: "Desktop Formats", formats: ["ttf", "otf", "var-ttf"] },
  web: { label: "Web Formats", formats: ["woff", "woff2", "svg"] },
  legacy: { label: "Legacy/Special", formats: ["eot", "afm"] }
};

const SUPPORTED_FORMATS: { value: FontFormat; label: string; description: string }[] = [
  { value: "ttf", label: "TTF (TrueType)", description: "Classic desktop font format, widely supported" },
  { value: "otf", label: "OTF (OpenType)", description: "Modern format with advanced typography features" },
  { value: "var-ttf", label: "Variable TTF", description: "Single font with multiple weight/width variations" },
  { value: "woff", label: "WOFF (Web Font)", description: "Optimized for web, supported by all modern browsers" },
  { value: "woff2", label: "WOFF2 (Web Font 2)", description: "Highly compressed web format, best for performance" },
  { value: "svg", label: "SVG Font", description: "Vector-based font for web animations and scalability" },
  { value: "eot", label: "EOT (Embedded OpenType)", description: "Legacy Internet Explorer format" },
  { value: "afm", label: "AFM (Font Metrics)", description: "Adobe Font Metrics - text format with font specifications" }
];

const SUPPORTED_INPUT_EXTS = ["ttf", "otf", "woff", "woff2", "var-ttf", "eot", "svg", "afm"];

const FEATURES = [
  { icon: Zap, title: "Lightning Fast", desc: "Convert fonts in seconds" },
  { icon: Shield, title: "Secure & Private", desc: "Files never stored on servers" },
  { icon: Clock, title: "Batch Processing", desc: "Up to 10 files at once" }
];

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  errorMessage?: string;
  convertedData?: string;
  outputFormat?: FontFormat;
  metadata?: {
    familyName?: string;
    styleName?: string;
    version?: string;
    glyphCount?: number;
  };
}

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [outputFormat, setOutputFormat] = useState<FontFormat>("ttf");
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(f => {
      const name = f.name.toLowerCase();
      const ext = name.split('.').pop() || "";
      return SUPPORTED_INPUT_EXTS.includes(ext);
    });

    if (validFiles.length === 0) return;

    setFiles(prev => {
      const combined = [...prev];
      let limitReached = false;

      for (const file of validFiles) {
        if (combined.length >= 10) {
          limitReached = true;
          break;
        }
        combined.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: "idle",
          outputFormat
        });
      }

      if (limitReached) {
        setShowDonate(true);
      }

      return combined;
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startConversion = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "success") continue;

      setFiles(prev => {
        const next = [...prev];
        if (next[i].status === "idle" || next[i].status === "error") {
          next[i].status = "converting";
        }
        return next;
      });

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);
        formData.append("outputFormat", outputFormat);

        const res = await fetch("/api/convert", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to convert file");

        setFiles(prev => {
          const next = [...prev];
          next[i].status = "success";
          next[i].convertedData = data.data;
          next[i].outputFormat = outputFormat;
          next[i].metadata = data.metadata;
          return next;
        });
      } catch (err: unknown) {
        setFiles(prev => {
          const next = [...prev];
          next[i].status = "error";
          next[i].errorMessage = err instanceof Error ? err.message : "Unknown error";
          return next;
        });
      }
    }
  };

  const downloadFile = (fileEntry: FileEntry) => {
    if (!fileEntry.convertedData) return;

    const nameWithoutExt = fileEntry.file.name.replace(/\.(ttf|otf|woff2?|WOFF|WOFF2|TTF|OTF)$/i, "");
    const ext = fileEntry.outputFormat || "ttf";
    const byteCharacters = atob(fileEntry.convertedData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `font/${ext}` });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nameWithoutExt}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const successfulFiles = files.filter(f => f.status === "success" && f.convertedData);
    if (successfulFiles.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();

    successfulFiles.forEach(f => {
      const nameWithoutExt = f.file.name.replace(/\.(ttf|otf|woff2?|WOFF|WOFF2|TTF|OTF)$/i, "");
      const ext = f.outputFormat || "ttf";
      zip.file(`${nameWithoutExt}.${ext}`, f.convertedData!, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);

    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-fonts.zip";
    a.click();

    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const resetState = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isConverting = files.some(f => f.status === "converting");
  const hasFiles = files.length > 0;
  const allCompleted = hasFiles && files.every(f => f.status === "success" || f.status === "error");
  const hasSuccess = files.some(f => f.status === "success");
  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;

  const formatLabel = SUPPORTED_FORMATS.find(f => f.value === outputFormat)?.label || outputFormat.toUpperCase();

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col items-center p-6 sm:p-12">
        <div className="w-full max-w-5xl z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <div className="flex justify-center items-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-3xl">
                  <Type className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Font Converter
              </span>
              <span className="text-white ml-3">Pro</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 max-w-2xl mx-auto"
            >
              Professional font conversion tool. Transform fonts between <b className="text-slate-300">8 formats</b> — TTF, OTF, WOFF, WOFF2, Variable TTF, SVG, EOT, and AFM.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full"
          >
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm"
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600/50">
                  <feature.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50 flex flex-col gap-6"
          >
            {!hasFiles && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300">Output Format</h3>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatMenu(!showFormatMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500/50 rounded-xl text-sm text-slate-200 transition-all"
                  >
                    {formatLabel}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFormatMenu ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showFormatMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl z-50 w-[340px] max-h-[420px] overflow-y-auto"
                      >
                        {Object.entries(FORMAT_CATEGORIES).map(([category, { label, formats }]) => (
                          <div key={category}>
                            <div className="px-4 py-2.5 text-xs font-semibold text-slate-400 bg-slate-900/50 border-b border-slate-700/30 sticky top-0">
                              {label}
                            </div>
                            {SUPPORTED_FORMATS.filter(f => formats.includes(f.value)).map(fmt => (
                              <button
                                key={fmt.value}
                                onClick={() => {
                                  setOutputFormat(fmt.value);
                                  setShowFormatMenu(false);
                                }}
                                className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-700/20 last:border-b-0 ${
                                  outputFormat === fmt.value
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "text-slate-300 hover:bg-slate-700/50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{fmt.label}</span>
                                  {outputFormat === fmt.value && (
                                    <CheckCircle className="w-4 h-4 text-blue-400" />
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{fmt.description}</div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {!hasFiles ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                    : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".ttf,.otf,.woff,.woff2,.var-ttf,.eot,.svg,.afm"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-5">
                  <motion.div
                    animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    className={`p-5 rounded-2xl transition-all ${
                      isDragging
                        ? "bg-blue-500/20 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800/80"
                    }`}
                  >
                    <Upload
                      className={`w-12 h-12 transition-colors ${
                        isDragging ? "text-blue-400" : "text-slate-400"
                      }`}
                    />
                  </motion.div>
                  <div>
                    <p className="text-xl font-semibold text-slate-200 mb-2">
                      {isDragging ? "Drop your files here" : "Click or drag font files to upload"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Supported: .ttf, .otf, .woff, .woff2, .var-ttf, .eot, .svg, .afm — Up to 10 files
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap justify-center">
                    <span className="px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700/50">WOFF</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">TTF</span>
                    <span className="text-slate-600">/</span>
                    <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">OTF</span>
                    <span className="text-slate-600">/</span>
                    <span className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400">SVG</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/50 pb-5">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-white">
                      {files.length} File{files.length !== 1 && "s"}
                    </h3>
                    {allCompleted && (
                      <div className="flex items-center gap-2">
                        {successCount > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            {successCount} converted
                          </span>
                        )}
                        {errorCount > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            {errorCount} failed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!isConverting && !allCompleted && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-600/50 hover:border-slate-500/50"
                      >
                        Add More
                      </button>
                    )}
                    <button
                      onClick={resetState}
                      disabled={isConverting}
                      className="p-2.5 text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-red-500/10 rounded-xl transition-all border border-slate-600/50 hover:border-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".ttf,.otf,.woff,.woff2,.var-ttf,.eot,.svg,.afm"
                    className="hidden"
                  />
                </div>

                <div className="max-h-[45vh] overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
                  <AnimatePresence>
                    {files.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all group"
                      >
                        <div className="flex items-center gap-4 truncate flex-1">
                          <div className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/30">
                            <FileIcon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="truncate flex-1">
                            <p className="text-sm font-medium text-slate-200 truncate">{file.file.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(file.file.size / 1024).toFixed(1)} KB
                              {file.status === "success" && (
                                <span className="text-green-400 ml-2">→ {file.outputFormat?.toUpperCase()}</span>
                              )}
                            </p>
                            {file.status === "success" && file.metadata?.familyName && (
                              <p className="text-xs text-slate-600 mt-0.5">
                                {file.metadata.familyName} {file.metadata.styleName && `• ${file.metadata.styleName}`}
                                {file.metadata.glyphCount ? ` • ${file.metadata.glyphCount} glyphs` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          {file.status === "idle" && !isConverting && (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {file.status === "converting" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                              <span className="text-sm text-blue-400 font-medium">Converting</span>
                            </div>
                          )}
                          {file.status === "success" && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400 font-medium">Done</span>
                              </div>
                              <button
                                onClick={() => downloadFile(file)}
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {file.status === "error" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 max-w-[200px]" title={file.errorMessage}>
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-sm text-red-400 truncate">{file.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pt-5 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    {!allCompleted ? (
                      <span>{files.filter(f => f.status !== "success").length} file{files.filter(f => f.status !== "success").length !== 1 && "s"} remaining</span>
                    ) : (
                      <span className="text-green-400">All files converted successfully!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!allCompleted ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startConversion}
                        disabled={isConverting}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-8 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Convert {files.filter(f => f.status !== "success").length} Files
                          </>
                        )}
                      </motion.button>
                    ) : (
                      hasSuccess && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={downloadAllAsZip}
                          disabled={isZipping}
                          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 px-8 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
                        >
                          {isZipping ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Zipping...
                            </>
                          ) : (
                            <>
                              <Archive className="w-5 h-5" />
                              Download All (ZIP)
                            </>
                          )}
                        </motion.button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-sm text-slate-500 text-center flex flex-col gap-2"
          >
            <p className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Files are processed securely and never stored on our servers.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-slate-400">
                Designed by <span className="text-blue-400 font-medium">mtdes23</span>
              </p>
              <a
                href="https://www.mtdes23.id.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                www.mtdes23.id.vn
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showDonate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setShowDonate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowDonate(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Heart className="w-8 h-8 text-white fill-white/20" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Support the Developer</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                This tool is free with a 10-file limit. If you find it useful, consider buying me a coffee to support future features!
              </p>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-pink-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-6 h-6 text-pink-400" />
                    <span className="font-semibold text-white">Buy Me a Coffee (Momo)</span>
                  </div>
                  <p className="text-slate-400 text-sm ml-9">
                    Phone: <strong className="text-white text-base">0336779222</strong>
                  </p>

                  <div className="mt-2 flex justify-center bg-white p-3 rounded-xl">
                    <Image
                      src="/momo-qr.jpg"
                      alt="Momo QR Code"
                      width={200}
                      height={200}
                      className="object-contain rounded-lg"
                      unoptimized={true}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDonate(false)}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold transition-all shadow-lg shadow-pink-500/25"
              >
                Got it, Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
