"use client";

import { useState } from "react";
import {
  Sparkles, Image, Wand2, Palette, Crop, ArrowUpCircle,
  Type, Hash, AlignLeft, SpellCheck, Shuffle, CaseSensitive,
  Code, Braces, FileCode, Link, Lock, Key, QrCode, GitCompare,
  Paintbrush, Stamp, CircleDot, Grid3X3, Eye, Sun
} from "lucide-react";
import { motion } from "framer-motion";
import ToolPage from "@/components/ToolPage";
import FileUploader from "@/components/FileUploader";

const AI_CATEGORIES = [
  {
    id: "image-effects",
    label: "Image Effects",
    icon: Image,
    tools: [
      { id: "palette", label: "Color Palette", icon: Palette, description: "Extract dominant colors from image" },
      { id: "grayscale", label: "Grayscale", icon: CircleDot, description: "Convert to black & white" },
      { id: "sepia", label: "Sepia", icon: Sun, description: "Vintage sepia tone effect" },
      { id: "vintage", label: "Vintage", icon: Paintbrush, description: "Retro vintage look" },
      { id: "dramatic", label: "Dramatic", icon: Eye, description: "High contrast dramatic effect" },
      { id: "invert", label: "Invert Colors", icon: Shuffle, description: "Invert all colors" },
      { id: "emboss", label: "Emboss", icon: Stamp, description: "3D emboss effect" },
      { id: "edge", label: "Edge Detect", icon: Grid3X3, description: "Find edges in image" },
      { id: "pixelate", label: "Pixelate", icon: Crop, description: "Pixel art effect" },
    ]
  },
  {
    id: "text-tools",
    label: "Text Tools",
    icon: Type,
    tools: [
      { id: "stats", label: "Text Stats", icon: AlignLeft, description: "Detailed text statistics" },
      { id: "sentiment", label: "Sentiment", icon: Sparkles, description: "Analyze text sentiment" },
      { id: "wordcount", label: "Word Count", icon: Hash, description: "Count words & characters" },
      { id: "slugify", label: "Slugify", icon: Link, description: "Convert to URL slug" },
      { id: "uppercase", label: "UPPERCASE", icon: CaseSensitive, description: "Convert to uppercase" },
      { id: "lowercase", label: "lowercase", icon: CaseSensitive, description: "Convert to lowercase" },
      { id: "capitalize", label: "Capitalize", icon: SpellCheck, description: "Capitalize first letters" },
      { id: "titlecase", label: "Title Case", icon: Type, description: "Convert to title case" },
      { id: "reverse", label: "Reverse Text", icon: Shuffle, description: "Reverse all characters" },
      { id: "sort-lines", label: "Sort Lines", icon: AlignLeft, description: "Sort lines alphabetically" },
      { id: "remove-duplicates", label: "Remove Duplicates", icon: Hash, description: "Remove duplicate lines" },
      { id: "trim-whitespace", icon: AlignLeft, label: "Trim Whitespace", description: "Remove extra spaces" },
      { id: "lorem", label: "Lorem Ipsum", icon: Type, description: "Generate dummy text" },
    ]
  },
  {
    id: "code-tools",
    label: "Code & Dev",
    icon: Code,
    tools: [
      { id: "json-format", label: "JSON Format", icon: Braces, description: "Pretty print JSON" },
      { id: "json-minify", label: "JSON Minify", icon: Braces, description: "Compress JSON to one line" },
      { id: "json-validate", label: "JSON Validate", icon: Braces, description: "Check if JSON is valid" },
      { id: "xml-format", label: "XML Format", icon: FileCode, description: "Pretty print XML" },
      { id: "base64-encode", label: "Base64 Encode", icon: Lock, description: "Encode text to Base64" },
      { id: "base64-decode", label: "Base64 Decode", icon: Lock, description: "Decode Base64 to text" },
      { id: "url-encode", label: "URL Encode", icon: Link, description: "Encode URL parameters" },
      { id: "url-decode", label: "URL Decode", icon: Link, description: "Decode URL parameters" },
      { id: "html-encode", label: "HTML Encode", icon: Code, description: "Escape HTML entities" },
      { id: "hash", label: "Hash Generator", icon: Key, description: "MD5, SHA1, SHA256, SHA512" },
      { id: "uuid", label: "UUID Generator", icon: Hash, description: "Generate UUIDs v4" },
      { id: "password", label: "Password Gen", icon: Key, description: "Generate secure passwords" },
      { id: "markdown-html", label: "Markdown → HTML", icon: FileCode, description: "Convert Markdown to HTML" },
    ]
  },
  {
    id: "utilities",
    label: "Utilities",
    icon: QrCode,
    tools: [
      { id: "color-convert", label: "Color Converter", icon: Palette, description: "HEX ↔ RGB ↔ HSL" },
      { id: "color-palette", label: "Color Palette", icon: Palette, description: "Generate color palette" },
      { id: "qr-generate", label: "QR Code", icon: QrCode, description: "Generate QR code from text" },
    ]
  }
];

export default function AIToolsPage() {
  const [activeCategory, setActiveCategory] = useState("image-effects");
  const [activeTool, setActiveTool] = useState("palette");
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageColors, setImageColors] = useState<{ hex: string }[]>([]);
  const [textStats, setTextStats] = useState<Record<string, unknown> | null>(null);
  const [sentiment, setSentiment] = useState<{ score: number; label: string; confidence: number } | null>(null);

  const currentCategory = AI_CATEGORIES.find(c => c.id === activeCategory);
  const currentTool = currentCategory?.tools.find(t => t.id === activeTool);

  const processText = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    try {
      let endpoint = "/api/ai/text";
      if (currentCategory?.id === "code-tools") endpoint = "/api/ai/code";
      if (currentCategory?.id === "utilities") endpoint = "/api/ai/utility";

      const formData = new FormData();
      formData.append("text", textInput);
      formData.append("action", activeTool);

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (data.result !== undefined) setTextResult(typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2));
      if (data.stats) setTextStats(data.stats);
      if (data.sentiment) setSentiment(data.sentiment);
      if (data.colors) setImageColors(data.colors);
      if (data.md5) setTextResult(`MD5: ${data.md5}\nSHA1: ${data.sha1}\nSHA256: ${data.sha256}\nSHA512: ${data.sha512}`);
    } catch (err: unknown) {
      setTextResult("Error: " + (err instanceof Error ? err.message : "Failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const selectTool = (toolId: string) => {
    setActiveTool(toolId);
    setTextResult("");
    setTextStats(null);
    setSentiment(null);
    setImageColors([]);
  };

  return (
    <ToolPage
      icon={Sparkles}
      title="AI Tools"
      description="Powerful AI-powered utilities for images, text, code, and more."
      gradient="from-pink-500 to-violet-500"
    >
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-700/50">
        {AI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); selectTool(cat.tools[0].id); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {currentCategory?.tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => selectTool(tool.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTool === tool.id
                ? "bg-slate-700/80 text-white border border-slate-600/50"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
            }`}
            title={tool.description}
          >
            <tool.icon className="w-3.5 h-3.5" />
            {tool.label}
          </button>
        ))}
      </div>

      {(activeCategory === "image-effects") ? (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">{currentTool?.label}</h3>
            <p className="text-sm text-slate-400">{currentTool?.description}</p>
          </div>
          <FileUploader
            accept="image/*"
            label={`Drop image for ${currentTool?.label}`}
            description="PNG, JPG, WebP supported"
            processFile={async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("action", activeTool);
              const res = await fetch("/api/ai/image", { method: "POST", body: formData });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              if (data.colors) {
                setImageColors(data.colors);
                return data.colors[0]?.hex || "#000000";
              }
              return data.data;
            }}
          />
          {imageColors.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Extracted Colors</h4>
              <div className="flex flex-wrap gap-2">
                {imageColors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-md border border-slate-600/50" style={{ backgroundColor: c.hex }} />
                    <span className="text-xs text-slate-400 font-mono">{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">{currentTool?.label}</h3>
            <p className="text-sm text-slate-400">{currentTool?.description}</p>
          </div>

          <div className="mb-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={activeTool === "password" ? "Enter desired password length..." : activeTool === "uuid" ? "Enter number of UUIDs to generate..." : activeTool === "lorem" ? "Enter number of sentences..." : "Enter your text here..."}
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 resize-none custom-scrollbar"
            />
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={processText}
              disabled={isProcessing || (!textInput.trim() && activeTool !== "uuid" && activeTool !== "password")}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white py-2.5 px-6 rounded-xl font-medium text-sm transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Process"}
            </button>
          </div>

          {textStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {Object.entries(textStats).filter(([k]) => !['topWords'].includes(k)).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <div className="text-xs text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-lg font-bold text-white">{String(value)}</div>
                </div>
              ))}
            </div>
          )}

          {sentiment && (
            <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Sentiment Analysis</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Score</div>
                  <div className={`text-lg font-bold ${sentiment.score > 0 ? 'text-green-400' : sentiment.score < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {sentiment.score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Label</div>
                  <div className="text-lg font-bold text-white">{sentiment.label}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-blue-400">{(sentiment.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

          {textResult && (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Result</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(textResult)}
                  className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded bg-slate-800/50"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm text-slate-200 whitespace-pre-wrap break-all font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
                {textResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </ToolPage>
  );
}
