import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://freeappgentools.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // หากอนาคตมีหน้าอื่นเพิ่ม สามารถต่อท้ายได้ที่นี่ เช่น:
    // {
    //   url: 'https://freeappgentools.com/qr-generator',
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // },
  ];
}