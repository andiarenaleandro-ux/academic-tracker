import { type ReactNode, useEffect, useRef } from "react";

export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-xl p-0 backdrop:bg-black/60 max-w-lg w-full"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="p-6">{children}</div>
    </dialog>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 text-lg font-semibold">{children}</div>;
}
