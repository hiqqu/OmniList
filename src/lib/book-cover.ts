export function cleanSvgText(text: string, maxLen = 40): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, maxLen)
    .trim();
}

function splitTitleLines(title: string, maxPerLine = 22): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxPerLine) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function renderSvgTitle(lines: string[], color: string, fontFamily: string, fontSize: number, baseY: number, fontWeight = 'bold'): string {
  if (lines.length === 1) {
    return `<text x="300" y="${baseY}" fill="${color}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle">${cleanSvgText(lines[0], 28)}</text>`;
  }
  const y1 = baseY - Math.round(fontSize * 0.6);
  const y2 = baseY + Math.round(fontSize * 0.7);
  return `<text x="300" y="${y1}" fill="${color}" font-family="${fontFamily}" font-size="${Math.round(fontSize * 0.9)}" font-weight="${fontWeight}" text-anchor="middle">${cleanSvgText(lines[0], 24)}</text>
  <text x="300" y="${y2}" fill="${color}" font-family="${fontFamily}" font-size="${Math.round(fontSize * 0.9)}" font-weight="${fontWeight}" text-anchor="middle">${cleanSvgText(lines[1], 24)}</text>`;
}

export function createBookSvgCover(title: string, author?: string, publisher?: string): string {
  const safeAuthor = cleanSvgText(author || 'Autor', 28);
  const pubLower = (publisher || '').toLowerCase();
  const titleLower = title.toLowerCase();
  const titleLines = splitTitleLines(title, 20);

  // 1. Reclam Edition (Universal-Bibliothek)
  if (pubLower.includes('reclam') || titleLower.includes('reclam')) {
    const titleSvg = renderSvgTitle(titleLines, '#000000', "'Helvetica Neue', Arial, sans-serif", 36, 465, '900');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <rect width="600" height="900" fill="#FEDB00"/>
  <rect x="36" y="36" width="528" height="828" fill="none" stroke="#000000" stroke-width="4"/>
  <rect x="46" y="46" width="508" height="808" fill="none" stroke="#000000" stroke-width="1.5"/>
  <line x1="80" y1="130" x2="520" y2="130" stroke="#000000" stroke-width="2"/>
  <text x="300" y="105" fill="#000000" font-family="'Helvetica Neue', Arial, sans-serif" font-size="26" font-weight="900" letter-spacing="6" text-anchor="middle">RECLAM</text>
  <text x="300" y="380" fill="#000000" font-family="Georgia, serif" font-size="30" font-style="italic" text-anchor="middle">${safeAuthor}</text>
  ${titleSvg}
  <line x1="80" y1="760" x2="520" y2="760" stroke="#000000" stroke-width="2"/>
  <text x="300" y="805" fill="#000000" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" font-weight="bold" letter-spacing="4" text-anchor="middle">UNIVERSAL-BIBLIOTHEK</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 2. Insel Verlag / Insel Klassik Edition
  if (pubLower.includes('insel') || titleLower.includes('insel')) {
    const isKlassik = pubLower.includes('klassik') || titleLower.includes('klassik');
    const headerLabel = isKlassik ? 'INSEL KLASSIK' : 'INSEL VERLAG';
    const titleSvg = renderSvgTitle(titleLines, '#0F172A', "'Times New Roman', Georgia, serif", 36, 465, 'bold');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <rect width="600" height="900" fill="#FAF6EE"/>
  <rect x="30" y="30" width="540" height="840" fill="none" stroke="#1E293B" stroke-width="3"/>
  <rect x="40" y="40" width="520" height="820" fill="none" stroke="#94A3B8" stroke-width="1"/>
  <rect x="52" y="52" width="496" height="796" fill="none" stroke="#1E293B" stroke-width="1"/>
  <line x1="120" y1="135" x2="480" y2="135" stroke="#1E293B" stroke-width="1.5"/>
  <text x="300" y="115" fill="#1E293B" font-family="'Times New Roman', Georgia, serif" font-size="20" letter-spacing="5" text-anchor="middle">${headerLabel}</text>
  <text x="300" y="390" fill="#475569" font-family="'Times New Roman', Georgia, serif" font-size="28" font-style="italic" text-anchor="middle">${safeAuthor}</text>
  ${titleSvg}
  <line x1="120" y1="755" x2="480" y2="755" stroke="#1E293B" stroke-width="1.5"/>
  <text x="300" y="800" fill="#334155" font-family="'Times New Roman', Georgia, serif" font-size="16" letter-spacing="4" text-anchor="middle">INSEL VERLAG BERLIN</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 3. Suhrkamp Edition
  if (pubLower.includes('suhrkamp')) {
    const titleSvg = renderSvgTitle(titleLines, '#0F172A', "Georgia, serif", 36, 470, 'bold');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <rect width="600" height="900" fill="#F8FAFC"/>
  <rect x="30" y="30" width="540" height="840" fill="none" stroke="#0284C7" stroke-width="3"/>
  <rect x="60" y="80" width="480" height="8" fill="#0284C7"/>
  <text x="300" y="130" fill="#0284C7" font-family="system-ui, sans-serif" font-size="18" font-weight="900" letter-spacing="4" text-anchor="middle">SUHRKAMP</text>
  <text x="300" y="400" fill="#334155" font-family="system-ui, sans-serif" font-size="28" font-weight="600" text-anchor="middle">${safeAuthor}</text>
  ${titleSvg}
  <text x="300" y="800" fill="#64748B" font-family="system-ui, sans-serif" font-size="15" letter-spacing="3" text-anchor="middle">SUHRKAMP VERLAG</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // 4. Default Elegant Dark OmniList Library Cover
  const safePublisher = cleanSvgText(publisher || 'OmniList Library', 26);
  const titleSvg = renderSvgTitle(titleLines, '#FFFFFF', "Georgia, serif", 34, 420, 'bold');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="bookDarkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#090D16" />
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bookDarkBg)"/>
  <rect x="30" y="30" width="540" height="840" rx="12" fill="none" stroke="#F97316" stroke-opacity="0.5" stroke-width="2"/>
  <rect x="46" y="46" width="508" height="808" rx="8" fill="none" stroke="#F97316" stroke-opacity="0.2" stroke-width="1"/>
  <rect x="80" y="80" width="84" height="30" rx="6" fill="#F97316" fill-opacity="0.2"/>
  <text x="122" y="100" fill="#F97316" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" letter-spacing="2" text-anchor="middle">BUCH</text>
  ${titleSvg}
  <text x="300" y="485" fill="#FDBA74" font-family="system-ui, sans-serif" font-size="20" text-anchor="middle">${safeAuthor}</text>
  <text x="300" y="790" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="15" letter-spacing="1" text-anchor="middle">${safePublisher}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getOpenLibraryCoverUrl(
  isbn?: string,
  coverId?: number | string,
  size: 'S' | 'M' | 'L' = 'L'
): string | undefined {
  if (coverId && String(coverId) !== '0') {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg?default=false`;
  }
  if (isbn) {
    const clean = isbn.replace(/[-\s]/g, '').trim();
    if (clean) {
      return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg?default=false`;
    }
  }
  return undefined;
}

export function createNoCoverSvg(title?: string, type?: string): string {
  const safeTitle = title ? cleanSvgText(title, 26) : '';
  const typeLabel =
    type === 'movie'
      ? 'FILM'
      : type === 'show'
      ? 'SERIE'
      : type === 'anime'
      ? 'ANIME'
      : type === 'book'
      ? 'BUCH'
      : type === 'game'
      ? 'SPIEL'
      : undefined;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="noCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181B22"/>
      <stop offset="100%" stop-color="#0F1117"/>
    </linearGradient>
  </defs>
  
  <!-- Dark background -->
  <rect width="600" height="900" fill="url(#noCoverGrad)"/>
  <rect x="24" y="24" width="552" height="852" rx="16" fill="none" stroke="#282D37" stroke-width="2"/>
  
  <!-- Light gray symbol: Image with slash (No picture found) -->
  <g transform="translate(236, 340)">
    <rect x="6" y="12" width="116" height="92" rx="12" fill="none" stroke="#71717A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="42" cy="44" r="10" fill="#71717A"/>
    <path d="M18 92 L54 56 L78 80 L96 62 L116 82" fill="none" stroke="#71717A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="0" y1="116" x2="128" y2="0" stroke="#71717A" stroke-width="8" stroke-linecap="round"/>
  </g>

  <!-- Light gray text indicating no picture found -->
  <text x="300" y="495" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" letter-spacing="1.5" text-anchor="middle">KEIN BILD GEFUNDEN</text>
  
  ${safeTitle ? `<text x="300" y="538" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" text-anchor="middle">${safeTitle}</text>` : ''}
  
  ${typeLabel ? `
  <rect x="246" y="572" width="108" height="26" rx="13" fill="#282D37"/>
  <text x="300" y="589" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" text-anchor="middle">${typeLabel}</text>
  ` : ''}
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getMediaCoverFallback(item: {
  title: string;
  creator?: string;
  publisher?: string;
  type?: string;
}): string {
  // If it's a specific publisher edition with dedicated design (Reclam, Insel, Suhrkamp), keep the authentic book cover:
  if (item.type === 'book') {
    const pubLower = (item.publisher || '').toLowerCase();
    const titleLower = item.title.toLowerCase();
    if (
      pubLower.includes('reclam') ||
      titleLower.includes('reclam') ||
      pubLower.includes('insel') ||
      titleLower.includes('insel') ||
      pubLower.includes('suhrkamp')
    ) {
      return createBookSvgCover(item.title, item.creator, item.publisher);
    }
  }

  // Otherwise, return the clean dark image with light-gray symbol indicating no picture found
  return createNoCoverSvg(item.title, item.type);
}

