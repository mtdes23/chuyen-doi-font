"use client";

import { useState } from "react";
import { Image, Maximize, Minimize, Palette, Scissors, Zap, RotateCcw } from "lucide-react";
import ToolPage from "@/components/ToolPage";
import FileUploader from "@/components/FileUploader";

const IMAGE_TOOLS = [
  { id: "resize", label: "Resize", icon: Maximize, description: "Change image dimensions" },
  { id: "compress", label: "Compress", icon: Minimize, description: "Reduce file size" },
  { id: "convert", label: "Convert", icon: Palette, description: "Change format (PNG, JPG, WebP)" },
  { id: "sharpen", label: "Sharpen", icon: Zap, description: "Enhance image clarity" },
  { id: "grayscale", label: "Grayscale", icon: RotateCcw, description: "Convert to black & white" },
  { id: "blur", label: "Blur", icon: Scissors, description: "Apply blur effect" },
];

export default function ImageToolsPage() {
  const [activeTool, setActiveTool] = useState("resize");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState("png");

  return (
    <ToolPage
      icon={Image}
      title="Image Tools"
      description="Process images with professional tools. Resize, compress, convert, sharpen, and apply effects."
      gradient="from-green-500 to-teal-500"
    >
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-700/50">
        {IMAGE_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTool === tool.id
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <tool.icon className="w-4 h-4" />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{IMAGE_TOOLS.find(t => t.id === activeTool)?.label}</h3>
        <p className="text-sm text-slate-400">{IMAGE_TOOLS.find(t => t.id === activeTool)?.description}</p>
      </div>

      {(activeTool === "resize" || activeTool === "compress" || activeTool === "convert" || activeTool === "sharpen" || activeTool === "grayscale" || activeTool === "blur") && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Settings</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeTool === "resize" && (
              <>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Width (px)</label>
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions(p => ({ ...p, width: +e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Height (px)</label>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(p => ({ ...p, height: +e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </>
            )}
            {(activeTool === "compress" || activeTool === "convert") && (
              <>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Quality ({quality}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(+e.target.value)}
                    className="w-full accent-green-500"
                  />
                </div>
                {activeTool === "convert" && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none"
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </div>
                )}
              </>
            )}
            {activeTool === "blur" && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Blur Sigma</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  defaultValue="5"
                  className="w-full accent-green-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <FileUploader
        accept="image/*"
        label="Drop your images here"
        description="Supports PNG, JPG, WebP, AVIF, TIFF, GIF"
        processFile={async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("action", activeTool);
          if (activeTool === "resize") {
            formData.append("width", String(dimensions.width));
            formData.append("height", String(dimensions.height));
          }
          if (activeTool === "compress" || activeTool === "convert") {
            formData.append("quality", String(quality));
          }
          if (activeTool === "convert") {
            formData.append("format", format);
          }
          const res = await fetch("/api/image/process", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data.data;
        }}
      />
    </ToolPage>
  );
}
