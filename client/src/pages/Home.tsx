import React, { useState } from 'react';
import { NavBar } from '@/components/NavBar';
import { KpiTiles } from '@/components/KpiTiles';
import { MainCard } from '@/components/MainCard';
import { ResultRow } from '@/components/ResultRow';
import { useAnalysisSimulation } from '@/hooks/use-analysis-simulation';
import { ToolType } from '@shared/schema';
import { 
  FileText, 
  Search,
  Globe, 
  Download,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const TABS: { id: ToolType; label: string; icon: any }[] = [
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'verification', label: 'Verification', icon: Globe },
];

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolType>('document');
  const { 
    isAnalyzing, 
    results, 
    stats, 
    toastMessage, 
    runAnalysis, 
    updateDecision 
  } = useAnalysisSimulation();

  const handleExport = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      appName: "Reagvis Labs Pvt. Ltd.",
      activeTool: activeTool,
      summary: {
        total: stats.total,
        rejected: stats.rejected,
        manualReview: stats.manual,
        approved: stats.approved
      },
      results: results
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').split('Z')[0];
    const filename = `reagvis-labs-report-${timestamp}.json`;
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20 font-sans selection:bg-[var(--accent)] selection:text-white">
      <NavBar />
      
      <main className="max-w-[1280px] mx-auto px-6 pt-12">
        {/* Hero Section */}
        <div className="mb-12 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-[var(--text)] tracking-tight mb-4 leading-tight">
                Advanced Verification
              </h1>
              <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl leading-relaxed">
                Analyze digital assets using AI-driven forensics, semantic analysis, and metadata verification.
              </p>
            </div>
            
            <button 
              onClick={handleExport}
              disabled={results.length === 0}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hover-elevate active-elevate-2 h-11 px-6 text-sm font-semibold tracking-wide uppercase transition-all"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </motion.div>
        </div>

        {/* KPI Tiles */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mb-12"
        >
          <KpiTiles stats={stats} />
        </motion.div>

        {/* Tool Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-[var(--border)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTool === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTool(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative",
                  isActive 
                    ? "text-[var(--accent)] bg-[var(--panel2)]/50" 
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]/30"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[var(--accent)]" : "text-[var(--muted)]")} />
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--accent)]" 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Analysis Card */}
        <motion.div
           key={activeTool}
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.2 }}
        >
          <MainCard 
            activeTool={activeTool} 
            onAnalyze={(data) => runAnalysis({ ...data, toolType: activeTool })}
            isAnalyzing={isAnalyzing}
          />
        </motion.div>

        {/* Results Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-2">Recent Analysis</h2>
            <span className="text-sm text-[var(--muted)]">
              Showing {results.length} results
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {results.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl bg-[var(--panel2)]"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--border)] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[var(--muted)]" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text)] mb-1">No analysis yet</h3>
                  <p className="text-[var(--muted)]">Upload a file or paste text to begin verification.</p>
                </motion.div>
              ) : (
                results.map((result) => (
                  <ResultRow 
                    key={result.id} 
                    result={result}
                    onApprove={(id) => updateDecision(id, 'APPROVE')}
                    onReject={(id) => updateDecision(id, 'REJECT')}
                    onManualReview={(id) => updateDecision(id, 'MANUAL_REVIEW')}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Floating Processing Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 20 }}
            className="fixed bottom-8 right-8 z-[100] bg-[var(--panel)] border border-[var(--border)] shadow-[var(--shadow-strong)] rounded-[var(--radius)] p-5 flex items-center gap-4 min-w-[300px]"
          >
            {isAnalyzing ? (
               <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
            ) : (
               <div className="w-3 h-3 rounded-full bg-[var(--ok)] shadow-[0_0_12px_var(--ok)]" />
            )}
            <div className="flex flex-col">
              <span className="font-bold text-[var(--text)] text-sm tracking-tight">
                {isAnalyzing ? "Processing..." : "Action Complete"}
              </span>
              <span className="text-[var(--muted)] text-xs font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
