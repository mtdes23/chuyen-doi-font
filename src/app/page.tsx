"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, RefreshCw, Type, File as FileIcon, Loader2, Archive, Coffee, X, Heart, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import JSZip from "jszip";

type FileStatus = "idle" | "converting" | "success" | "error";
type FontFormat = "ttf" | "otf" | "woff" | "woff2" | "eot" | "var-ttf" | "svg" | "afm";

// Format categories for better UI organization
const FORMAT_CATEGORIES = {
  desktop: { label: "🖥️ Desktop Formats", formats: ["ttf", "otf", "var-ttf"] },
  web: { label: "🌐 Web Formats", formats: ["woff", "woff2", "svg"] },
  legacy: { label: "📦 Legacy/Special", formats: ["eot", "afm"] }
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
    // Filter supported font formats
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
    // Process files sequentially or slightly concurrent to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => {
        const next = [...prev];
        if (next[i].status === "idle" || next[i].status === "error") {
          next[i].status = "converting";
        }
        return next;
      });

      // Avoid re-converting completed files
      if (files[i].status === 'success') continue;

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

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/20 p-3 rounded-2xl ring-1 ring-primary/30">
              <Type className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Font Converter Pro
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Batch convert up to 10 <b>font files</b> between multiple formats at once.
          </p>
        </motion.div>

        <div className="w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl ring-1 ring-white/10 flex flex-col gap-6">
          {!hasFiles ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-slate-300">Output Format</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowFormatMenu(!showFormatMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-sm text-slate-200 transition-colors"
                  >
                    {SUPPORTED_FORMATS.find(f => f.value === outputFormat)?.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showFormatMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-2xl z-10 w-[320px] max-h-[400px] overflow-y-auto"
                    >
                      {Object.entries(FORMAT_CATEGORIES).map(([category, { label, formats }]) => (
                        <div key={category}>
                          <div className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-900/50 border-b border-white/5 sticky top-0">
                            {label}
                          </div>
                          {SUPPORTED_FORMATS.filter(f => formats.includes(f.value)).map(fmt => (
                            <button
                              key={fmt.value}
                              onClick={() => {
                                setOutputFormat(fmt.value);
                                setShowFormatMenu(false);
                              }}
                              className={`w-full text-left px-4 py-3 transition-colors border-b border-white/5 last:border-b-0 ${
                                outputFormat === fmt.value
                                  ? "bg-blue-600/30 text-blue-400"
                                  : "text-slate-300 hover:bg-slate-700/50"
                              }`}
                            >
                              <div className="font-medium text-sm">{fmt.label}</div>
                              <div className="text-xs text-slate-500 mt-1">{fmt.description}</div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
              </>
          ) : null}

          {!hasFiles ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
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
              <div className="flex flex-col items-center gap-4 cursor-pointer">
                <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-slate-800"}`}>
                  <Upload className={`w-10 h-10 transition-colors ${isDragging ? "text-primary" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-200">
                    Click or drag your font files here
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Supported: All major formats - .ttf, .otf, .woff, .woff2, .var-ttf, .eot, .svg, .afm
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-semibold text-white">
                  {files.length} File{files.length !== 1 && "s"} Selected
                </h3>
                <div className="flex gap-3">
                  {!isConverting && !allCompleted && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-white/5"
                    >
                      Add More
                    </button>
                  )}
                  <button
                    onClick={resetState}
                    disabled={isConverting}
                    className="px-4 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
                  >
                    Clear All
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

              <div className="max-h-[40vh] overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
                <AnimatePresence>
                  {files.map(file => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 group hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-200 truncate">{file.file.name}</span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        {file.status === "idle" && !isConverting && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        {file.status === "converting" && (
                          <div className="flex items-center gap-2 text-primary text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Converting</span>
                          </div>
                        )}
                        {file.status === "success" && (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>Done</span>
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="flex items-center gap-2 text-red-400 text-sm max-w-[150px] truncate" title={file.errorMessage}>
                            <AlertCircle className="w-4 h-4" />
                            <span className="truncate">{file.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                {!allCompleted ? (
                  <button
                    onClick={startConversion}
                    disabled={isConverting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-xl font-medium transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isConverting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Convert {files.filter(f => f.status !== 'success').length} Files
                      </>
                    )}
                  </button>
                ) : (
                  hasSuccess && (
                    <button
                      onClick={downloadAllAsZip}
                      disabled={isZipping}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-xl font-medium transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Zipping Files...
                        </>
                      ) : (
                        <>
                          <Archive className="w-5 h-5" />
                          Download All (ZIP)
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-12 text-sm text-slate-500 text-center flex flex-col gap-2">
          <p>Files are processed securely and never stored on our servers.</p>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-slate-400">Designed by <span className="text-primary font-medium">mtdes23</span></p>
            <a href="https://www.mtdes23.id.vn" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-blue-400 hover:underline transition-colors">
              www.mtdes23.id.vn
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDonate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setShowDonate(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-primary/10 rounded-full blur-[50px] pointer-events-none" />

              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
                <Heart className="w-8 h-8 text-white fill-white/20" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Ủng hộ tác giả</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Hệ thống chỉ cho phép chuyển đổi tối đa 10 font cùng lúc hoàn toàn miễn phí. Để yêu cầu tính năng mới và ủng hộ tinh thần tác giả, vui lòng Donate qua hình thức dưới đây nhé! ❤️
              </p>

              <div className="space-y-4">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 hover:border-pink-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-6 h-6 text-pink-400" />
                    <span className="font-semibold text-white">Buy Me a Coffee (Momo)</span>
                  </div>
                  <p className="text-slate-400 text-sm ml-9 break-all">Số điện thoại: <strong className="text-white text-base">0336779222</strong></p>

                  <div className="mt-4 flex justify-center bg-white p-2 rounded-xl">
                    <Image
                      src="/momo-qr.jpg"
                      alt="Momo QR Code"
                      width={256}
                      height={256}
                      className="object-contain rounded-lg"
                      unoptimized={true}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDonate(false)}
                className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Đã hiểu, tiếp tục
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
