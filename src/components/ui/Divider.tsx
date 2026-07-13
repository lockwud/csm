export function Divider({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase text-text-muted">
      <span className="h-px flex-1 bg-border" />
      {text}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
