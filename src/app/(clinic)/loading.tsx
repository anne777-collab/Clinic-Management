export default function ClinicLoading() {
  return <div className="animate-pulse space-y-6"><div className="h-8 w-56 rounded-lg bg-slate-200"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-32 rounded-2xl bg-white"/>)}</div><div className="h-72 rounded-2xl bg-white"/></div>;
}
