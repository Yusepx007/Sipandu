export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-white">
            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
            <div className="h-7 w-14 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
              <div className="flex-1 h-4 bg-gray-100 rounded" />
              <div className="w-16 h-5 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
