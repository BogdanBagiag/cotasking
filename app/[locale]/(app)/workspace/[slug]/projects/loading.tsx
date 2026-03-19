export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="h-5 w-20 bg-muted rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-lg" />
          </div>
        ))}
        <div className="h-9 w-24 bg-muted rounded-lg mt-4" />
      </div>
    </div>
  )
}
