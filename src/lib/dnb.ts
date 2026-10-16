// Deutsche Nationalbibliothek (DNB) Open SRU MARC21 API Client
// Provides 100% free, unmetered access to all German published book editions, publishers, ISBNs, and page counts.

export interface DnbBookRecord {
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  year?: string;
  isbn?: string;
  pages?: number;
}

export const GERMAN_PUBLISHER_REGEX =
  /\b(reclam|insel(?:[ -]verlag|[ -]klassik|[ -]b[uü]cherei)?|suhrkamp|dtv|fischer|carlsen|heyne|piper|klett(?:-cotta)?|rowohlt|kiwi|kiepenheuer|goldmann|ullstein|droemer|knaur|blanvalet|manesse|hanser|diogenes|loewe|arena|ravensburger|aufbau|luchterhand|c\.?h\.?\s*beck)\b/i;

function cleanMarcText(text: string): string {
  return text
    .replace(/&#152;|&amp;#152;|&#156;|&amp;#156;|\u0098|\u009c/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSubfields(xmlChunk: string): Record<string, string[]> {
  const sf: Record<string, string[]> = {};
  const re = /<subfield code="([a-z0-9])">([\s\S]*?)<\/subfield>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xmlChunk)) !== null) {
    const code = m[1];
    const val = cleanMarcText(m[2].replace(/<[^>]+>/g, ''));
    if (!sf[code]) sf[code] = [];
    sf[code].push(val);
  }
  return sf;
}

function parseRecordsFromXml(xml: string, targetQuery?: string): DnbBookRecord[] {
  const records: DnbBookRecord[] = [];
  const re = /<recordData>([\s\S]*?)<\/recordData>/g;
  let rec: RegExpExecArray | null;

  while ((rec = re.exec(xml)) !== null) {
    const chunk = rec[1];

    const getDataFields = (tag: string) => {
      const dfs: Record<string, string[]>[] = [];
      const reDf = new RegExp('<datafield tag="' + tag + '"[^>]*>([\\s\\S]*?)<\\/datafield>', 'g');
      let m: RegExpExecArray | null;
      while ((m = reDf.exec(chunk)) !== null) {
        dfs.push(parseSubfields(m[1]));
      }
      return dfs;
    };

    const f245 = getDataFields('245')[0];
    if (!f245?.a?.[0]) continue;

    let title = cleanMarcText(f245.a[0]);
    // Remove trailing slashes or author credits attached to title
    title = title.replace(/\s*[\/;]\s*.*$/, '').trim();

    let subtitle: string | undefined;
    if (f245.b?.[0]) {
      const rawSub = cleanMarcText(f245.b[0]);
      if (!rawSub.toLowerCase().startsWith('roman') && rawSub.length < 60) {
        subtitle = rawSub.replace(/\s*[\/;]\s*.*$/, '').trim();
      }
    }

    const authorFields = [...getDataFields('100'), ...getDataFields('700')];
    let author = authorFields[0]?.a?.[0] || '';
    if (author.includes(',')) {
      const parts = author.split(',');
      author = `${parts[1].trim()} ${parts[0].trim()}`.replace(/\b(Verfasser|aut|gnd|\d{4}-?)\b/g, '').trim();
    }

    const pubFields = [...getDataFields('264'), ...getDataFields('260')];
    let publisher = pubFields[0]?.b?.[0] || '';
    publisher = publisher.replace(/\[|\]/g, '').trim();

    const yearMatch = (pubFields[0]?.c?.[0] || '').match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : undefined;

    // Collect all ISBNs from all 020 tags
    const isbnFields = getDataFields('020');
    let isbn: string | undefined;
    for (const f of isbnFields) {
      for (const raw of f.a || []) {
        const match = raw.match(/\b(978[0-9]{10}|979[0-9]{10}|[0-9]{9}[0-9X])\b/i);
        if (match) {
          const val = match[1].toUpperCase();
          if (!isbn || (val.startsWith('9783') && !isbn.startsWith('9783'))) {
            isbn = val;
          }
        }
      }
    }

    const f300 = getDataFields('300')[0];
    const pagesMatch = (f300?.a?.[0] || '').match(/(\d+)\s*Seiten/i);
    const pages = pagesMatch ? parseInt(pagesMatch[1], 10) : undefined;

    records.push({
      title,
      subtitle,
      author: author || undefined,
      publisher: publisher || undefined,
      year,
      isbn,
      pages,
    });
  }

  // Deduplicate and rank:
  // 1. Records with ISBN come before records without
  // 2. Penalize bundles/study materials ("Paket für Lehrkräfte", "Lehrerband")
  // 3. Exact or prefix title matches come first
  const targetLower = (targetQuery || '').toLowerCase().trim();
  const titleWordsOnly = targetLower
    .replace(GERMAN_PUBLISHER_REGEX, '')
    .trim();

  return records.sort((a, b) => {
    // Has ISBN > No ISBN
    if (a.isbn && !b.isbn) return -1;
    if (!a.isbn && b.isbn) return 1;

    // Penalize educational noise bundles
    const noiseRegex = /paket|lehrerband|unterrichtsmaterial|kommentar|r[aä]tselabenteuer|h[oö]rbuch|e-book/i;
    const aNoisy = noiseRegex.test(a.title);
    const bNoisy = noiseRegex.test(b.title);
    if (!aNoisy && bNoisy) return -1;
    if (aNoisy && !bNoisy) return 1;

    // Title match boost if title query is given
    if (titleWordsOnly) {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aExact = aTitle === titleWordsOnly || aTitle.startsWith(titleWordsOnly);
      const bExact = bTitle === titleWordsOnly || bTitle.startsWith(titleWordsOnly);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
    }

    return 0;
  });
}

export async function lookupDnbByIsbn(cleanIsbn: string): Promise<DnbBookRecord | null> {
  try {
    const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=num%3D${encodeURIComponent(cleanIsbn)}&recordSchema=MARC21-xml&maximumRecords=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OmniList/1.0' } });
    if (!res.ok) return null;
    const xml = await res.text();
    const records = parseRecordsFromXml(xml);
    return records[0] || null;
  } catch (e) {
    console.warn('DNB ISBN lookup failed:', e);
    return null;
  }
}

export async function searchDnb(query: string, maxResults = 10): Promise<DnbBookRecord[]> {
  try {
    const cleanQ = query.trim().replace(/[<>"]/g, '');
    if (!cleanQ) return [];

    let sruQuery = '';
    const pubMatch = cleanQ.match(GERMAN_PUBLISHER_REGEX);

    if (pubMatch) {
      const pubTerm = pubMatch[1];
      const normalizedPub = pubTerm.toLowerCase().startsWith('insel') ? 'Insel' : pubTerm;
      const titleWords = cleanQ.replace(pubMatch[0], '').trim().split(/\s+/).filter(Boolean);

      if (titleWords.length > 0) {
        const titleStr = titleWords.join(' and ');
        sruQuery = `(${titleStr} or tit=${titleStr} or per=${titleStr}) and vlg=${normalizedPub}`;
      } else {
        if (cleanQ.toLowerCase().includes('klassik')) {
          sruQuery = `vlg=${normalizedPub} and (Klassik or Klassiker or tit=Klassik)`;
        } else {
          sruQuery = `vlg=${normalizedPub}`;
        }
      }
    } else {
      const words = cleanQ.split(/\s+/).filter(Boolean);
      sruQuery = words.length > 1 ? words.join(' and ') : cleanQ;
    }

    const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=${encodeURIComponent(sruQuery)}&recordSchema=MARC21-xml&maximumRecords=${maxResults}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OmniList/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    let records = parseRecordsFromXml(xml, cleanQ);

    // If publisher-targeted search yielded 0 records, fallback to standard full-text query
    if (records.length === 0 && pubMatch) {
      const fallbackUrl = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=${encodeURIComponent(cleanQ.split(/\s+/).join(' and '))}&recordSchema=MARC21-xml&maximumRecords=${maxResults}`;
      const fbRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'OmniList/1.0' } });
      if (fbRes.ok) {
        const fbXml = await fbRes.text();
        records = parseRecordsFromXml(fbXml, cleanQ);
      }
    }

    return records;
  } catch (e) {
    console.warn('DNB search failed:', e);
    return [];
  }
}
