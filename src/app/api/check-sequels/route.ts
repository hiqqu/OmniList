import { NextRequest, NextResponse } from 'next/server';
import { checkSequelsForLibrary } from '@/lib/api-adapters';
import { MediaItem } from '@/types/media';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: MediaItem[] = body.items || [];

    const sequels = await checkSequelsForLibrary(items);

    return NextResponse.json({
      sequels,
      checkedCount: items.length,
      detectedCount: sequels.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/check-sequels (POST):', error);
    return NextResponse.json(
      { error: 'Fehler bei der Fortsetzungsprüfung' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Sequel Radar API bereit. Sende einen POST-Request mit { items: MediaItem[] } zur Prüfung.',
    timestamp: new Date().toISOString(),
  });
}
