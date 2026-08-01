import { LedgerAmount } from './LedgerAmount';
import { Trash2, Loader2, Edit2, Clock } from 'lucide-react';
import { ReactNode } from 'react';

interface TransactionRowProps {
  title: string;
  subtitle: string;
  amountMinor: number;
  /** Transaction type — drives colour: 'income'/'savings' = green, 'expense' = red */
  type?: string;
  state?: "pending" | "reconciled" | "flagged";
  icon?: ReactNode;
  onClick?: () => void;
  onEdit?: () => void;
  onSplit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function TransactionRow({
  title,
  subtitle,
  amountMinor,
  type,
  state,
  icon,
  onClick,
  onEdit,
  onSplit,
  onDelete,
  isDeleting,
}: TransactionRowProps) {
  const isPending = state === 'pending';

  return (
    <div
      className={`group flex items-center justify-between p-4 bg-card hover:bg-[var(--surface-sunken)] transition-all duration-300 cursor-pointer relative overflow-hidden`}
      onClick={onClick}
    >
      {isPending && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-warning/80" />}

      <div className="flex items-center gap-4 flex-1 min-w-0 z-10 pl-1">
        {icon && (
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            {icon}
          </div>
        )}
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[0.9rem] font-bold text-foreground truncate">{title}</p>
            {isPending && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/10 text-warning text-[0.65rem] font-bold uppercase tracking-wider">
                <Clock size={10} /> Pending
              </span>
            )}
          </div>
          <p className="text-[0.75rem] text-muted-foreground truncate mt-0.5 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0 ml-4 z-10">
        <div className="transition-transform duration-300 group-hover:-translate-x-1">
          <LedgerAmount amountMinor={amountMinor} type={type} />
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
              aria-label="Edit Transaction"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onSplit && (
            <button
              onClick={(e) => { e.stopPropagation(); onSplit(); }}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
              aria-label="Split Transaction"
              title="Split"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={isDeleting}
              className="p-1.5 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50"
              aria-label="Delete Transaction"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
