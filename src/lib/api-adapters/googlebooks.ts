import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';

const MOCK_BOOKS_CATALOG: SearchResultItem[] = [
  {
    id: 'googlebooks:dune1',
    external_id: 'googlebooks:dune1',
    title: 'Dune: Der Wüstenplanet',
    originalTitle: 'Dune',
    type: 'book',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2018-10-16',
    summary: 'Minimale Veränderungen, beachtliche Wirkung: Wie kleine Gewohnheiten unser Leben und unsere Produktivität revolutionieren.',
    genres: ['Sachbuch', 'Psychologie', 'Produktivität'],
    creator: 'James Clear',
    totalUnits: 320,
    unit: 'pages',
    rating: 4.8,
  },
];

export class GoogleBooksAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${GOOGLE_BOOKS_BASE}?q=${encodeURIComponent(q)}&maxResults=8&langRestrict=de,en`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items: SearchResultItem[] = [];

        for (const item of data.items || []) {
          const info = item.volumeInfo || {};
          const external_id = `googlebooks:${item.id}`;
          const coverUrl =
            info.imageLinks?.thumbnail?.replace('http://', 'https://') ||
            info.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80';

          items.push({
            id: external_id,
            external_id,
            title: info.title || 'Unbekanntes Buch',
            originalTitle: info.subtitle,
            type: 'book',
            coverUrl,
            releaseDate: info.publishedDate,
            summary: info.description ? info.description.slice(0, 300) : 'Keine Beschreibung verfügbar.',
            genres: info.categories || ['Literatur'],
            creator: info.authors ? info.authors.join(', ') : 'Unbekannter Autor',
            franchise_id: `googlebooks:franchise:${info.authors?.[0] || 'book'}`,
            totalUnits: info.pageCount || 300,
            unit: 'pages',
            rating: info.averageRating ? Number(info.averageRating) : 4.3,
          });
        }

        if (items.length > 0) return items;
      }
    } catch (e) {
      console.warn('Google Books live search failed, falling back to mock catalog', e);
    }

    return MOCK_BOOKS_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.creator && m.creator.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );
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
        sequelCoverUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80',
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
        sequelCoverUrl:
          'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=500&auto=format&fit=crop&q=80',
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
        sequelCoverUrl:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80',
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
