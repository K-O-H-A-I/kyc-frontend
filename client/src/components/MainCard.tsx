import React, { useRef, useState } from 'react';
import { UploadCloud, Search, AlertOctagon, FileText, Globe } from 'lucide-react';
import { ToolType } from '@shared/schema';

interface MainCardProps {
  activeTool: ToolType;
  onAnalyze: (data: { filename?: string; content?: string; file?: File; claimedLocation?: string; claimedEvent?: string }) => void;
  isAnalyzing: boolean;
}

export function MainCard({ activeTool, onAnalyze, isAnalyzing }: MainCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState("");
  const [claimedLocation, setClaimedLocation] = useState("");
  const [claimedEvent, setClaimedEvent] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAnalyze({ 
        filename: file.name, 
        file,
        ...(activeTool === 'verification' && { claimedLocation, claimedEvent })
      });
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleTextAnalyze = () => {
    if (!textInput.trim()) return;
    onAnalyze({ content: textInput, filename: "text_snippet.txt" });
    setTextInput("");
  };

  // Render content based on tool type
  const renderContent = () => {
    return (
      <div className="space-y-4">
        <div 
          className="file-drop-area compact group bg-[var(--panel)] border-border hover:bg-[var(--panel2)]/50 hover:border-[var(--accent)] transition-all duration-300 shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)]"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
          />
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[var(--text)]">Drop file or click</span>
            <span className="text-[10px] text-[var(--muted)] ml-2">PDF, JPG, PNG</span>
          </div>
          <button className="btn btn-secondary hover-elevate active-elevate-2 px-3 py-1 text-[10px] shrink-0">
            Select
          </button>
        </div>

        {activeTool === 'verification' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[var(--panel)] rounded-[var(--radius)] border border-[var(--border)]">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-2 uppercase tracking-wide">
                Claimed Location
              </label>
              <input
                type="text"
                value={claimedLocation}
                onChange={(e) => setClaimedLocation(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g., India, New Delhi"
                className="w-full px-3 py-2.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
                data-testid="input-claimed-location"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-2 uppercase tracking-wide">
                Claimed Event <span className="text-[var(--muted)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={claimedEvent}
                onChange={(e) => setClaimedEvent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g., earthquake, flood, protest"
                className="w-full px-3 py-2.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
                data-testid="input-claimed-event"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const getToolInfo = () => {
    switch (activeTool) {
      case 'document': return { title: "Document Forensics", icon: FileText, desc: "Analyze documents for digital alteration and manipulation." };
      case 'fact-check': return { title: "Automated Fact Check", icon: Search, desc: "Verify claims against a database of trusted sources." };
      case 'propaganda': return { title: "Propaganda Detection", icon: AlertOctagon, desc: "Identify persuasive techniques and bias in text." };
      case 'verification': return { title: "Verification Suite", icon: Globe, desc: "Combined metadata extraction and geolocation analysis." };
    }
  };

  const info = getToolInfo();
  const Icon = info.icon;

  return (
    <div className="card p-1 md:p-2 mb-8">
      <div className="bg-[var(--panel2)]/50 rounded-lg p-6 md:p-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-[var(--accent)]/10 rounded-xl">
            <Icon className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-1">{info.title}</h2>
            <p className="text-[var(--muted)]">{info.desc}</p>
          </div>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
}
