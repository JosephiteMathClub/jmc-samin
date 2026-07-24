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

  const desc = article.excerpt || article.summary || `Read "${article.title}" published by the Josephite Math Club.`;

  return {
    title: article.title,
    description: desc,
    keywords: [
      ...(article.category ? [article.category, `${article.category} theories`] : []),
      "JMC Publications",
      "Math Articles BD",
      article.author || "Josephite Math Club",
    ],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title: `${article.title} | Josephite Math Club`,
      description: desc,
      type: "article",
      url: `https://jmc-sjs.org/articles/${slug}`,
      authors: [article.author || "Josephite Math Club"],
      publishedTime: article.date,
      tags: article.category ? [article.category] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: desc,
    }
  };
}

export default async function ArticleDetailPage({ params }: Props) {
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
    return <ArticleDetailView />;
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://jmc-sjs.org/articles/${slug}`
    },
    "headline": article.title,
    "description": article.excerpt || article.summary || `Read "${article.title}" published by the Josephite Math Club.`,
    "image": article.coverUrl || article.imageUrl || "https://jmc-sjs.org/images/og-image.png",
    "datePublished": article.date,
    "dateModified": article.date,
    "author": {
      "@type": "Person",
      "name": article.author || "Josephite Math Club Member"
    },
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "Josephite Math Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jmc-sjs.org/images/logo.png"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <ArticleDetailView />
    </>
  );
}
