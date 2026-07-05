import { useState } from 'react';
import { Settings as SettingsIcon, Database, Check } from 'lucide-react';

interface SettingsProps {
  apiEndpoint: string;
  onApiEndpointChange: (endpoint: string) => void;
  modelVersion: string;
  onModelVersionChange: (version: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  apiEndpoint,
  onApiEndpointChange,
  modelVersion,
  onModelVersionChange,
}) => {
  const [endpointInput, setEndpointInput] = useState(apiEndpoint);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onApiEndpointChange(endpointInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
        <SettingsIcon className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-base font-bold text-text">APEX Settings & Preferences</h3>
          <p className="text-xs text-muted">Configure connection parameters and design-space evaluation targets.</p>
        </div>
      </div>

      <div className="space-y-5 text-xs">
        
        {/* API Connection */}
        <div className="space-y-2">
          <label className="block font-bold text-text uppercase tracking-wider text-[10px]">API Server Endpoint</label>
          <p className="text-[10px] text-muted">Endpoint of the Python FastAPI server wrapper running local PPA predictions.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              className="flex-1 px-4 py-2 bg-background border border-white/10 rounded-xl text-text font-mono focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-primary text-text font-bold hover:bg-primary/80 transition-all flex items-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Connection'
              )}
            </button>
          </div>
        </div>

        {/* Model Version */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <label className="block font-bold text-text uppercase tracking-wider text-[10px]">Active ML Regressor Version</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'v1.0.0-gb', name: 'APEX Ensemble (v1.0.0)', desc: 'Gradient Boosting models with highest accuracy.' },
              { id: 'v0.9.0-rf', name: 'Random Forest (v0.9.0)', desc: 'Older RF models with faster fitting time.' },
            ].map(m => (
              <div
                key={m.id}
                onClick={() => onModelVersionChange(m.id)}
                className={`p-3 rounded-xl border cursor-pointer bg-background/40 hover:bg-white/[0.02] transition-all flex items-start gap-2.5 ${
                  modelVersion === m.id
                    ? 'border-primary shadow-glow'
                    : 'border-white/5'
                }`}
              >
                <Database className={`w-4 h-4 mt-0.5 ${modelVersion === m.id ? 'text-primary' : 'text-muted'}`} />
                <div>
                  <h4 className="font-bold text-text">{m.name}</h4>
                  <p className="text-[10px] text-muted">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status indicator info */}
        <div className="bg-background/40 border border-white/5 p-4 rounded-xl flex items-start gap-3 mt-4 text-[11px] text-muted">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-text">Local Model Inference Integrity</h4>
            <p>
              APEX-RTL runs predictions client-side using stored coefficient templates if the API server is unavailable. Connecting the API server enables complete feature mapping directly to your Python compiler.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const ShieldCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
