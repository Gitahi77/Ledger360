interface IntegrityWarningProps {
  message: string;
  onDismiss?: () => void;
}

export function IntegrityWarning({ message, onDismiss }: IntegrityWarningProps) {
  return (
    <div className="integrity-warning" role="alert">
      <span className="integrity-warning-dot" aria-hidden="true" />
      <p className="integrity-warning-message">{message}</p>
      {onDismiss && (
        <button className="integrity-warning-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
