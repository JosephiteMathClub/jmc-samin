import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/register-member',
          '/forgot-password',
          '/reset-password',
          '/profile',
          '/panel',
          '/admin',
          '/api/',
          '/_next/',
          '/static/',
          '/gallery',
          '/challenge-problems',
          '/articles/',
        ],
      },
    ],
    sitemap: 'https://jmc-sjs.org/sitemap.xml',
  };
}
