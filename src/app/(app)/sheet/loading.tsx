export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-7 rounded-2xl p-7">
        <div className="skeleton h-[116px] w-[116px] shrink-0 rounded-full" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-9 w-44 rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="skeleton h-6 rounded-md" />
            <div className="skeleton h-6 rounded-md" />
            <div className="skeleton h-6 rounded-md" />
          </div>
        </div>
      </div>

      <div className="skeleton h-11 rounded-lg" />

      {[0, 1].map((i) => (
        <div key={i} className="glass space-y-2 rounded-2xl p-3">
          <div className="skeleton mb-3 h-8 rounded-lg" />
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="skeleton h-11 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
