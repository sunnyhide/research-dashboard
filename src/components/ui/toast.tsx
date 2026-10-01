"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspace";

export function Toaster() {
  const toasts = useWorkspaceStore((state) => state.toasts);
  const dismiss = useWorkspaceStore((state) => state.dismissToast);
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-[min(420px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            layout
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            onClick={() => dismiss(toast.id)}
            className="pointer-events-auto rounded-md border border-line bg-ink px-3 py-2 text-left text-[13px] text-bg shadow-card"
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
