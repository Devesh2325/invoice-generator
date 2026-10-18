import { MetadataRoute } from 'next';
import { APP_CONFIG } from '@invoice/core';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${APP_CONFIG.brandDomain}`;
  const routes = [
    '',
    '/features',
    '/pricing',
    '/templates',
    '/blog',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/login',
    '/signup',
    '/create',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/create' ? 0.9 : 0.7,
  }));
}
