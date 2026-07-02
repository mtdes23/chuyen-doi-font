"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ToolPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  children: React.ReactNode;
}

export default function ToolPage({ icon: Icon, title, description, gradient, children }: ToolPageProps) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">{title}</h1>
          <p className="text-slate-400 max-w-xl mx-auto">{description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
