export function generateMetacriticSlugs(title: string): string[] {
  const clean = title
    .replace(/[™®©℗℠]/g, '')
    .replace(/\((?:ps5|ps4|pc|xbox|switch|playstation|steam)[^)]*\)/gi, '')
    .replace(/\b(playstation hits|playstation\s*4|playstation\s*5|ps5|ps4|pc|xbox|nintendo switch)\b/gi, '')
    .replace(/\b(game of the year edition|goty|digital deluxe edition|deluxe edition|definitive edition|remastered|enhanced edition|complete edition|director'?s cut|special edition|standard edition|gold edition|premium edition|anniversary edition|legendary edition|standard version)\b/gi, '')
    .replace(/['’‘`´]/g, '')
    .replace(/[:\-_—–―,.'!?/\\()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const slugs = new Set<string>();
  const baseSlug = clean.toLowerCase().replace(/\s+/g, '-');
  if (baseSlug) slugs.add(baseSlug);

  // Roman numeral swaps (e.g. 2 <-> ii)
  if (baseSlug.includes('-2')) slugs.add(baseSlug.replace(/-2\b/g, '-ii'));
  if (baseSlug.includes('-ii')) slugs.add(baseSlug.replace(/-ii\b/g, '-2'));
  if (baseSlug.includes('-3')) slugs.add(baseSlug.replace(/-3\b/g, '-iii'));
  if (baseSlug.includes('-iii')) slugs.add(baseSlug.replace(/-iii\b/g, '-3'));
  if (baseSlug.includes('-4')) slugs.add(baseSlug.replace(/-4\b/g, '-iv'));
  if (baseSlug.includes('-iv')) slugs.add(baseSlug.replace(/-iv\b/g, '-4'));

  // Without "the-"
  if (baseSlug.startsWith('the-')) slugs.add(baseSlug.slice(4));

  // With/without "marvels-"
  if (baseSlug.startsWith('marvels-')) slugs.add(baseSlug.replace(/^marvels-/, ''));
  if (!baseSlug.startsWith('marvels-') && baseSlug.includes('spider-man')) slugs.add(`marvels-${baseSlug}`);

  return Array.from(slugs);
}

export async function fetchMetacriticFromWeb(
  title: string
): Promise<{ metascore: number; reviewsCount?: number } | null> {
  const slugs = generateMetacriticSlugs(title);
  for (const slug of slugs) {
    try {
      const res = await fetch(`https://www.metacritic.com/game/${slug}/`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const html = await res.text();
        const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
        if (ldMatches) {
          for (const j of ldMatches) {
            try {
              const d = JSON.parse(j.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, ''));
              if (d.aggregateRating?.ratingValue) {
                const score = Number(d.aggregateRating.ratingValue);
                if (!isNaN(score) && score > 0 && score <= 100) {
                  return { metascore: score, reviewsCount: d.aggregateRating.reviewCount };
                }
              }
            } catch {}
          }
        }
      }
    } catch {}
  }
  return null;
}
