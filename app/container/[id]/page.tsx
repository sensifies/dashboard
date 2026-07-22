import { notFound } from "next/navigation";
import { INITIAL_CONTAINERS, getContainer } from "../../data";
import ContainerDetail from "../../ContainerDetail";

// Pre-render one static page per container at build time (required for the
// static export used by the GitHub Pages deploy). No unknown ids are served.
export function generateStaticParams() {
  return INITIAL_CONTAINERS.map((c) => ({ id: c.id }));
}

export const dynamicParams = false;

export default async function ContainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const container = getContainer(id);
  if (!container) notFound();

  return <ContainerDetail container={container} />;
}
