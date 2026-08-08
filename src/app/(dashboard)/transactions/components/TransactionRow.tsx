import * as React from "react"
import { cn } from "@/lib/ui/cn"
import { CurrencyDisplay } from "@/components/finance"
import { DynamicCategoryIcon } from "@/lib/icons"
import { Edit2, Trash2, Loader2 } from "lucide-react"

export interface TransactionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  tx: {
    id: string
    name: string
    note: string | null
    date: string
    baseMoney: { amountMinor: number; currency: string }
    type: string
    category?: { name: string; icon: string | null } | null
  }
  onEdit?: () => void
  onDelete?: () => void
  onSplit?: () => void
  isDeleting?: boolean
}

export function TransactionRow({ tx, onEdit, onDelete, onSplit, isDeleting, className, ...props }: TransactionRowProps) {
  const isIncome = tx.type === "income"
  const isTransfer = tx.type === "transfer"
  const tone = isIncome ? "positive" : isTransfer ? "neutral" : "negative"

  // Date formatting
  const dateObj = new Date(tx.date)
  const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const fullDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div 
      className={cn(
        "group relative grid grid-cols-[1fr_auto] md:grid-cols-[100px_180px_2fr_3fr_120px_auto] gap-3 md:gap-4 items-center p-4 hover:bg-secondary/40 transition-colors duration-200 border-b border-border/40 last:border-0 cursor-pointer",
        className
      )}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit?.(); } }}
      {...props}
    >
      {/* Mobile Layout (Visible < md) */}
      <div className="md:hidden flex flex-col min-w-0 pr-4">
        <div className="flex items-center gap-2 truncate">
          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", 
            isIncome ? "bg-success/10 text-success" : isTransfer ? "bg-secondary text-muted-foreground" : "bg-destructive/10 text-destructive"
          )}>
            <DynamicCategoryIcon category={tx.category?.name || "Other"} size={14} />
          </div>
          <span className="font-semibold text-sm truncate">{tx.name}</span>
        </div>
        {(tx.note || tx.category?.name) && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {tx.note ? tx.note : tx.category?.name}
          </div>
        )}
      </div>
      <div className="md:hidden flex flex-col items-end shrink-0">
        <CurrencyDisplay money={tx.baseMoney} tone={tone} className="font-semibold text-sm font-tabular-nums" />
        <span className="text-xs text-muted-foreground mt-1">{shortDate}</span>
      </div>

      {/* Desktop Layout (Visible >= md) */}
      <div className="hidden md:block text-sm text-muted-foreground whitespace-nowrap">
        {fullDate}
      </div>
      <div className="hidden md:flex items-center gap-2 min-w-0">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", 
          isIncome ? "bg-success/10 text-success" : isTransfer ? "bg-secondary text-muted-foreground" : "bg-destructive/10 text-destructive"
        )}>
          <DynamicCategoryIcon category={tx.category?.name || "Other"} size={14} />
        </div>
        <span className="text-sm truncate">{tx.category?.name || "Uncategorized"}</span>
      </div>
      <div className="hidden md:block font-medium text-sm truncate">
        {tx.name}
      </div>
      <div className="hidden md:block text-sm text-muted-foreground truncate">
        {tx.note || "-"}
      </div>
      <div className="hidden md:flex justify-end">
        <CurrencyDisplay money={tx.baseMoney} tone={tone} className="font-medium text-sm font-tabular-nums" />
      </div>
      {/* Row Actions (Desktop: hover-reveal) */}
      <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit Transaction"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
        )}
        {onSplit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSplit(); }}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Split Transaction"
            title="Split"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            className="p-1.5 ml-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            aria-label="Delete Transaction"
            title="Delete"
          >
            {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}
