"use client";

import { useState } from "react";
import { Sparkles, Image, Palette, Crop, Wand2, ArrowUpCircle } from "lucide-react";
import ToolPage from "@/components/ToolPage";
import FileUploader from "@/components/FileUploader";

const AI_TOOLS = [
  { id: "upscale", label: "Upscale", icon: ArrowUpCircle, description: "Increase image resolution with AI" },
  { id: "sharpen", label: "AI Sharpen", icon: Wand2, description: "Enhance image details intelligently" },
  { id: "denoise", label: "Denoise", icon: Sparkles, description: "Remove noise and grain from images" },
  { id: "enhance", label: "Enhance", icon: Image, description: "Auto-enhance brightness, contrast, colors" },
  { id: "grayscale", label: "Grayscale AI", icon: Palette, description: "Smart black & white conversion" },
  { id: "crop", label: "Smart Crop", icon: Crop, description: "AI-powered intelligent cropping" },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState("upscale");
  const [scaleFactor, setScaleFactor] = useState(2);

  return (
    <ToolPage
      icon={Sparkles}
      title="AI Tools"
      description="AI-powered image processing. Upscale, sharpen, denoise, and enhance your images automatically."
      gradient="from-pink-500 to-violet-500"
    >
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-700/50">
        {AI_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTool === tool.id
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <tool.icon className="w-4 h-4" />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{AI_TOOLS.find(t => t.id === activeTool)?.label}</h3>
        <p className="text-sm text-slate-400">{AI_TOOLS.find(t => t.id === activeTool)?.description}</p>
      </div>

      {activeTool === "upscale" && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <label className="text-xs text-slate-500 mb-2 block">Scale Factor: {scaleFactor}x</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(s => (
              <button
                key={s}
                onClick={() => setScaleFactor(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scaleFactor === s
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/50 hover:bg-slate-700"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      <FileUploader
        accept="image/*"
        label="Drop images for AI processing"
        description="AI will automatically enhance your images"
        processFile={async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("action", activeTool);
          if (activeTool === "upscale") {
            formData.append("scale", String(scaleFactor));
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
