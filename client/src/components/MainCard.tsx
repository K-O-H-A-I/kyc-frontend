import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Film, Mic } from 'lucide-react';
import { ToolType } from '@shared/schema';

interface MainCardProps {
  activeTool: ToolType;
  onAnalyze: (data: { files: File[]; imageModels?: string[] }) => void;
  isAnalyzing: boolean;
}

export function MainCard({ activeTool, onAnalyze, isAnalyzing }: MainCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageDeepfake, setImageDeepfake] = useState(true);
  const [imageFaceMatch, setImageFaceMatch] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    const imageModels = [];
    if (activeTool === 'image') {
      if (imageDeepfake) imageModels.push('image-deepfake');
      if (imageFaceMatch) imageModels.push('image-facematch');
    }
    onAnalyze({ files, imageModels: imageModels.length ? imageModels : undefined });
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const acceptByTool = () => {
    switch (activeTool) {
      case 'image':
      case 'document':
        return "image/*";
      case 'video':
        return "video/*";
      case 'audio':
        return "audio/*";
    }
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
            accept={acceptByTool()}
            multiple={activeTool === 'image' || activeTool === 'video' || activeTool === 'audio'}
          />
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[var(--text)]">Drop file or click</span>
            <span className="text-[10px] text-[var(--muted)] ml-2">
              {activeTool === 'video'
                ? "Video files"
                : activeTool === 'audio'
                  ? "Audio files"
                  : "Image files"}
            </span>
          </div>
          <button className="btn btn-secondary hover-elevate active-elevate-2 px-3 py-1 text-[10px] shrink-0">
            {isAnalyzing ? "Processing" : "Select"}
          </button>
        </div>

        {activeTool === 'image' && (
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
              Image Models
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={imageDeepfake}
                onChange={(e) => setImageDeepfake(e.target.checked)}
              />
              Image deepfake
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={imageFaceMatch}
                onChange={(e) => setImageFaceMatch(e.target.checked)}
              />
              Face match (requires target, input, swapped)
            </label>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="text-xs text-[var(--muted)]">
            Selected: {selectedFiles.map((file) => file.name).join(", ")}
          </div>
        )}
      </div>
    );
  };

  const getToolInfo = () => {
    switch (activeTool) {
      case 'document': return { title: "Document Forensics", icon: FileText, desc: "Analyze documents for digital alteration and manipulation." };
      case 'image': return { title: "Image Deepfake Detection", icon: ImageIcon, desc: "Analyze images for AI manipulation and identity mismatch." };
      case 'video': return { title: "Video Liveness Check", icon: Film, desc: "Verify video authenticity and liveness signals." };
      case 'audio': return { title: "Audio Authenticity", icon: Mic, desc: "Detect synthetic or altered audio samples." };
    }
    return { title: "Verification", icon: FileText, desc: "Analyze uploaded files." };
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
