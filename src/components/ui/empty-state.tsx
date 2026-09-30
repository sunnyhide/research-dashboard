import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start px-6 py-16">
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-ink">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
