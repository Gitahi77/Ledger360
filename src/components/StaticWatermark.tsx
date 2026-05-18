export function StaticWatermark() {
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.08,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='60' viewBox='0 0 40 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%2300A859' stroke-width='1.5' fill='none' stroke-opacity='1'%3E%3Crect x='2' y='2' width='36' height='20' rx='2'/%3E%3Ccircle cx='20' cy='12' r='5'/%3E%3Cpath d='M6 6h4v4H6zm24 0h4v4h-4zM6 14h4v4H6zm24 0h4v4h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '160px 80px',
      }}
    />
  );
}
