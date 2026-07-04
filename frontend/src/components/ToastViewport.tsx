import { useEffect, useState } from "react";
import { subscribeToasts, ToastItem } from "../lib/toast";

export default function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "success" ? "bg-teal text-sand" : "bg-clay text-sand"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
