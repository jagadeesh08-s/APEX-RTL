import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Trash2, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import type { AnalysisReport } from '../types';

interface HistoryProps {
  history: AnalysisReport[];
  onSelectReport: (report: AnalysisReport) => void;
  onDeleteReport: (id: string) => void;
  isLoading: boolean;
}

export const History: React.FC<HistoryProps> = ({
  history,
  onSelectReport,
  onDeleteReport,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filtered = history.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(search.toLowerCase());
    
    if (filterSeverity === 'ALL') return matchesSearch;
    
    const dqs = item.analysis.design_quality_score;
    if (filterSeverity === 'CRITICAL') return matchesSearch && dqs < 50;
    if (filterSeverity === 'WARNING') return matchesSearch && dqs >= 50 && dqs < 75;
    if (filterSeverity === 'GOOD') return matchesSearch && dqs >= 75 && dqs < 90;
    if (filterSeverity === 'EXCELLENT') return matchesSearch && dqs >= 90;
    
    return matchesSearch;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'text-success bg-success/10 border-success/20';
    if (score >= 75) return 'text-secondary bg-secondary/10 border-secondary/20';
    if (score >= 50) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  return (
    <div className="glass-card rounded-2xl p-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-text">Analysis Run History</h3>
          <p className="text-xs text-muted">Retrieve, inspect, or clear past prediction logs.</p>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-background border border-white/10 rounded-xl text-xs text-text placeholder-muted focus:outline-none focus:border-primary w-52 transition-colors"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-background border border-white/10 rounded-xl text-xs text-text focus:outline-none focus:border-primary transition-colors"
          >
            <option value="ALL">All Scores</option>
            <option value="EXCELLENT">Excellent (90-100)</option>
            <option value="GOOD">Good (75-89)</option>
            <option value="WARNING">Warning (50-74)</option>
            <option value="CRITICAL">Critical (&lt; 50)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted">Loading history database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/5 rounded-xl bg-background/10">
          <FileText className="w-10 h-10 text-muted mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-semibold text-text mb-1">No Past Runs Found</h4>
          <p className="text-xs text-muted max-w-xs mx-auto">
            Upload and analyze a Verilog file to start populating the design library.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Design Name</th>
                <th className="py-3 px-4">Analyzed On</th>
                <th className="py-3 px-4 text-center">Quality Score</th>
                <th className="py-3 px-4">Predicted PPA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filtered.map((item, idx) => {
                const date = new Date(item.timestamp).toLocaleString();
                const dqs = item.analysis.design_quality_score;
                
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => onSelectReport(item)}
                  >
                    <td className="py-4 px-4 font-bold text-text group-hover:text-primary transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                        <span>{item.filename}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getScoreBadge(dqs)}`}>
                        {dqs.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px]">
                        <span>Area: <b className="text-text">{item.predictions.area.toFixed(0)}</b></span>
                        <span>Delay: <b className="text-text">{item.predictions.delay.toFixed(2)}ns</b></span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectReport(item)}
                          className="p-1.5 rounded-lg bg-surface border border-white/5 text-muted hover:text-text hover:border-white/10 transition-all"
                          title="Open Report"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(item.id)}
                          className="p-1.5 rounded-lg bg-surface border border-white/5 text-muted hover:text-danger hover:border-danger/20 transition-all"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
