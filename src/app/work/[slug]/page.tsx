import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, getProject, profile } from "@/data/resume";
import { CaseStudy } from "@/components/work/CaseStudy";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return { title: `${p.title} — ${profile.name}`, description: p.summary };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return <CaseStudy slug={slug} />;
}
