"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
  tools: string[];
  delay?: number;
}

export default function ServiceCard({ icon: Icon, title, description, href, gradient, tools, delay = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Link href={href} className="block group">
        <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 h-full">
          <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none`} />
          
          <div className="relative">
            <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-sm text-slate-400 mb-4">{description}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tools.map(tool => (
                <span key={tool} className="px-2 py-0.5 text-xs rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  {tool}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
              Explore Tools <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
