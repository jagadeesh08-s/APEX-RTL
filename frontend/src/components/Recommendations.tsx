import { motion } from 'framer-motion';
import type { Recommendation } from '../types';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, Sparkles } from 'lucide-react';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ recommendations }) => {
  const getSeverityStyles = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: ShieldAlert,
          bg: 'bg-danger/10 border-danger/20',
          text: 'text-danger',
          border: 'border-danger/30',
          glow: 'rgba(239, 68, 68, 0.1)',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          bg: 'bg-warning/10 border-warning/20',
          text: 'text-warning',
          border: 'border-warning/30',
          glow: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          icon: Info,
          bg: 'bg-accent/10 border-accent/20',
          text: 'text-accent',
          border: 'border-accent/30',
          glow: 'rgba(6, 182, 212, 0.1)',
        };
    }
  };

  // Mock expected improvement mapping based on categories
  const getExpectedImprovement = (category: string) => {
    if (category.includes('TIMING')) {
      return { metric: 'Timing Delay', val: '~12%' };
    }
    if (category.includes('AREA')) {
      return { metric: 'Silicon Area', val: '~8%' };
    }
    return { metric: 'PPA Efficiency', val: '~5%' };
  };

  return (
    <div className="glass-card rounded-2xl p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-text">Actionable Refactoring Recommendations</h3>
          <p className="text-xs text-muted">Localized, rules-based hardware templates to optimize critical paths and footprint.</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-card border border-white/5 text-[10px] font-semibold text-muted">
          {recommendations.length} {recommendations.length === 1 ? 'Issue' : 'Issues'} Flagged
        </span>
      </div>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl bg-background/20">
          <CheckCircle className="w-10 h-10 text-success mb-3 opacity-80" />
          <h4 className="text-sm font-semibold text-text mb-1">Optimal RTL Structure Detected</h4>
          <p className="text-xs text-muted text-center max-w-sm px-4">
            No synthesis issues found. Your Verilog code aligns with standard high-performance VLSI design templates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const styles = getSeverityStyles(rec.severity);
            const Icon = styles.icon;
            const improvement = getExpectedImprovement(rec.category);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl p-5 border ${styles.bg} ${styles.border} relative overflow-hidden`}
                style={{ boxShadow: `inset 0 0 20px ${styles.glow}` }}
              >
                {/* Improvement Badge in top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-white/5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                  <div className="text-right">
                    <span className="block text-[8px] text-muted font-medium uppercase tracking-wider">Est. Improvement</span>
                    <span className="block text-[10px] font-bold text-accent">{improvement.val} {improvement.metric}</span>
                  </div>
                </div>

                {/* Header */}
                <div className="flex items-start gap-3.5 pr-32">
                  <div className={`p-2 rounded-xl bg-background/80 border ${styles.border} ${styles.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.bg} ${styles.text}`}>
                        {rec.severity}
                      </span>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider bg-card border border-white/5 px-2 py-0.5 rounded-full">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-text mb-2 leading-snug">
                      {rec.message}
                    </h4>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-white/5">
                  <div>
                    <span className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1">Hardware Bottleneck</span>
                    <p className="text-muted leading-relaxed">{rec.explanation}</p>
                  </div>
                  <div className="bg-background/40 border border-white/5 rounded-lg p-3">
                    <span className="block text-[9px] text-accent font-bold uppercase tracking-wider mb-1">Remedy / Refactored Code Template</span>
                    <p className="text-text leading-relaxed font-medium">{rec.remedy}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
