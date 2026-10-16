import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';
import { lookupDnbByIsbn, searchDnb } from '@/lib/dnb';

function createBookSvgCover(title: string, author?: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '').slice(0, 30);
  const safeAuthor = (author || 'Autor').replace(/[<>&"]/g, '').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="bookBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#312e81" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#bookBg)"/>
    <rect x="30" y="30" width="540" height="840" rx="16" fill="none" stroke="#f97316" stroke-opacity="0.4" stroke-width="2"/>
    <rect x="50" y="50" width="500" height="800" rx="12" fill="none" stroke="#f97316" stroke-opacity="0.15" stroke-width="1"/>
    <rect x="80" y="80" width="80" height="32" rx="8" fill="#f97316" fill-opacity="0.2"/>
    <text x="120" y="102" fill="#f97316" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">BUCH</text>
    <text x="300" y="440" fill="#ffffff" font-family="Georgia, serif" font-size="34" font-weight="bold" text-anchor="middle">${safeTitle}</text>
    <text x="300" y="490" fill="#fdba74" font-family="system-ui, sans-serif" font-size="20" text-anchor="middle">${safeAuthor}</text>
    <text x="300" y="780" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" text-anchor="middle">OmniTrack Library</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const POPULAR_BOOKS_CATALOG: SearchResultItem[] = [
  {
    id: 'googlebooks:dune1',
    external_id: 'googlebooks:dune1',
    title: 'Dune: Der Wüstenplanet',
    originalTitle: 'Dune',
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/11481354-L.jpg',
    releaseDate: '1965-08-01',
    summary: 'Auf dem Wüstenplaneten Arrakis entbrennt ein gnadenloser Krieg um das Spice, die kostbarste Substanz des bekannten Universums.',
    genres: ['Science-Fiction', 'Klassiker'],
    creator: 'Frank Herbert',
    franchise_id: 'googlebooks:franchise:dune',
    collection_name: 'Dune Romanreihe',
    totalUnits: 800,
    unit: 'pages',
    rating: 4.8,
  },
  {
    id: 'googlebooks:3body',
    external_id: 'googlebooks:3body',
    title: 'Die drei Sonnen',
    originalTitle: 'The Three-Body Problem',
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/8315104-L.jpg',
    releaseDate: '2008-01-01',
    summary: 'Während der Kulturrevolution sendet eine chinesische Wissenschaftlerin ein Signal ins All – mit unabsehbaren Folgen für die Menschheit.',
    genres: ['Hard Sci-Fi', 'Thriller'],
    creator: 'Cixin Liu',
    franchise_id: 'googlebooks:franchise:trisolarians',
    collection_name: 'Trisolaris Trilogie',
    totalUnits: 592,
    unit: 'pages',
    rating: 4.7,
  },
  {
    id: 'googlebooks:lotr1',
    external_id: 'googlebooks:lotr1',
    title: 'Der Herr der Ringe: Die Gefährten',
    originalTitle: 'The Fellowship of the Ring',
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/14588724-L.jpg',
    releaseDate: '1954-07-29',
    summary: 'Frodo Beutlin erhält die gefahrvolle Bürde, den Einen Ring des Dunklen Herrschers Sauron zu den Schicksalsklüften zu bringen.',
    genres: ['High Fantasy', 'Epos'],
    creator: 'J.R.R. Tolkien',
    franchise_id: 'googlebooks:franchise:lotr',
    collection_name: 'Der Herr der Ringe',
    totalUnits: 608,
    unit: 'pages',
    rating: 4.9,
  },
  {
    id: 'googlebooks:habits',
    external_id: 'googlebooks:habits',
    title: 'Atomic Habits: Die 1%-Methode',
    originalTitle: 'Atomic Habits',
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/12539702-L.jpg',
    releaseDate: '2018-10-16',
    summary: 'Minimale Veränderungen, beachtliche Wirkung: Wie kleine Gewohnheiten unser Leben und unsere Produktivität revolutionieren.',
    genres: ['Sachbuch', 'Psychologie', 'Produktivität'],
    creator: 'James Clear',
    totalUnits: 320,
    unit: 'pages',
    rating: 4.8,
  },
  {
    id: 'googlebooks:hp1',
    external_id: 'googlebooks:hp1',
    title: 'Harry Potter und der Stein der Weisen',
    originalTitle: "Harry Potter and the Philosopher's Stone",
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/10522270-L.jpg',
    releaseDate: '1997-06-26',
    summary: 'An seinem elften Geburtstag erfährt der Waisenjunge Harry Potter, dass er ein Zauberer ist und nach Hogwarts eingeladen wird.',
    genres: ['Fantasy', 'Jugendbuch'],
    creator: 'J.K. Rowling',
    franchise_id: 'googlebooks:franchise:hp',
    collection_name: 'Harry Potter Saga',
    totalUnits: 336,
    unit: 'pages',
    rating: 4.9,
  },
  {
    id: 'googlebooks:1984',
    external_id: 'googlebooks:1984',
    title: '1984',
    originalTitle: 'Nineteen Eighty-Four',
    type: 'book',
    coverUrl: 'https://covers.openlibrary.org/b/id/8575708-L.jpg',
    releaseDate: '1949-06-08',
    summary: 'Winston Smith lebt in einem totalitären Überwachungsstaat, in dem der Große Bruder jede Regung der Bürger kontrolliert.',
    genres: ['Dystopie', 'Klassiker'],
    creator: 'George Orwell',
    totalUnits: 320,
    unit: 'pages',
    rating: 4.8,
  },
];

export function extractIsbn(query: string): string | null {
  const clean = query.replace(/^isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim().toUpperCase();
  const isIsbn10 = /^[0-9]{9}[0-9X]$/.test(clean);
  const isIsbn13 = /^(978|979)[0-9]{10}$/.test(clean);
  return isIsbn10 || isIsbn13 ? clean : null;
}

export function formatIsbn(isbn: string): string {
  const clean = isbn.replace(/[-\s]/g, '').trim().toUpperCase();
  if (clean.length === 13) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 7)}-${clean.slice(7, 12)}-${clean.slice(12)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 1)}-${clean.slice(1, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return isbn;
}

export class GoogleBooksAdapter implements MediaAdapter {
  async lookupByIsbn(isbn: string): Promise<SearchResultItem | null> {
    const formatted = formatIsbn(isbn);

    // 1. Open Library Books Data API (Exact edition + high-res cover scan + publisher + pages)
    try {
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        { headers: { 'User-Agent': 'OmniTrack/1.0 (https://github.com)' } }
      );
      if (res.ok) {
        const data = await res.json();
        const item = data[`ISBN:${isbn}`];
        if (item && item.title) {
          const publisher = item.publishers?.[0]?.name;
          const authorNames = item.authors ? item.authors.map((a: { name: string }) => a.name).join(', ') : 'Autor';
          const coverUrl =
            item.cover?.large ||
            item.cover?.medium ||
            `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

          const subtitle = item.subtitle ? `${item.subtitle}` : undefined;
          const editionLabel = publisher ? `${publisher} (${formatted})` : `ISBN ${formatted}`;

          return {
            id: `isbn:${isbn}`,
            external_id: `isbn:${isbn}`,
            title: item.title,
            originalTitle: subtitle ? `${subtitle} • ${editionLabel}` : editionLabel,
            type: 'book',
            coverUrl,
            releaseDate: item.publish_date,
            summary: `Exakte Buch-Ausgabe (${publisher || 'Verlag'}, ISBN: ${formatted}). ${
              item.notes || `Gedruckte Ausgabe mit ${item.number_of_pages || 'mehreren'} Seiten.`
            }`,
            genres: item.subjects ? item.subjects.slice(0, 4).map((s: { name: string }) => s.name) : ['Literatur', 'Buch'],
            creator: authorNames,
            publisher: publisher || undefined,
            isbn,
            franchise_id: `book:publisher:${publisher ? publisher.toLowerCase().replace(/\s+/g, '-') : 'edition'}`,
            collection_name: publisher ? `${publisher} Ausgabe` : 'Exakte Buch-Edition',
            totalUnits: item.number_of_pages || 350,
            unit: 'pages',
            rating: 4.8,
          };
        }
      }
    } catch (e) {
      console.warn('Open Library ISBN lookup failed:', e);
    }

    // 2. Deutsche Nationalbibliothek (DNB) Lookup (100% accurate for German editions & publishers)
    try {
      const dnbRec = await lookupDnbByIsbn(isbn);
      if (dnbRec && dnbRec.title) {
        const publisher = dnbRec.publisher;
        const editionLabel = publisher ? `${publisher} (${formatted})` : `ISBN ${formatted}`;
        return {
          id: `isbn:${isbn}`,
          external_id: `isbn:${isbn}`,
          title: dnbRec.title,
          originalTitle: dnbRec.subtitle ? `${dnbRec.subtitle} • ${editionLabel}` : editionLabel,
          type: 'book',
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
          releaseDate: dnbRec.year ? `${dnbRec.year}-01-01` : undefined,
          summary: `Exakte Buch-Ausgabe der Deutschen Nationalbibliothek (${publisher || 'Verlag'}, ISBN: ${formatted}).`,
          genres: ['Literatur', 'Buch'],
          creator: dnbRec.author || 'Autor',
          publisher: publisher || undefined,
          isbn,
          franchise_id: `book:publisher:${publisher ? publisher.toLowerCase().replace(/\s+/g, '-') : 'edition'}`,
          collection_name: publisher ? `${publisher} Ausgabe` : 'Exakte Buch-Edition',
          totalUnits: dnbRec.pages || 350,
          unit: 'pages',
          rating: 4.8,
        };
      }
    } catch (e) {
      console.warn('DNB ISBN lookup failed:', e);
    }

    // 3. Open Library Search by ISBN
    try {
      const searchRes = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}`);
      if (searchRes.ok) {
        const sData = await searchRes.json();
        const doc = sData.docs?.[0];
        if (doc && doc.title) {
          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
          const publisher = doc.publisher?.[0];
          return {
            id: `isbn:${isbn}`,
            external_id: `isbn:${isbn}`,
            title: doc.title,
            originalTitle: publisher ? `${publisher} (ISBN ${formatted})` : `ISBN ${formatted}`,
            type: 'book',
            coverUrl,
            releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : undefined,
            summary: `Buch-Ausgabe mit ISBN ${formatted}. Verfasst von ${doc.author_name?.[0] || 'Autor'}.${publisher ? ` Verlag: ${publisher}.` : ''}`,
            genres: doc.subject ? doc.subject.slice(0, 3) : ['Literatur'],
            creator: doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Autor',
            publisher: publisher || undefined,
            isbn,
            franchise_id: 'book:isbn',
            collection_name: publisher ? `${publisher} Ausgabe` : 'Buch-Edition',
            totalUnits: doc.number_of_pages_median || 350,
            unit: 'pages',
            rating: 4.7,
          };
        }
      }
    } catch (e) {
      console.warn('Open Library search by ISBN failed:', e);
    }

    // 4. Fallback direct Open Library ISBN cover
    return {
      id: `isbn:${isbn}`,
      external_id: `isbn:${isbn}`,
      title: `Buch (ISBN ${formatted})`,
      originalTitle: `ISBN ${formatted}`,
      type: 'book',
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      summary: `Buchausgabe für ISBN ${formatted}.`,
      genres: ['Buch'],
      creator: 'Autor',
      isbn,
      totalUnits: 350,
      unit: 'pages',
      rating: 4.5,
    };
  }

  async search(query: string): Promise<SearchResultItem[]> {
    const raw = query.trim();
    if (!raw) {
      return POPULAR_BOOKS_CATALOG;
    }

    // Check if query is an ISBN (10- or 13-digit)
    const detectedIsbn = extractIsbn(raw);
    if (detectedIsbn) {
      const isbnItem = await this.lookupByIsbn(detectedIsbn);
      if (isbnItem) {
        return [isbnItem];
      }
    }

    const q = raw.toLowerCase();
    const items: SearchResultItem[] = [];
    const seenIsbns = new Set<string>();

    // 1. DNB Live Search for German Publisher Editions (e.g. "Dune Heyne", "Percy Jackson Carlsen")
    try {
      const dnbMatches = await searchDnb(raw, 5);
      for (const dnb of dnbMatches) {
        if (!dnb.title) continue;
        const cleanIsbn = dnb.isbn ? dnb.isbn.replace(/[-\s]/g, '') : undefined;
        if (cleanIsbn && seenIsbns.has(cleanIsbn)) continue;
        if (cleanIsbn) seenIsbns.add(cleanIsbn);

        const external_id = cleanIsbn ? `isbn:${cleanIsbn}` : `dnb:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
        const coverUrl = cleanIsbn
          ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
          : createBookSvgCover(dnb.title, dnb.author);

        items.push({
          id: external_id,
          external_id,
          title: dnb.title,
          originalTitle: dnb.subtitle || (dnb.publisher ? `${dnb.publisher}${dnb.year ? ` (${dnb.year})` : ''}` : undefined),
          type: 'book',
          coverUrl,
          releaseDate: dnb.year ? `${dnb.year}-01-01` : undefined,
          summary: `Ausgabe von ${dnb.publisher || 'Verlag'}${dnb.year ? ` (${dnb.year})` : ''}.${cleanIsbn ? ` ISBN: ${formatIsbn(cleanIsbn)}.` : ''}`,
          genres: ['Literatur', 'Buch'],
          creator: dnb.author || 'Autor',
          publisher: dnb.publisher,
          isbn: cleanIsbn,
          collection_name: dnb.publisher ? `${dnb.publisher} Ausgabe` : undefined,
          totalUnits: dnb.pages || 350,
          unit: 'pages',
          rating: 4.8,
        });
      }
    } catch (e) {
      console.warn('DNB search failed:', e);
    }

    // 2. Live Open Library Search with detailed fields (Editions, Publishers, Cover IDs, Work Key)
    try {
      const openLibRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,subtitle,author_name,isbn,publisher,publish_date,number_of_pages,number_of_pages_median,cover_i,language,edition_count&limit=8`,
        { headers: { 'User-Agent': 'OmniTrack/1.0' } }
      );
      if (openLibRes.ok) {
        const data = await openLibRes.json();
        for (const doc of data.docs || []) {
          if (!doc.title) continue;

          // Check if user search matches any specific publisher in this work
          const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
          const matchingPublisher = doc.publisher?.find((p: string) =>
            queryWords.some((w) => p.toLowerCase().includes(w))
          );

          // Find German publisher or matching publisher if available
          const germanPublisher = doc.publisher?.find((p: string) =>
            /carlsen|heyne|dtv|piper|fischer|klett|reclam|suhrkamp|goldmann|ullstein|kiwi|rowohlt|droemer|blanvalet|loewe|arena|ravensburger/i.test(p)
          );

          const chosenPublisher = matchingPublisher || germanPublisher || doc.publisher?.[0];

          // Pick primary ISBN
          const primaryIsbn = doc.isbn?.[0];
          if (primaryIsbn && seenIsbns.has(primaryIsbn)) continue;
          if (primaryIsbn) seenIsbns.add(primaryIsbn);

          const external_id = primaryIsbn
            ? `isbn:${primaryIsbn}`
            : `openlibrary:${doc.key?.replace('/works/', '') || doc.cover_edition_key || Math.random()}`;

          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : primaryIsbn
            ? `https://covers.openlibrary.org/b/isbn/${primaryIsbn}-L.jpg`
            : createBookSvgCover(doc.title, doc.author_name?.[0]);

          const editionLabel = chosenPublisher
            ? `${chosenPublisher}${primaryIsbn ? ` (${formatIsbn(primaryIsbn)})` : ''}`
            : primaryIsbn
            ? `ISBN ${formatIsbn(primaryIsbn)}`
            : undefined;

          items.push({
            id: external_id,
            external_id,
            title: doc.title,
            originalTitle: doc.subtitle ? `${doc.subtitle} • ${editionLabel || ''}` : editionLabel,
            type: 'book',
            coverUrl,
            releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : undefined,
            summary: `Buch von ${doc.author_name?.[0] || 'Unbekanntem Autor'}. Verlag: ${chosenPublisher || 'k. A.'}.${
              primaryIsbn ? ` (ISBN ${formatIsbn(primaryIsbn)})` : ''
            }`,
            genres: doc.subject ? doc.subject.slice(0, 3) : ['Literatur'],
            creator: doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Autor',
            publisher: chosenPublisher,
            isbn: primaryIsbn,
            editionKey: doc.key,
            editionCount: doc.edition_count,
            franchise_id: `book:franchise:${doc.author_name?.[0] || 'general'}`,
            collection_name: chosenPublisher ? `${chosenPublisher} Ausgabe` : undefined,
            totalUnits: doc.number_of_pages_median || 350,
            unit: 'pages',
            rating: 4.6,
          });
        }
      }
    } catch (e) {
      console.warn('Open Library search failed:', e);
    }

    // 3. Search in local catalog
    const catalogMatches = POPULAR_BOOKS_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.creator && m.creator.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );

    const combined = [...items];
    for (const match of catalogMatches) {
      if (!combined.some((x) => x.title.toLowerCase() === match.title.toLowerCase())) {
        combined.push(match);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    if (combined.length > 0) {
      return combined;
    }

    // 3. Dynamic fallback with dedicated book artwork (Never shows the wrong cover!)
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:book:${Date.now()}`,
        external_id: `custom:book:${Date.now()}`,
        title: capitalized,
        type: 'book',
        coverUrl: createBookSvgCover(capitalized, 'Autor'),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Buch: ${capitalized}. Seiten erfassen und Lesefortschritt tracken.`,
        genres: ['Buch', 'Literatur'],
        creator: 'Autor',
        totalUnits: 350,
        unit: 'pages',
        rating: 4.5,
      },
    ];
  }

  async checkSequels(item: MediaItem): Promise<SequelNotification | null> {
    const titleLower = item.title.toLowerCase();

    // 1. Dune -> Der Herr des Wüstenplaneten (Dune Messiah)
    if (
      (item.external_id === 'googlebooks:dune1' || titleLower.includes('wüstenplanet') || titleLower === 'dune') &&
      !titleLower.includes('messiah') &&
      !titleLower.includes('herr des wüstenplaneten')
    ) {
      return {
        id: `seq-dune-messiah-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'book',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Dune: Der Herr des Wüstenplaneten (Teil 2)',
        sequelType: 'book',
        sequelCoverUrl: 'https://covers.openlibrary.org/b/id/11481354-L.jpg',
        releaseDate: '1969-07-01',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'googlebooks:dune-messiah',
        franchise_id: 'googlebooks:franchise:dune',
        description: 'Zwölf Jahre nach Paul Muad’Dibs Herrschaftsantritt: Die dunkle Kehrseite des Heiligen Krieges.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 320, unit: 'pages' },
      };
    }

    // 2. Die drei Sonnen -> Der dunkle Wald
    if (
      (item.external_id === 'googlebooks:3body' || titleLower.includes('drei sonnen')) &&
      !titleLower.includes('dunkle wald')
    ) {
      return {
        id: `seq-dark-forest-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'book',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Der dunkle Wald (Trisolaris 2)',
        sequelType: 'book',
        sequelCoverUrl: 'https://covers.openlibrary.org/b/id/8315104-L.jpg',
        releaseDate: '2008-05-01',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'googlebooks:dark-forest',
        franchise_id: 'googlebooks:franchise:trisolarians',
        description: 'Band 2 der Trisolaris-Trilogie: Das kosmische Schweigen und das Projekt der Wandschauer.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 680, unit: 'pages' },
      };
    }

    // 3. Die Gefährten -> Die zwei Türme
    if (
      (item.external_id === 'googlebooks:lotr1' || titleLower.includes('die gefährten')) &&
      !titleLower.includes('zwei türme')
    ) {
      return {
        id: `seq-lotr-twotowers-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'book',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Der Herr der Ringe: Die zwei Türme',
        sequelType: 'book',
        sequelCoverUrl: 'https://covers.openlibrary.org/b/id/14588724-L.jpg',
        releaseDate: '1954-11-11',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'googlebooks:lotr-2',
        franchise_id: 'googlebooks:franchise:lotr',
        description: 'Die Gefährten sind getrennt: Frodo und Sam ziehen mit Gollum nach Mordor.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 520, unit: 'pages' },
      };
    }

    return null;
  }
}
