import React from 'react';
import { Narrative } from '@/lib/os/contracts';
import { Info, AlertTriangle, Sparkles } from 'lucide-react';

interface AdvisorNoteProps {
  narrative: Narrative | null;
}

export function AdvisorNote({ narrative }: AdvisorNoteProps) {
  if (!narrative) return null;

  const toneConfig = {
    calm: {
      icon: <Info className="w-5 h-5 text-[var(--color-calm-blue)]" />,
      bg: 'bg-[var(--color-calm-blue)]/10',
      border: 'border-[var(--color-calm-blue)]/20',
      text: 'text-[var(--color-calm-blue)]'
    },
    celebration: {
      icon: <Sparkles className="w-5 h-5 text-[var(--color-finance-positive)]" />,
      bg: 'bg-[var(--color-finance-positive)]/10',
      border: 'border-[var(--color-finance-positive)]/20',
      text: 'text-foreground'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-alert-terracotta)]" />,
      bg: 'bg-[var(--color-alert-terracotta)]/10',
      border: 'border-[var(--color-alert-terracotta)]/20',
      text: 'text-foreground'
    },
    neutral: {
      icon: <Info className="w-5 h-5 text-muted-foreground" />,
      bg: 'bg-secondary',
      border: 'border-border',
      text: 'text-foreground'
    }
  };

  const config = toneConfig[narrative.tone] || toneConfig.neutral;

  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${config.bg} ${config.border}`}>
      <div className="shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div>
        <p className={`text-[15px] leading-relaxed font-medium ${config.text}`}>
          {narrative.text}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium opacity-80">
          Why? {narrative.reason}
        </p>
      </div>
    </div>
  );
}
