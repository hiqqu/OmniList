import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

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

export class GoogleBooksAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return POPULAR_BOOKS_CATALOG;
    }

    const items: SearchResultItem[] = [];

    // 1. Live Open Library Search (Completely FREE, public, returns real official book covers!)
    try {
      const openLibRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6`
      );
      if (openLibRes.ok) {
        const data = await openLibRes.json();
        for (const doc of data.docs || []) {
          if (!doc.title) continue;
          const external_id = `openlibrary:${doc.key?.replace('/works/', '') || doc.cover_edition_key || Math.random()}`;
          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : POPULAR_BOOKS_CATALOG[0].coverUrl;

          items.push({
            id: external_id,
            external_id,
            title: doc.title,
            originalTitle: doc.subtitle,
            type: 'book',
            coverUrl,
            releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : undefined,
            summary: `Buch von ${doc.author_name?.[0] || 'Unbekanntem Autor'}. Erschienen ca. ${doc.first_publish_year || 'k. A.'}.`,
            genres: doc.subject ? doc.subject.slice(0, 3) : ['Literatur'],
            creator: doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Autor',
            franchise_id: `book:franchise:${doc.author_name?.[0] || 'general'}`,
            totalUnits: doc.number_of_pages_median || 350,
            unit: 'pages',
            rating: 4.6,
          });
        }
      }
    } catch (e) {
      console.warn('Open Library search failed:', e);
    }

    // 2. Search in local catalog
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

    // 3. Dynamic fallback with official book cover template
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:book:${Date.now()}`,
        external_id: `custom:book:${Date.now()}`,
        title: capitalized,
        type: 'book',
        coverUrl: POPULAR_BOOKS_CATALOG[0].coverUrl,
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
