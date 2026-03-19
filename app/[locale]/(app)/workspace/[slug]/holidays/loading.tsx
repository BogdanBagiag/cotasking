export default function HolidaysLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-36 bg-muted rounded" />
          <div className="h-4 w-52 bg-muted rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-muted rounded-lg" />
      </div>
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-5 w-14 bg-muted rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
