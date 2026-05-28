export default function DashboardLoading() {
  const SkeletonBox = ({ className }: { className?: string }) => (
    <div className={`rounded-lg bg-gray-200 skeleton-pulse ${className ?? ""}`} />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col w-[220px] h-screen flex-shrink-0 bg-[#1E3A8A]" />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
          <div className="w-8 lg:hidden" />
          <div className="hidden lg:block text-white/60 font-semibold text-base tracking-wide select-none">
            Management Portal
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-8 h-8 rounded-full" />
            <SkeletonBox className="w-8 h-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-5">
            <SkeletonBox className="h-7 w-52" />
            <SkeletonBox className="h-4 w-36 mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-8 w-16 mt-2" />
                <SkeletonBox className="h-3 w-28 mt-3" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <SkeletonBox className="h-5 w-44 mb-4" />
              <SkeletonBox className="h-52 w-full" />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <SkeletonBox className="h-5 w-32 mb-4" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <SkeletonBox className="h-3.5 w-32" />
                    <SkeletonBox className="h-3 w-24 mt-1.5" />
                  </div>
                  <SkeletonBox className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} className="h-10 w-36 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
