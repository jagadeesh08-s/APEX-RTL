import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { AttributionItem } from '../types';
import { HelpCircle } from 'lucide-react';

interface ExplainableAIProps {
  attributions: {
    area: AttributionItem[];
    power: AttributionItem[];
    delay: AttributionItem[];
  };
}

export const ExplainableAI: React.FC<ExplainableAIProps> = ({ attributions }) => {
  const metrics = [
    { key: 'area', label: 'Area Drivers', color: '#7C3AED', glow: 'rgba(124,58,237,0.3)' },
    { key: 'power', label: 'Power Drivers', color: '#06B6D4', glow: 'rgba(6,182,212,0.3)' },
    { key: 'delay', label: 'Delay Drivers', color: '#2563EB', glow: 'rgba(37,99,235,0.3)' },
  ];

  // Helper to format feature names for humans
  const formatFeatureName = (name: string): string => {
    return name
      .replace('num_', '')
      .replace('bitwidth_', '')
      .replace('_', ' ')
      .toUpperCase();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: AttributionItem = payload[0].payload;
      return (
        <div className="bg-surface/90 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md text-[11px]">
          <p className="font-semibold text-text uppercase mb-1">{formatFeatureName(data.feature)}</p>
          <div className="space-y-1 text-muted">
            <p>Predictive Importance: <span className="text-text font-medium">{(data.importance * 100).toFixed(1)}%</span></p>
            <p>Design Value: <span className="text-text font-medium">{data.current_value}</span></p>
            <p>Dataset Average: <span className="text-text font-medium">{data.average_value.toFixed(1)}</span></p>
            <p>Impact: 
              <span className={`ml-1 font-semibold ${
                data.impact_direction === 'high_driver' 
                  ? 'text-danger' 
                  : data.impact_direction === 'lowering_factor' 
                    ? 'text-success' 
                    : 'text-muted'
              }`}>
                {data.impact_direction === 'high_driver' 
                  ? 'High Driver (Optimize)' 
                  : data.impact_direction === 'lowering_factor' 
                    ? 'Lowering Factor (Good)' 
                    : 'Neutral'}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 w-full">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-accent" />
        <div>
          <h3 className="text-base font-bold text-text">Explainable AI (XAI) PPA Drivers</h3>
          <p className="text-xs text-muted">Statistical feature importance and contribution analysis relative to pre-trained datasets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => {
          const list = attributions[metric.key as 'area' | 'power' | 'delay'] || [];
          
          // Re-map list for Recharts representation
          const chartData = list.map(item => ({
            ...item,
            formattedName: formatFeatureName(item.feature),
            percentage: item.importance * 100,
          }));

          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="bg-background/40 border border-white/5 rounded-xl p-4 flex flex-col"
            >
              <h4 className="text-xs font-bold text-text mb-4 border-l-2 pl-2" style={{ borderColor: metric.color }}>
                {metric.label}
              </h4>

              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted text-xs">
                  No statistical attributions found.
                </div>
              ) : (
                <>
                  <div className="h-44 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="formattedName" 
                          type="category" 
                          stroke="#94A3B8" 
                          tickLine={false}
                          axisLine={false}
                          width={75}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={12}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.impact_direction === 'high_driver'
                                  ? '#EF4444' // red
                                  : entry.impact_direction === 'lowering_factor'
                                    ? '#22C55E' // green
                                    : metric.color
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Drivers impact legend list */}
                  <div className="mt-3 space-y-2 border-t border-white/5 pt-3 text-[10px]">
                    {list.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-center bg-background/20 px-2 py-1.5 rounded-lg border border-white/5">
                        <span className="text-muted font-medium truncate max-w-[120px]">
                          {formatFeatureName(item.feature)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-text font-semibold">{item.current_value}</span>
                          <span className="text-muted/60">(Avg {item.average_value.toFixed(1)})</span>
                          {item.impact_direction === 'high_driver' && (
                            <span className="px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger font-semibold uppercase text-[8px]">
                              High Driver
                            </span>
                          )}
                          {item.impact_direction === 'lowering_factor' && (
                            <span className="px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-success font-semibold uppercase text-[8px]">
                              Lowering
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
