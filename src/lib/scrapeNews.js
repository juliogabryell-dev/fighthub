import { SAMPLE_NEWS } from './constants';

const AGFIGHT_URL = 'https://agfight.com/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(num))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function extractText(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, '').trim());
}

function parseArticles(html) {
  const articles = [];

  // Strategy: find <h2> elements containing links to agfight.com articles
  // Then extract surrounding context (image, category, excerpt, date)
  const h2Regex =
    /<h2[^>]*>\s*<a[^>]+href="(https?:\/\/agfight\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi;

  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    const url = match[1];
    const title = extractText(match[2]);

    if (!title || !url) continue;

    // Get surrounding context (2000 chars before and after the h2)
    const start = Math.max(0, match.index - 2000);
    const end = Math.min(html.length, match.index + match[0].length + 2000);
    const context = html.substring(start, end);

    // Extract image URL (try data-lazy-src first for lazy-loaded images)
    const imgMatch = context.match(
      /<img[^>]+(?:data-lazy-src|data-src|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i
    );
    const image_url = imgMatch ? imgMatch[1] : null;

    // Extract category from mvp-post-cat
    const catMatch = context.match(
      /class="[^"]*mvp-post-cat[^"]*"[^>]*>([\s\S]*?)<\//i
    );
    const category = catMatch ? extractText(catMatch[1]) : null;

    // Extract excerpt from mvp-post-excerpt or first <p> after title
    const excerptMatch = context.match(
      /class="[^"]*mvp-post-excerpt[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    const summary = excerptMatch
      ? extractText(excerptMatch[1])
      : title.substring(0, 120);

    // Extract date
    const dateMatch =
      context.match(
        /class="[^"]*mvp-(?:cd-)?date[^"]*"[^>]*>([\s\S]*?)<\//i
      ) || context.match(/<time[^>]*datetime="([^"]+)"/i);
    const published_at = dateMatch
      ? extractText(dateMatch[1])
      : new Date().toISOString().split('T')[0];

    // Avoid duplicates
    if (!articles.some((a) => a.url === url)) {
      articles.push({
        id: articles.length + 1,
        title,
        url,
        summary,
        image_url,
        category,
        published_at,
      });
    }

    // Limit to 20 articles
    if (articles.length >= 20) break;
  }

  return articles;
}

/** Maps SAMPLE_NEWS fields to match the expected NewsCard format */
function mapSampleNews() {
  return SAMPLE_NEWS.map((item) => ({
    ...item,
    published_at: item.published_at || item.date,
    image_url: item.image_url || null,
    url: null,
  }));
}

/**
 * Scrapes news from AgFight.com.
 * Falls back to SAMPLE_NEWS if scraping fails.
 * Uses Next.js revalidate cache (1 hour).
 */
export async function scrapeNews() {
  try {
    const res = await fetch(AGFIGHT_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return mapSampleNews();

    const html = await res.text();
    const articles = parseArticles(html);

    if (articles.length === 0) return mapSampleNews();

    return articles;
  } catch {
    return mapSampleNews();
  }
}
