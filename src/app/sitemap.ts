import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { APP_NAME } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitflowpro.com.br';

  // Get all posts
  const posts = await getAllPosts();
  const postUrls = posts.map(post => ({
    url: `${appUrl}/blog/${post.slug}`,
    lastModified: new Date(post.meta.date).toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Static routes
  const staticUrls = [
    {
      url: appUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 1,
    },
    {
      url: `${appUrl}/subscribe`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${appUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ];

  return [...staticUrls, ...postUrls];
}
