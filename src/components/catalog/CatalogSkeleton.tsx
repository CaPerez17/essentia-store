interface CatalogSkeletonProps {
  count?: number;
  columns?: 3 | 4;
}

export function CatalogSkeleton({ count = 12, columns = 3 }: CatalogSkeletonProps) {
  const gridCols = columns === 4 ? "sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className={`grid grid-cols-2 gap-4 sm:gap-6 ${gridCols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-[#E5E5E5]">
          <div className="aspect-[3/4] skeleton" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 skeleton" />
            <div className="h-4 w-4/5 skeleton" />
            <div className="h-3 w-1/2 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
