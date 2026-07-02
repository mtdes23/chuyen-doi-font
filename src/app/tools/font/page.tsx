"use client";

import { useState } from "react";
import { Type, ChevronDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ToolPage from "@/components/ToolPage";
import FileUploader from "@/components/FileUploader";

const FORMAT_CATEGORIES = {
  desktop: { label: "Desktop Formats", formats: ["ttf", "otf", "var-ttf"] },
  web: { label: "Web Formats", formats: ["woff", "woff2", "svg"] },
  legacy: { label: "Legacy/Special", formats: ["eot", "afm"] }
};

const SUPPORTED_FORMATS = [
  { value: "ttf", label: "TTF (TrueType)", description: "Classic desktop font format" },
  { value: "otf", label: "OTF (OpenType)", description: "Modern format with advanced features" },
  { value: "var-ttf", label: "Variable TTF", description: "Multiple weight/width variations" },
  { value: "woff", label: "WOFF", description: "Optimized for web browsers" },
  { value: "woff2", label: "WOFF2", description: "Highly compressed web format" },
  { value: "svg", label: "SVG Font", description: "Vector-based font format" },
  { value: "eot", label: "EOT", description: "Legacy IE format" },
  { value: "afm", label: "AFM", description: "Adobe Font Metrics" }
];

export default function FontToolsPage() {
  const [outputFormat, setOutputFormat] = useState("ttf");
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  return (
    <ToolPage
      icon={Type}
      title="Font Converter"
      description="Convert fonts between 8 formats: TTF, OTF, WOFF, WOFF2, Variable TTF, SVG, EOT, AFM."
      gradient="from-blue-500 to-purple-500"
    >
      <div className="mb-6 pb-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-300">Output Format</h4>
          <div className="relative">
            <button
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 rounded-xl text-sm text-slate-200 transition-all"
            >
              {SUPPORTED_FORMATS.find(f => f.value === outputFormat)?.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFormatMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showFormatMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl z-50 w-[300px] max-h-[350px] overflow-y-auto"
                >
                  {Object.entries(FORMAT_CATEGORIES).map(([category, { label, formats }]) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-900/50 border-b border-slate-700/30 sticky top-0">
                        {label}
                      </div>
                      {SUPPORTED_FORMATS.filter(f => formats.includes(f.value)).map(fmt => (
                        <button
                          key={fmt.value}
                          onClick={() => { setOutputFormat(fmt.value); setShowFormatMenu(false); }}
                          className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-700/20 last:border-b-0 ${
                            outputFormat === fmt.value ? "bg-blue-500/10 text-blue-400" : "text-slate-300 hover:bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{fmt.label}</span>
                            {outputFormat === fmt.value && <CheckCircle className="w-4 h-4 text-blue-400" />}
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
      </div>

      <FileUploader
        accept=".ttf,.otf,.woff,.woff2,.var-ttf,.eot,.svg,.afm"
        label="Drop your font files here"
        description="Supports TTF, OTF, WOFF, WOFF2, Variable TTF, SVG, EOT, AFM"
        processFile={async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("outputFormat", outputFormat);
          const res = await fetch("/api/convert", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data.data;
        }}
      />
    </ToolPage>
  );
}
