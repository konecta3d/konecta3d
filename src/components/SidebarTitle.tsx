"use client";

import { useEffect, useState } from "react";

export default function SidebarTitle() {
  const [title, setTitle] = useState("KONECTA");

  useEffect(() => {
    const saved = localStorage.getItem("konecta-sidebar-title");
    if (saved) setTitle(saved);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "konecta-sidebar-title" && e.newValue) {
        setTitle(e.newValue);
      }
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setTitle(detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("konecta-sidebar-title-update", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("konecta-sidebar-title-update", onCustom as EventListener);
    };
  }, []);

  return (
    <div
      className="mb-8 font-bold"
      style={{
        color: "var(--sidebar-title-color)",
        fontSize: "var(--sidebar-title-size)",
      }}
    >
      {title}
    </div>
  );
}
