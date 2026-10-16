import { NextRequest, NextResponse } from 'next/server';
import { GoogleBooksAdapter, extractIsbn, formatIsbn } from '@/lib/api-adapters/googlebooks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawIsbn = searchParams.get('isbn') || '';

    const clean = extractIsbn(rawIsbn);
    if (!clean) {
      return NextResponse.json(
        { found: false, error: 'Ungültige ISBN. Bitte eine 10- oder 13-stellige ISBN angeben.' },
        { status: 400 }
      );
    }

    const adapter = new GoogleBooksAdapter();
    const result = await adapter.lookupByIsbn(clean);

    if (!result) {
      return NextResponse.json(
        { found: false, error: 'Keine Buch-Edition zur angegebenen ISBN gefunden.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      isbn: clean,
      formattedIsbn: formatIsbn(clean),
      title: result.title,
      subtitle: result.originalTitle,
      creator: result.creator,
      publisher: result.collection_name?.replace(' Ausgabe', ''),
      pages: result.totalUnits,
      coverUrl: result.coverUrl,
      summary: result.summary,
      releaseDate: result.releaseDate,
      genres: result.genres,
    });
  } catch (error) {
    console.error('Error in /api/isbn:', error);
    return NextResponse.json(
      { found: false, error: 'Fehler beim Abrufen der Buch-Edition per ISBN' },
      { status: 500 }
    );
  }
}
