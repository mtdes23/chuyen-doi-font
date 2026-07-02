"use client";

import { FileText, Image, Type, Sparkles, Zap, Shield, Clock, Globe } from "lucide-react";
import { motion } from "framer-motion";
import ServiceCard from "@/components/ServiceCard";

const SERVICES = [
  {
    icon: FileText,
    title: "PDF Tools",
    description: "Convert, merge, split, compress, and transform PDF files with ease.",
    href: "/tools/pdf",
    gradient: "from-red-500 to-orange-500",
    tools: ["PDF → Image", "Image → PDF", "Merge PDF", "Split PDF", "Compress PDF", "Watermark"]
  },
  {
    icon: Image,
    title: "Image Tools",
    description: "Convert formats, resize, compress, sharpen, and enhance your images.",
    href: "/tools/image",
    gradient: "from-green-500 to-teal-500",
    tools: ["Resize", "Compress", "Convert Format", "Sharpen", "Remove BG", "Grayscale"]
  },
  {
    icon: Type,
    title: "Font Converter",
    description: "Convert fonts between TTF, OTF, WOFF, WOFF2, SVG, and more.",
    href: "/tools/font",
    gradient: "from-blue-500 to-purple-500",
    tools: ["WOFF → TTF", "WOFF2 → OTF", "TTF → SVG", "Font Metadata", "Variable Fonts", "8 Formats"]
  },
  {
    icon: Sparkles,
    title: "AI Tools",
    description: "AI-powered utilities for text extraction, image enhancement, and more.",
    href: "/tools/ai",
    gradient: "from-pink-500 to-violet-500",
    tools: ["OCR Text Extract", "Image Enhance", "Color Correct", "Auto Crop", "Noise Remove", "Upscale"]
  }
];

const STATS = [
  { icon: Zap, value: "100%", label: "Free" },
  { icon: Shield, value: "0", label: "Files Stored" },
  { icon: Clock, value: "<3s", label: "Processing" },
  { icon: Globe, value: "24/7", label: "Available" }
];

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-50" />
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-5 rounded-3xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              DevTools
            </span>
            <span className="text-white ml-3">Hub</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            All-in-one platform for developers. Convert, transform, and process your files with professional-grade tools — completely free.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50"
            >
              <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((service, idx) => (
            <ServiceCard key={service.title} {...service} delay={0.4 + idx * 0.1} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-16 text-center text-sm text-slate-500"
        >
          <p>Designed by <span className="text-blue-400 font-medium">mtdes23</span> • <a href="https://www.mtdes23.id.vn" target="_blank" className="text-blue-400 hover:underline">www.mtdes23.id.vn</a></p>
        </motion.div>
      </div>
    </main>
  );
}
