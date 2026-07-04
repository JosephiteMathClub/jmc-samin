import { MetadataRoute } from 'next';
import siteContent from '@/data/site-content.json';

const BASE_URL = 'https://jmc-sjs.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/notices`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/challenge-problems`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  // Dynamically load articles slugs if available
  const articles = (siteContent as any).articles || [];

  const dynamicArticleRoutes = articles.map((article: any) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: article.date ? new Date(article.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const allRoutes = [...staticRoutes, ...dynamicArticleRoutes];

  // Safely deduplicate routes based on the 'url' property
  const uniqueRoutesMap = new Map<string, typeof allRoutes[0]>();
  for (const route of allRoutes) {
    if (route.url) {
      uniqueRoutesMap.set(route.url.toLowerCase(), route);
    }
  }

  return Array.from(uniqueRoutesMap.values());
}
