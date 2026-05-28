export default function ApplicantsLoading() {
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
          <div className="mb-6">
            <SkeletonBox className="h-7 w-44" />
            <SkeletonBox className="h-4 w-32 mt-1" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-9 flex-1 max-w-md rounded-lg" />
                <SkeletonBox className="h-9 w-24 rounded-lg" />
              </div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100">
                <SkeletonBox className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <SkeletonBox className="h-3.5 w-28" />
                  <SkeletonBox className="h-3.5 w-32" />
                  <SkeletonBox className="h-3.5 w-20" />
                  <SkeletonBox className="h-3.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
