export default function LaporanLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-4 bg-gray-100 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="h-7 w-52 bg-gray-200 rounded-lg mb-1" />
        <div className="h-4 w-32 bg-gray-100 rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Filter skeleton */}
      <div className="flex gap-2">
        <div className="h-5 w-5 bg-gray-200 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 w-20 bg-gray-100 rounded-lg" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50 last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-lg" />
            <div className="h-4 w-12 bg-blue-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
