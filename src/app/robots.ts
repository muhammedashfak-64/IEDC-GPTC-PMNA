import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/']
    },
    sitemap: 'https://iedc-gptcpmna.edu.in/sitemap.xml'
  };
}
