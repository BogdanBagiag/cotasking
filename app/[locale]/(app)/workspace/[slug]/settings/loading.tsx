export default function BoardLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      <div className="px-6 py-4 border-b border-border">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-6 w-40 bg-muted rounded mt-1" />
      </div>
      <div className="flex-1 px-6 py-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="w-[300px] shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-6 bg-muted rounded-full ml-auto" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: col === 1 ? 3 : col === 2 ? 2 : 1 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
