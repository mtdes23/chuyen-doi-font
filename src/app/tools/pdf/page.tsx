"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Merge, Scissors, Droplets, Stamp } from "lucide-react";
import ToolPage from "@/components/ToolPage";
import FileUploader from "@/components/FileUploader";

const PDF_TOOLS = [
  { id: "to-image", label: "PDF → Image", icon: ImageIcon, description: "Convert PDF pages to PNG/JPG" },
  { id: "merge", label: "Merge PDFs", icon: Merge, description: "Combine multiple PDFs into one" },
  { id: "split", label: "Split PDF", icon: Scissors, description: "Extract pages from PDF" },
  { id: "compress", label: "Compress PDF", icon: Droplets, description: "Reduce PDF file size" },
  { id: "watermark", label: "Add Watermark", icon: Stamp, description: "Stamp text on PDF pages" },
];

export default function PDFToolsPage() {
  const [activeTool, setActiveTool] = useState("to-image");

  return (
    <ToolPage
      icon={FileText}
      title="PDF Tools"
      description="Professional PDF processing tools. Convert, merge, split, compress, and watermark your PDF files."
      gradient="from-red-500 to-orange-500"
    >
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-slate-700/50">
        {PDF_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTool === tool.id
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <tool.icon className="w-4 h-4" />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{PDF_TOOLS.find(t => t.id === activeTool)?.label}</h3>
        <p className="text-sm text-slate-400">{PDF_TOOLS.find(t => t.id === activeTool)?.description}</p>
      </div>

      {activeTool === "to-image" && (
        <FileUploader
          accept=".pdf"
          label="Drop your PDF here"
          description="Each page will be converted to an image"
          processFile={async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/pdf/convert", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.data;
          }}
        />
      )}

      {activeTool === "merge" && (
        <FileUploader
          accept=".pdf"
          label="Drop multiple PDFs to merge"
          description="Files will be merged in upload order"
          processFile={async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/pdf/merge", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.data;
          }}
        />
      )}

      {activeTool === "split" && (
        <FileUploader
          accept=".pdf"
          label="Drop a PDF to split"
          description="Each page will be saved as a separate file"
          processFile={async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/pdf/split", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.data;
          }}
        />
      )}

      {activeTool === "compress" && (
        <FileUploader
          accept=".pdf"
          label="Drop a PDF to compress"
          description="Reduce file size while maintaining quality"
          processFile={async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/pdf/compress", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.data;
          }}
        />
      )}

      {activeTool === "watermark" && (
        <FileUploader
          accept=".pdf"
          label="Drop a PDF to watermark"
          description="Add a text watermark to every page"
          processFile={async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("text", "CONFIDENTIAL");
            const res = await fetch("/api/pdf/watermark", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data.data;
          }}
        />
      )}
    </ToolPage>
  );
}
