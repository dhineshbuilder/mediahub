'use client';

export function LoadingSkeleton() {
  return (
    <div className="glass-card w-full max-w-4xl mx-auto rounded-2xl p-6 md:p-8 mt-12 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Col - Thumbnail Skeleton */}
        <div className="w-full md:w-2/5 aspect-video rounded-xl bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 shadow-md flex-shrink-0" />

        {/* Right Col - Metadata Skeleton */}
        <div className="flex-1 flex flex-col justify-between py-1 gap-6">
          <div className="flex flex-col gap-3">
            {/* Badge Skeleton */}
            <div className="w-24 h-6 rounded-full bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />
            
            {/* Title Skeleton */}
            <div className="w-full h-8 rounded-lg bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />
            <div className="w-3/4 h-8 rounded-lg bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />

            {/* Author / Duration Skeleton */}
            <div className="flex gap-4 mt-2">
              <div className="w-28 h-5 rounded-md bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />
              <div className="w-20 h-5 rounded-md bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Selector Skeleton */}
            <div className="w-full h-12 rounded-xl bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200" />
            
            {/* Button Skeleton */}
            <div className="w-full h-12 rounded-xl bg-zinc-850 dark:bg-zinc-800 light:bg-zinc-250 bg-gradient-to-r from-zinc-800 to-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoadingSkeleton;
