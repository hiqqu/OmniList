import { NextRequest, NextResponse } from 'next/server';
import { searchDnb, GERMAN_PUBLISHER_REGEX } from '@/lib/dnb';
import { formatIsbn } from '@/lib/api-adapters/googlebooks';
import { createBookSvgCover, getOpenLibraryCoverUrl } from '@/lib/book-cover';

export const dynamic = 'force-dynamic';

export interface BookEditionItem {
  id: string;
  title: string;
  subtitle?: string;
  publisher: string;
  year?: string;
  isbn?: string;
  formattedIsbn?: string;
  pages: number;
  coverUrl: string;
  language?: string;
  isGerman?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWorkKey = searchParams.get('workKey') || '';
    const title = (searchParams.get('title') || '').trim();
    const author = (searchParams.get('author') || '').trim();
    const publisherQuery = (searchParams.get('publisher') || '').trim().toLowerCase();

    const editions: BookEditionItem[] = [];
    const seenIsbns = new Set<string>();

    // 1. Fetch German Editions from Deutsche Nationalbibliothek (DNB)
    if (title) {
      const dnbSearchTerm = publisherQuery
        ? `${title} ${publisherQuery}`
        : author
        ? `${title} ${author}`
        : title;

      const dnbRecords = await searchDnb(dnbSearchTerm, 12);
      for (const rec of dnbRecords) {
        if (!rec.title) continue;
        const cleanIsbn = rec.isbn?.replace(/[-\s]/g, '');
        if (cleanIsbn && seenIsbns.has(cleanIsbn)) continue;
        if (cleanIsbn) seenIsbns.add(cleanIsbn);

        const publisherName = rec.publisher || 'Deutscher Verlag';
        const coverUrl =
          getOpenLibraryCoverUrl(cleanIsbn) ||
          createBookSvgCover(rec.title, rec.author || author, publisherName);

        editions.push({
          id: cleanIsbn ? `isbn:${cleanIsbn}` : `dnb:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
          title: rec.title,
          subtitle: rec.subtitle,
          publisher: publisherName,
          year: rec.year,
          isbn: cleanIsbn,
          formattedIsbn: cleanIsbn ? formatIsbn(cleanIsbn) : undefined,
          pages: rec.pages || 350,
          coverUrl,
          language: 'de',
          isGerman: true,
        });
      }
    }

    // 2. Fetch Editions from Open Library Work Editions Endpoint
    let workKey = rawWorkKey;
    if (!workKey && title) {
      try {
        const olSearchRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&fields=key,title&limit=1`,
          { headers: { 'User-Agent': 'OmniList/1.0' } }
        );
        if (olSearchRes.ok) {
          const sData = await olSearchRes.json();
          workKey = sData.docs?.[0]?.key || '';
        }
      } catch (e) {
        console.warn('Open Library workKey search failed:', e);
      }
    }

    if (workKey) {
      const normalizedKey = workKey.startsWith('/') ? workKey : `/${workKey}`;
      try {
        const edRes = await fetch(
          `https://openlibrary.org${normalizedKey}/editions.json?limit=40`,
          { headers: { 'User-Agent': 'OmniList/1.0' } }
        );
        if (edRes.ok) {
          const edData = await edRes.json();
          for (const e of edData.entries || []) {
            const pubName = e.publishers?.[0] || 'Internationaler Verlag';
            const rawIsbn = e.isbn_13?.[0] || e.isbn_10?.[0];
            const cleanIsbn = rawIsbn ? rawIsbn.replace(/[-\s]/g, '') : undefined;

            if (cleanIsbn && seenIsbns.has(cleanIsbn)) continue;
            if (cleanIsbn) seenIsbns.add(cleanIsbn);

            const isGerLang =
              e.languages?.some((l: { key: string }) => l.key?.includes('ger') || l.key?.includes('deu')) ||
              GERMAN_PUBLISHER_REGEX.test(pubName);

            const coverId = e.covers?.[0];
            const coverUrl =
              getOpenLibraryCoverUrl(cleanIsbn, coverId) ||
              createBookSvgCover(e.title || title, author, pubName);

            const yearMatch = (e.publish_date || '').match(/\b(19\d{2}|20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : undefined;

            editions.push({
              id: cleanIsbn ? `isbn:${cleanIsbn}` : `ol:${e.key?.replace('/books/', '') || Math.random()}`,
              title: e.title || title || 'Buchausgabe',
              subtitle: e.subtitle,
              publisher: pubName,
              year,
              isbn: cleanIsbn,
              formattedIsbn: cleanIsbn ? formatIsbn(cleanIsbn) : undefined,
              pages: e.number_of_pages || 350,
              coverUrl,
              language: isGerLang ? 'de' : e.languages?.[0]?.key?.replace('/languages/', ''),
              isGerman: isGerLang,
            });
          }
        }
      } catch (e) {
        console.warn('Open Library editions retrieval failed:', e);
      }
    }

    // Sort:
    // 1. German editions first
    // 2. Matches with requested publisher first
    // 3. Editions with valid covers and ISBNs
    const sorted = editions.sort((a, b) => {
      if (publisherQuery) {
        const aMatches = a.publisher.toLowerCase().includes(publisherQuery);
        const bMatches = b.publisher.toLowerCase().includes(publisherQuery);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      if (a.isGerman && !b.isGerman) return -1;
      if (!a.isGerman && b.isGerman) return 1;
      if (a.isbn && !b.isbn) return -1;
      if (!a.isbn && b.isbn) return 1;
      return 0;
    });

    return NextResponse.json({
      editions: sorted,
      count: sorted.length,
      title,
      workKey,
    });
  } catch (error) {
    console.error('Error in /api/book-editions:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buch-Editionen', editions: [] },
      { status: 500 }
    );
  }
}
