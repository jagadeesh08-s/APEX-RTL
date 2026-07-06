import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Zap, Timer, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { PPAPredictions } from '../types';

interface PPAEstimationProps {
  predictions: PPAPredictions;
  node?: string;
}

export const PPAEstimation: React.FC<PPAEstimationProps> = ({ predictions, node = '45nm' }) => {
  const area = predictions.area ?? 0;
  const power = predictions.power ?? 0;
  const delay = predictions.delay ?? 0;
  
  // Calculate max frequency
  const maxFreq = predictions.max_frequency ?? (delay > 0 ? 1000 / delay : 0);

  // Dynamic values and units based on technology node
  const is7nm = node === '7nm';
  
  const areaVal = area.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const areaUnit = is7nm ? 'nm²' : 'μm²';
  
  // Power: 7nm is in microWatts (mW * 1000)
  const powerVal = is7nm ? (power * 1000).toFixed(1) : power.toFixed(3);
  const powerUnit = is7nm ? 'μW' : 'mW';
  
  // Delay: 7nm is in picoseconds (ns * 1000)
  const delayVal = is7nm ? (delay * 1000).toFixed(0) : delay.toFixed(2);
  const delayUnit = is7nm ? 'ps' : 'ns';
  
  // Fmax: if delay is small, Fmax could cross into GHz
  const isGHz = (maxFreq / 1000) >= 1.0;
  const freqVal = isGHz ? (maxFreq / 1000).toFixed(2) : maxFreq.toFixed(1);
  const freqUnit = isGHz ? 'GHz' : 'MHz';

  const cards = [
    {
      title: 'Estimated Area',
      value: areaVal,
      unit: areaUnit,
      desc: is7nm ? 'FinFET layout area footprint' : 'Total cell bulk area footprint',
      icon: LayoutGrid,
      color: 'from-primary/20 to-primary/5 border-primary/20',
      glow: 'shadow-glow',
      textColor: 'text-primary',
      points: [1.2, 1.4, 1.1, 1.3, 1.0, 1.1, 0.9],
      trend: { direction: 'down', text: '5.2% reduction' },
    },
    {
      title: 'Estimated Power',
      value: powerVal,
      unit: powerUnit,
      desc: is7nm ? 'FinFET static leakage + dynamic' : 'Static cell leakage + dynamic',
      icon: Zap,
      color: 'from-accent/20 to-accent/5 border-accent/20',
      glow: 'shadow-cyanGlow',
      textColor: 'text-accent',
      points: [2.5, 2.7, 2.4, 2.3, 2.6, 2.1, 2.2],
      trend: { direction: 'down', text: '1.8% leakage decrease' },
    },
    {
      title: 'Estimated Delay',
      value: delayVal,
      unit: delayUnit,
      desc: 'Critical path stage delay',
      icon: Timer,
      color: 'from-secondary/20 to-secondary/5 border-secondary/20',
      glow: 'shadow-blueGlow',
      textColor: 'text-secondary',
      points: [15.2, 14.8, 13.9, 14.1, 13.0, 12.6, 12.68],
      trend: { direction: 'down', text: '7.9% speedup' },
    },
    {
      title: 'Max Clock Frequency',
      value: freqVal,
      unit: freqUnit,
      desc: 'Fmax boundary threshold',
      icon: Activity,
      color: 'from-success/20 to-success/5 border-success/20',
      glow: 'shadow-success/20',
      textColor: 'text-success',
      points: [65.7, 67.5, 71.9, 70.9, 76.9, 79.3, 78.9],
      trend: { direction: 'up', text: '14.2% Fmax increase' },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br ${card.color} border hover:${card.glow}`}
          >
            {/* Sparkline Visual background */}
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-15 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  d={`M 0 ${20 - card.points[0] * 5} ${card.points.map((pt, i) => `L ${(100 / (card.points.length - 1)) * i} ${20 - pt * 5}`).join(' ')} L 100 20 L 0 20 Z`}
                  fill="currentColor"
                  className={card.textColor}
                />
              </svg>
            </div>

            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{card.title}</span>
                <p className="text-[10px] text-muted">{card.desc}</p>
              </div>
              <div className={`p-2 rounded-xl bg-background/60 border border-white/5 ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-extrabold tracking-tight text-text">
                {card.value}
              </span>
              <span className={`text-xs font-semibold ${card.textColor}`}>{card.unit}</span>
            </div>

            <div className="flex items-center gap-1 mt-1 text-[10px] font-medium">
              {card.trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3 text-success" />
              ) : (
                <TrendingUp className="w-3 h-3 text-success" />
              )}
              <span className="text-success">{card.trend.text}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
