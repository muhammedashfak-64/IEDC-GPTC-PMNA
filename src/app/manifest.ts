import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IEDC GPTC Perinthalmanna',
    short_name: 'IEDC PMNA',
    description: 'Official Innovation & Entrepreneurship Development Centre Platform at Government Polytechnic College, Perinthalmanna',
    start_url: '/',
    display: 'standalone',
    background_color: '#050b18',
    theme_color: '#00d4ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon'
      }
    ]
  };
}
