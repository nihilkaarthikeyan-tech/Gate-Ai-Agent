import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

const PhotoSolver: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setSolution(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64 = image.split(',')[1];
      const res = await api.post('/advanced/photo-solver', { imageBase64: base64 });
      setSolution(res.data.solution);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to solve photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 font-heading">
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 shadow-lg">
              <Camera className="text-violet-400" size={32} />
            </div>
            Photo <span className="premium-text-gradient">Solver</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Upload a picture of any GATE problem and receive a step-by-step AI solution.</p>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-10 border-white/[0.05]">
        {!image ? (
          <div 
            className="border-2 border-dashed border-slate-800 rounded-3xl p-16 text-center hover:border-violet-500/50 hover:bg-violet-500/[0.02] transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-violet-400" />
            </div>
            <p className="text-xl font-bold text-slate-300">Drop your problem here</p>
            <p className="text-slate-500 font-medium mt-2">or click to browse from files</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-6">Supported: JPEG, PNG • Max 5MB</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative group">
              <img src={image} alt="Uploaded problem" className="w-full max-h-[500px] object-contain rounded-3xl bg-slate-950 border border-white/5 shadow-2xl" />
              <button 
                onClick={() => { setImage(null); setSolution(null); }}
                className="absolute top-4 right-4 p-3 bg-red-500/80 hover:bg-red-500 rounded-2xl text-white transition-all shadow-xl backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>
            
            <button 
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-5 premium-gradient rounded-2xl font-black text-white shadow-xl glow-primary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3 tracking-wider text-lg"
            >
              {loading ? <><Loader2 className="animate-spin" size={24} /> ANALYZING IMAGE CORE...</> : <><Sparkles size={24} /> SOLVE PROBLEM NOW</>}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={24} />
          <p className="font-bold">{error}</p>
        </div>
      )}

      {solution && (
        <div className="glass-card rounded-[2.5rem] p-10 space-y-6 border-white/[0.05] animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-400" size={18} />
            </div>
            <h2 className="text-2xl font-black text-white font-heading tracking-tight">Solution Strategy</h2>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-medium whitespace-pre-wrap text-lg">
            {solution}
          </div>
        </div>
      )}
    </div>

  );
};

export default PhotoSolver;
