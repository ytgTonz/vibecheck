import type { ReactNode } from "react";

interface AdminPageToolbarProps {
  title: string;
  description?: string;
  searchSlot?: ReactNode;
  secondaryAction?: ReactNode;
  primaryAction?: ReactNode;
  meta?: ReactNode;
}

export function AdminPageToolbar({
  title,
  description,
  searchSlot,
  secondaryAction,
  primaryAction,
  meta,
}: AdminPageToolbarProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
        {(secondaryAction || primaryAction) && (
          <div className="flex flex-wrap items-center gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>

      {(searchSlot || meta) && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchSlot && <div className="min-w-0 flex-1">{searchSlot}</div>}
          {meta && <div className="text-sm text-zinc-500">{meta}</div>}
        </div>
      )}
    </section>
  );
}
