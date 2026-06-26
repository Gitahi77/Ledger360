import { LedgerAmount } from './LedgerAmount';
import { Trash2, Loader2, Edit2 } from 'lucide-react';
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
  onDelete,
  isDeleting,
}: TransactionRowProps) {
  return (
    <div
      className={`group flex items-center justify-between p-4 bg-card hover:bg-secondary/50 transition-colors cursor-pointer border-l-2 ${state === 'pending' ? 'border-warning/50' : 'border-transparent'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {icon && (
          <div className="shrink-0">
            {icon}
          </div>
        )}
        
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-4">
        <LedgerAmount amountMinor={amountMinor} type={type} />
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              aria-label="Edit Transaction"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={isDeleting}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
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
