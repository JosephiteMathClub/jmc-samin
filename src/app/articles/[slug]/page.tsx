import ArticleDetailView from "@/views/ArticleDetail";
import { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import { DEFAULT_CONTENT } from "@/data/default-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Try to load the articles array from site-content.json
  let articles = (DEFAULT_CONTENT as any).articles || [];
  try {
    const filePath = path.join(process.cwd(), 'src/data/site-content.json');
    const fileDataStr = await fs.readFile(filePath, 'utf-8');
    if (fileDataStr) {
      const parsed = JSON.parse(fileDataStr);
      articles = parsed.articles || articles;
    }
  } catch (error) {
    // Keep fallback
  }

  const article = articles.find((a: any) => a.slug === slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.excerpt || article.summary || `Read "${article.title}" published by the Josephite Math Club.`,
    keywords: [
      ...(article.category ? [article.category, `${article.category} theories`] : []),
      "JMC Publications",
      "Math Articles BD",
      article.author || "Josephite Math Club",
    ],
    openGraph: {
      title: `${article.title} | Josephite Math Club`,
      description: article.excerpt || article.summary || `Read "${article.title}" published by the Josephite Math Club.`,
      type: "article",
      authors: [article.author || "Josephite Math Club"],
      publishedTime: article.date,
      tags: article.category ? [article.category] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || article.summary,
    }
  };
}

export default function ArticleDetailPage() {
  return <ArticleDetailView />;
}
