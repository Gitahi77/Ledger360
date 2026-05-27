export function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton-circle" />
      <div className="skeleton-lines">
        <div className="skeleton-line-1" />
        <div className="skeleton-line-2" />
      </div>
      <div className="skeleton-amount" />
    </div>
  );
}
