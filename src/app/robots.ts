import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/profile',
          '/panel',
          '/admin',
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: 'https://jmc-sjs.org/sitemap.xml',
  };
}
