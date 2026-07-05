import React from 'react';
import { motion } from 'framer-motion';

interface DQSGaugeProps {
  score: number;
}

export const DQSGauge: React.FC<DQSGaugeProps> = ({ score }) => {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  // Status mapping
  let statusText = 'Excellent';
  let statusColor = 'text-success';
  let statusBg = 'bg-success/10 border-success/20';
  let strokeColor = '#22C55E'; // Success green

  if (score < 50) {
    statusText = 'Critical';
    statusColor = 'text-danger';
    statusBg = 'bg-danger/10 border-danger/20';
    strokeColor = '#EF4444'; // Danger red
  } else if (score < 75) {
    statusText = 'Warning';
    statusColor = 'text-warning';
    statusBg = 'bg-warning/10 border-warning/20';
    strokeColor = '#F59E0B'; // Warning yellow
  } else if (score < 90) {
    statusText = 'Good';
    statusColor = 'text-secondary';
    statusBg = 'bg-secondary/10 border-secondary/20';
    strokeColor = '#2563EB'; // Secondary blue
  }

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Decorative Glow Grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />

      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 relative z-10">Design Quality Score</h3>
      
      <div className="relative w-36 h-36 flex items-center justify-center mb-4 z-10">
        {/* SVG Circle Gauge */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-background"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(124,58,237,0.3)]"
          />
        </svg>

        {/* Value in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-extrabold tracking-tight text-text"
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-[10px] text-muted uppercase font-semibold">DQS / 100</span>
        </div>
      </div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBg} ${statusColor} relative z-10 shadow-sm`}
      >
        Status: {statusText}
      </motion.div>
    </div>
  );
};
