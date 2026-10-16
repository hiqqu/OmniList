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

function parseRecordsFromXml(xml: string): DnbBookRecord[] {
  const records: DnbBookRecord[] = [];
  const re = /<recordData>([\s\S]*?)<\/recordData>/g;
  let rec: RegExpExecArray | null;

  while ((rec = re.exec(xml)) !== null) {
    const chunk = rec[1];

    const getField = (tag: string) => {
      const m = chunk.match(new RegExp('<datafield tag="' + tag + '"[^>]*>([\\s\\S]*?)<\\/datafield>'));
      return m ? parseSubfields(m[1]) : null;
    };

    const f245 = getField('245');
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

    const f100 = getField('100') || getField('700');
    let author = f100?.a?.[0] || '';
    if (author.includes(',')) {
      const parts = author.split(',');
      author = `${parts[1].trim()} ${parts[0].trim()}`.replace(/\b(Verfasser|aut|gnd|\d{4}-?)\b/g, '').trim();
    }

    const f264 = getField('264') || getField('260');
    let publisher = f264?.b?.[0] || '';
    publisher = publisher.replace(/\[|\]/g, '').trim();

    const yearMatch = (f264?.c?.[0] || '').match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : undefined;

    const f020 = getField('020');
    const rawIsbn = f020?.a?.[0] || '';
    const isbnMatch = rawIsbn.match(/\b(978[0-9]{10}|979[0-9]{10}|[0-9]{9}[0-9X])\b/i);
    const isbn = isbnMatch ? isbnMatch[1].toUpperCase() : undefined;

    const f300 = getField('300');
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

  return records;
}

export async function lookupDnbByIsbn(cleanIsbn: string): Promise<DnbBookRecord | null> {
  try {
    const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=num%3D${encodeURIComponent(cleanIsbn)}&recordSchema=MARC21-xml&maximumRecords=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OmniTrack/1.0' } });
    if (!res.ok) return null;
    const xml = await res.text();
    const records = parseRecordsFromXml(xml);
    return records[0] || null;
  } catch (e) {
    console.warn('DNB ISBN lookup failed:', e);
    return null;
  }
}

export async function searchDnb(query: string, maxResults = 8): Promise<DnbBookRecord[]> {
  try {
    const cleanQ = query.trim().replace(/[<>"]/g, '');
    if (!cleanQ) return [];

    // Formulate SRU search query: supports title & publisher search
    const words = cleanQ.split(/\s+/).filter(Boolean);
    const sruQuery = words.length > 1 ? words.join(' and ') : cleanQ;

    const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=${encodeURIComponent(sruQuery)}&recordSchema=MARC21-xml&maximumRecords=${maxResults}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OmniTrack/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRecordsFromXml(xml);
  } catch (e) {
    console.warn('DNB search failed:', e);
    return [];
  }
}
