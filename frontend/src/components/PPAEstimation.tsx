import { motion } from 'framer-motion';
import { LayoutGrid, Zap, Timer, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { PPAPredictions } from '../types';

interface PPAEstimationProps {
  predictions: PPAPredictions;
}

export const PPAEstimation: React.FC<PPAEstimationProps> = ({ predictions }) => {
  const area = predictions.area ?? 0;
  const power = predictions.power ?? 0;
  const delay = predictions.delay ?? 0;
  
  // Calculate max frequency
  const maxFreq = predictions.max_frequency ?? (delay > 0 ? 1000 / delay : 0);

  const cards = [
    {
      title: 'Estimated Area',
      value: area.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      unit: 'μm²',
      desc: 'Total cell footprint',
      icon: LayoutGrid,
      color: 'from-primary/20 to-primary/5 border-primary/20',
      glow: 'shadow-glow',
      textColor: 'text-primary',
      // Mock sparkline values
      points: [1.2, 1.4, 1.1, 1.3, 1.0, 1.1, 0.9],
      trend: { direction: 'down', text: '5.2% reduction' },
    },
    {
      title: 'Estimated Power',
      value: power.toFixed(3),
      unit: 'mW',
      desc: 'Static + Dynamic leakage',
      icon: Zap,
      color: 'from-accent/20 to-accent/5 border-accent/20',
      glow: 'shadow-cyanGlow',
      textColor: 'text-accent',
      points: [2.5, 2.7, 2.4, 2.3, 2.6, 2.1, 2.2],
      trend: { direction: 'down', text: '1.8% leakage decrease' },
    },
    {
      title: 'Estimated Delay',
      value: delay.toFixed(2),
      unit: 'ns',
      desc: 'Critical path gate delay',
      icon: Timer,
      color: 'from-secondary/20 to-secondary/5 border-secondary/20',
      glow: 'shadow-blueGlow',
      textColor: 'text-secondary',
      points: [15.2, 14.8, 13.9, 14.1, 13.0, 12.6, 12.68],
      trend: { direction: 'down', text: '7.9% speedup' },
    },
    {
      title: 'Max Clock Frequency',
      value: maxFreq.toFixed(1),
      unit: 'MHz',
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
