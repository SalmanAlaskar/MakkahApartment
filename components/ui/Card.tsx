export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-dark bg-surface p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
