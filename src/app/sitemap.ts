import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://iedc-gptcpmna.edu.in';
  const routes = [
    '',
    '/projects',
    '/startups',
    '/innovation',
    '/events',
    '/competitions',
    '/learning',
    '/resources',
    '/verify',
    '/blog',
    '/community',
    '/contact',
    '/dashboard'
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8
  }));
}
