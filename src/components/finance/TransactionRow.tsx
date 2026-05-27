import { LedgerAmount } from './LedgerAmount';
import { Trash2, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface TransactionRowProps {
  title: string;
  subtitle: string;
  amount: number;
  state?: "pending" | "reconciled" | "flagged";
  icon?: ReactNode;
  onClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  state,
  icon,
  onClick,
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

      <div className="transaction-row-actions">
        <LedgerAmount amount={amount} />
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="transaction-row-delete"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
