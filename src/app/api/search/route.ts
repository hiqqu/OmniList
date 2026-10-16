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

    return NextResponse.json({
      results,
      count: results.length,
      query,
      type: selectedType,
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
