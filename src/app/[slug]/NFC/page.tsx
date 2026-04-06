import { redirect } from "next/navigation";

export default function LegacyLanding({ params }: { params: { slug: string } }) {
  redirect(`/l/${params.slug}/NFC`);
}
