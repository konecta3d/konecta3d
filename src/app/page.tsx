import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Link className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black" href="/dashboard">
        Ir al dashboard
      </Link>
    </div>
  );
}
