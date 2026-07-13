export default function ClientLoading() {
  return (
    <div className="grid gap-5">
      <div className="h-7 w-44 animate-pulse rounded-md bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg border border-border bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-lg border border-border bg-white" />
    </div>
  );
}
