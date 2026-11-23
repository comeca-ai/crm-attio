import { ChatsPage } from "@/components/simple-pages";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <ChatsPage q={q} />;
}
