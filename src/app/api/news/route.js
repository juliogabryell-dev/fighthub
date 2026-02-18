import { scrapeNews } from '@/lib/scrapeNews';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const news = await scrapeNews();

  return Response.json(news, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
    },
  });
}
