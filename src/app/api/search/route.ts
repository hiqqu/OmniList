import { NextRequest, NextResponse } from 'next/server';
import { searchMedia } from '@/lib/api-adapters';
import { MediaType } from '@/types/media';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = (searchParams.get('type') || 'movie') as MediaType;

    const validTypes: MediaType[] = ['movie', 'show', 'anime', 'book', 'game'];
    const selectedType = validTypes.includes(type) ? type : 'movie';

    const results = await searchMedia(query, selectedType);

    let crossCategorySuggestion: {
      type: MediaType;
      label: string;
      count: number;
      sampleTitle: string;
    } | null = null;

    if (results.length === 0 && query.trim().length >= 3) {
      const allTypes: { type: MediaType; label: string }[] = [
        { type: 'game', label: 'Videospiel' },
        { type: 'movie', label: 'Film & Serie' },
        { type: 'anime', label: 'Anime' },
        { type: 'book', label: 'Buch' },
      ];
      const otherTypes = allTypes.filter((t) => t.type !== selectedType);

      for (const other of otherTypes) {
        try {
          const otherResults = await searchMedia(query, other.type);
          if (otherResults.length > 0) {
            crossCategorySuggestion = {
              type: other.type,
              label: other.label,
              count: otherResults.length,
              sampleTitle: otherResults[0].title,
            };
            break;
          }
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      results,
      count: results.length,
      query,
      type: selectedType,
      crossCategorySuggestion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/search:', error);
    return NextResponse.json(
      { error: 'Fehler bei der externen Mediensuche' },
      { status: 500 }
    );
  }
}
