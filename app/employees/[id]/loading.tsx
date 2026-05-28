export default function EmployeeDetailLoading() {
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
          <SkeletonBox className="h-5 w-32 mb-6" />

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-4 mb-6">
              <SkeletonBox className="w-16 h-16 rounded-full" />
              <div>
                <SkeletonBox className="h-6 w-48" />
                <SkeletonBox className="h-4 w-32 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <SkeletonBox className="h-3 w-20 mb-1" />
                  <SkeletonBox className="h-4 w-36" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
