import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://billcraft.io';
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
