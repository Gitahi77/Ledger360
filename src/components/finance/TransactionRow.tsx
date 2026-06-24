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
      data-ledger-state={state}
      className="transaction-row pressable"
      onClick={onClick}
    >
      <div className="transaction-row-icon">
        {icon}
      </div>

      <div className="transaction-row-content">
        <p className="transaction-row-title">{title}</p>
        <p className="transaction-row-subtitle">{subtitle}</p>
      </div>

      <div className="transaction-row-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LedgerAmount amountMinor={amountMinor} type={type} />
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="transaction-row-edit"
            aria-label="Edit Transaction"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Edit2 size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="transaction-row-delete"
            aria-label="Delete Transaction"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
