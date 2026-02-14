import React from 'react';
import { AnalysisResult } from '@shared/schema';
import { 
  AlertCircle, 
  Check, 
  X, 
  File, 
  Globe, 
  MapPin, 
  Search,
  ChevronRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultRowProps {
  result: AnalysisResult;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onManualReview: (id: number) => void;
}

export function ResultRow({ result, onApprove, onReject, onManualReview }: ResultRowProps) {
  const [expanded, setExpanded] = React.useState(false);
  
  // Risk level: LOW (<40), MEDIUM (40-69), CRITICAL (>=70)
  const riskLevel = result.riskScore >= 70 ? 'CRITICAL' : result.riskScore >= 40 ? 'MEDIUM' : 'LOW';
  const isMediumRisk = riskLevel === 'MEDIUM';

  const hasPreview = !!result.previewUrl;

  const getIcon = () => {
    if (result.previewUrl) {
      return (
        <img 
          src={result.previewUrl} 
          alt="File preview" 
          className="w-24 h-24 object-cover rounded-[var(--radius)] border border-[var(--border)] shadow-[var(--shadow)]"
        />
      );
    }
    switch (result.toolType) {
      case 'document': return <File className="w-5 h-5 text-[var(--accent)]" />;
      case 'fact-check': return <Search className="w-5 h-5 text-[var(--accent-3)]" />;
      case 'propaganda': return <ShieldAlert className="w-5 h-5 text-[var(--danger)]" />;
      case 'verification': return <Globe className="w-5 h-5 text-[var(--grad-orange-start)]" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20";
    if (score >= 50) return "text-[var(--grad-orange-start)] bg-[var(--grad-orange-start)]/10 border-[var(--grad-orange-start)]/20";
    return "text-[var(--ok)] bg-[var(--ok)]/10 border-[var(--ok)]/20";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] mb-4 overflow-hidden transition-all duration-200"
    >
      {/* Header Row */}
      <div 
        className="p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-[var(--panel2)]/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("flex items-center flex-1 w-full", hasPreview ? "gap-4" : "gap-3")}>
          <div className={cn(
            "shrink-0 flex items-center justify-center",
            !hasPreview && "p-2.5 bg-[var(--panel2)] rounded-lg border border-[var(--border)]"
          )}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                result.priority === "CRITICAL" ? "bg-[var(--danger)]/20 text-[var(--danger)]" :
                result.priority === "MEDIUM" ? "bg-[var(--grad-orange-start)]/20 text-[var(--grad-orange-start)]" :
                "bg-[var(--ok)]/20 text-[var(--ok)]"
              )}>
                {result.priority}
              </span>
              <span className="text-xs text-[var(--muted)] truncate max-w-[200px]">
                {result.filename}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold">
                {result.toolType}
              </span>
              <span className="text-xs text-[var(--muted)]">•</span>
              <span className="text-xs text-[var(--muted)]">
                {new Date(result.timestamp || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border",
            getRiskColor(result.riskScore)
          )}>
            RISK SCORE: {result.riskScore}%
          </div>

          <div className="flex items-center gap-3">
             <div className={cn(
               "px-3 py-1 rounded-md text-xs font-bold uppercase",
               result.decision === "APPROVE" && "text-[var(--ok)]",
               result.decision === "REJECT" && "text-[var(--danger)]",
               result.decision === "MANUAL_REVIEW" && "text-[var(--grad-orange-start)]",
             )}>
               {result.decision.replace('_', ' ')}
             </div>
             <ChevronRight className={cn(
               "w-5 h-5 text-[var(--muted)] transition-transform duration-200",
               expanded && "rotate-90"
             )} />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] bg-[var(--panel2)]/30"
          >
            <div className="p-4 grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {result.toolType === 'verification' && result.metadata && (
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[var(--accent)]" />
                      Section A: Metadata Analysis
                    </h5>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        result.metadata.decision === "APPROVE" ? "bg-[var(--ok)]/10 text-[var(--ok)]" :
                        result.metadata.decision === "REJECT" ? "bg-[var(--danger)]/10 text-[var(--danger)]" :
                        "bg-[var(--grad-orange-start)]/10 text-[var(--grad-orange-start)]"
                      )}>
                        {result.metadata.decision}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {result.metadata.evidence.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--muted)]/30 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.toolType === 'verification' && result.verification && (
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--accent)]" />
                      Claim vs Location Check
                    </h5>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[var(--muted)]">Claimed Location:</span>
                          <p className="text-[var(--text)] font-medium">
                            {result.verification.claimedLocation || <span className="italic text-[var(--muted)]">Not provided</span>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">Predicted Location:</span>
                          <p className="text-[var(--text)] font-medium">
                            {result.verification.predictedLocation} ({(result.verification.confidence * 100).toFixed(0)}%)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[var(--muted)]">Claimed Event:</span>
                          <p className="text-[var(--text)] font-medium">
                            {result.verification.claimedEvent || <span className="italic text-[var(--muted)]">Not provided</span>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">Predicted Event:</span>
                          <p className="text-[var(--text)] font-medium">
                            {result.verification.predictedEvent}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide",
                          result.verification.matchStatus === "match" ? "bg-[var(--ok)]/15 text-[var(--ok)]" :
                          result.verification.matchStatus === "mismatch" ? "bg-[var(--danger)]/15 text-[var(--danger)]" :
                          "bg-[var(--grad-orange-start)]/15 text-[var(--grad-orange-start)]"
                        )}>
                          {result.verification.matchStatus === "match" ? "MATCH" :
                           result.verification.matchStatus === "mismatch" ? "MISMATCH" : "INSUFFICIENT DATA"}
                        </span>
                      </div>
                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2">Why</h6>
                        <ul className="space-y-1">
                          {result.verification.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--muted)]/30 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {result.toolType === 'verification' && result.geolocation && !result.verification && (
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--accent)]" />
                      Section B: Geolocation Verification
                    </h5>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        result.geolocation.decision === "APPROVE" ? "bg-[var(--ok)]/10 text-[var(--ok)]" :
                        result.geolocation.decision === "REJECT" ? "bg-[var(--danger)]/10 text-[var(--danger)]" :
                        "bg-[var(--grad-orange-start)]/10 text-[var(--grad-orange-start)]"
                      )}>
                        {result.geolocation.decision}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {result.geolocation.evidence.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--muted)]/30 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.toolType === 'fact-check' && result.factCheck && (
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <CheckCircle2 className={cn(
                        "w-4 h-4",
                        result.factCheck.verdict === 'verified' ? "text-[var(--ok)]" :
                        result.factCheck.verdict === 'needs_review' ? "text-[var(--grad-orange-start)]" : "text-[var(--muted)]"
                      )} />
                      {result.factCheck.displayTitle || "Fact Check Result"}
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide",
                          result.factCheck.verdict === 'verified' ? "bg-[var(--ok)]/15 text-[var(--ok)]" :
                          result.factCheck.verdict === 'needs_review' ? "bg-[var(--grad-orange-start)]/15 text-[var(--grad-orange-start)]" :
                          "bg-[var(--muted)]/15 text-[var(--muted)]"
                        )}>
                          {result.factCheck.verdict === 'verified' ? 'VERIFIED FACT' : 
                           result.factCheck.verdict === 'needs_review' ? 'NEEDS REVIEW' : result.factCheck.verdict}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          Confidence: {(result.factCheck.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      {result.factCheck.title && !result.factCheck.displayTitle && (
                        <p className="text-sm font-medium text-[var(--text)]">
                          {result.factCheck.title}
                        </p>
                      )}
                      {result.factCheck.publisher && (
                        <p className="text-xs text-[var(--muted)]">
                          Publisher: <span className="text-[var(--accent)]">{result.factCheck.publisher}</span>
                        </p>
                      )}
                    </div>

                    {/* Extended fact check: Extracted Entities */}
                    {result.factCheck.extractedEntities && result.factCheck.extractedEntities.length > 0 && (
                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2 uppercase tracking-wide">Extracted Entities</h6>
                        <div className="flex flex-wrap gap-1.5">
                          {result.factCheck.extractedEntities.map((entity, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 rounded bg-[var(--panel2)] text-[var(--muted)] border border-[var(--border)]">
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extended fact check: Key Claims */}
                    {result.factCheck.keyClaims && result.factCheck.keyClaims.length > 0 && (
                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2 uppercase tracking-wide">Key Claims</h6>
                        <ul className="space-y-2">
                          {result.factCheck.keyClaims.map((claim, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                              <span className="mt-0.5 text-[var(--accent)] font-bold shrink-0">{idx + 1}.</span>
                              {claim}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extended fact check: Evidence Cards */}
                    {result.factCheck.evidenceCards && result.factCheck.evidenceCards.length > 0 && (
                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2 uppercase tracking-wide">Evidence</h6>
                        <ul className="space-y-1.5">
                          {result.factCheck.evidenceCards.map((card, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]/50 shrink-0" />
                              {card}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extended fact check: Why Manual Review */}
                    {result.factCheck.whyManualReview && result.factCheck.whyManualReview.length > 0 && (
                      <div className="p-3 rounded bg-[var(--grad-orange-start)]/10 border border-[var(--grad-orange-start)]/20">
                        <h6 className="text-xs font-semibold text-[var(--grad-orange-start)] mb-2 uppercase tracking-wide">Why Manual Review</h6>
                        <ul className="space-y-1">
                          {result.factCheck.whyManualReview.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--grad-orange-start)]/50 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Verdict status */}
                    {result.factCheck.verdictStatus && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                        <span className="text-xs font-medium text-[var(--text)]">Verdict:</span>
                        <span className="text-xs text-[var(--muted)]">{result.factCheck.verdictStatus}</span>
                      </div>
                    )}

                    {/* Simple evidence list (for simple fact checks like Sensex) */}
                    {!result.factCheck.keyClaims && result.evidence.length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {result.evidence.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--muted)]/30 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {result.toolType === 'propaganda' && result.propaganda && (
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[var(--danger)]" />
                      Propaganda Assessment
                    </h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-[var(--danger)]/15 text-[var(--danger)] uppercase tracking-wide">
                          HIGH PROPAGANDA LIKELIHOOD
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          Score: {result.propaganda.score}%
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          Risk: {result.propaganda.riskLevel}
                        </span>
                      </div>

                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2">Indicators Found</h6>
                        <div className="flex flex-wrap gap-2">
                          {result.propaganda.indicatorsFound.map((indicator, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] px-2 py-1 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20"
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-xs font-semibold text-[var(--text)] mb-2">Evidence Excerpts</h6>
                        <ul className="space-y-1.5">
                          {result.propaganda.evidenceExcerpts.map((excerpt, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--danger)]/40 shrink-0" />
                              {excerpt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {!result.metadata && !result.factCheck && !result.propaganda && (
                  <div>
                    <h5 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[var(--accent)]" />
                      Evidence Found
                    </h5>
                    <ul className="space-y-2">
                      {result.evidence.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--muted)]/30 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div>
                   <h5 className="text-sm font-semibold text-[var(--text)] mb-2">Action Required</h5>
                   <p className="text-sm text-[var(--muted)] mb-4 italic">
                     {result.decision === "MANUAL_REVIEW" ? "Analyst verification needed" : "No immediate action required"}
                   </p>
                </div>

                <div className="flex gap-3">
                  {riskLevel === 'LOW' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(result.id); }}
                        className="flex-1 btn h-11 bg-[var(--ok)]/15 border-[var(--ok)]/30 text-[var(--ok)] hover:bg-[var(--ok)]/25 font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-approve"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReject(result.id); }}
                        className="flex-1 btn btn-secondary h-11 border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-reject"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {riskLevel === 'CRITICAL' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReject(result.id); }}
                        className="flex-1 btn h-11 bg-[var(--danger)]/15 border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/25 font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-reject"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(result.id); }}
                        className="flex-1 btn btn-secondary h-11 border-[var(--ok)]/30 hover:bg-[var(--ok)]/10 hover:text-[var(--ok)] font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-approve"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    </>
                  )}
                  {isMediumRisk && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onManualReview(result.id); }}
                        className="flex-1 btn h-11 bg-[var(--grad-orange-start)]/15 border-[var(--grad-orange-start)]/30 text-[var(--grad-orange-start)] hover:bg-[var(--grad-orange-start)]/25 font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-manual-review"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Manual Review
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onApprove(result.id); }}
                        className="flex-1 btn btn-secondary h-11 border-[var(--ok)]/30 hover:bg-[var(--ok)]/10 hover:text-[var(--ok)] font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-approve"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReject(result.id); }}
                        className="flex-1 btn btn-secondary h-11 border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] font-bold tracking-wide uppercase active:scale-[0.98] transition-all duration-150"
                        data-testid="button-reject"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
