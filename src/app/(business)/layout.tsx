import React from "react";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <div className="flex-1">
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
