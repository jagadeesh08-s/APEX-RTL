import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Database, Brain, Sparkles, FileText, BadgeAlert } from 'lucide-react';

interface TimelineProps {
  currentStep: number; // 0: Idle, 1: Upload, 2: Parsing, 3: AI Predict, 4: Recs, 5: Done
}

export const Timeline: React.FC<TimelineProps> = ({ currentStep }) => {
  const steps = [
    { label: 'RTL Upload', icon: FileUp, desc: 'Read code or select file' },
    { label: 'Feature Extraction', icon: Database, desc: 'Regex-based AST parsing' },
    { label: 'AI Prediction', icon: Brain, desc: 'Inference with Gradient Boosting' },
    { label: 'Quality Evaluation', icon: BadgeAlert, desc: 'Rule checking & DQS score' },
    { label: 'Optimizations', icon: Sparkles, desc: 'Generating remedies' },
    { label: 'Final Report', icon: FileText, desc: 'Interactive console rendering' },
  ];

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Analysis Pipeline</h3>
      <div className="relative pl-6 border-l border-white/5 space-y-6">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep >= stepNum;
          const isCurrent = currentStep === stepNum;
          const Icon = step.icon;

          return (
            <div key={idx} className="relative">
              {/* Node Indicator */}
              <div className="absolute -left-[31px] top-1">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ 
                    scale: isCurrent ? [1, 1.2, 1] : 1,
                    backgroundColor: isCurrent 
                      ? '#7C3AED' 
                      : isActive 
                        ? '#2563EB' 
                        : '#1E293B',
                    borderColor: isCurrent 
                      ? '#A78BFA' 
                      : isActive 
                        ? '#60A5FA' 
                        : '#334155'
                  }}
                  transition={{ repeat: isCurrent ? Infinity : 0, duration: 1.5 }}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center`}
                />
              </div>

              {/* Step Content */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isCurrent 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : isActive 
                      ? 'bg-secondary/20 text-secondary border border-secondary/20' 
                      : 'bg-card/50 text-muted border border-white/5'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-semibold ${
                    isCurrent ? 'text-primary' : isActive ? 'text-text' : 'text-muted'
                  }`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-muted">{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
