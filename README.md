# OmniList – Modern All-in-One Medien-Tracker

OmniList ist eine moderne, lokale Web-Applikation zur lückenlosen Verwaltung deiner Filme, Serien, Anime, Bücher und Videospiele.

---

## Schnellstart

### 1. Entwicklungsserver starten
```bash
npm run dev
```
Öffne anschließend [http://localhost:3000](http://localhost:3000) im Browser.

### 2. Produktions-Build erstellen & ausführen
```bash
npm run build
npm start
```

---

## Hauptfunktionen & Architektur

### 1. Hybrid-Suche & Single Source of Truth
* **Reine Nutzersammlung:** In der lokalen Datenbank/Storage werden ausschließlich Werke gespeichert, die du aktiv hinzugefügt hast.
* **Instant Dashboard-Suche (< 10 ms):** Volltextsuche über Titel, Genres, Autoren und Studios ohne spürbare Latenz.
* **Typ-fokussierte externe Suche:** Vorabauswahl (Film/Serie, Anime, Buch, Videospiel) verhindert unnötigen API-Fan-out.
* **300 ms Debounce & AbortController:** Verhindert Race Conditions und spart Bandbreite bei schnellem Tippen.
* **Server-seitiges Caching (24h TTL):** Suchanfragen werden serverseitig zwischengespeichert.
* **Adapter-Pattern & Multiquellen:**
  * **TMDB:** Filme & Serien (inkl. Fortsetzungen via Collections & neue Staffeln)
  * **AniList:** Anime (Live GraphQL-Relations `SEQUEL` & Fallback)
  * **Deutsche Nationalbibliothek (DNB) & Open Library:** Deutsche Verlagsausgaben, ISBN-13, genaue Seitenzahlen & Verlagsfilter
  * **RAWG:** Videospiele & Expansions

### 2. Der "Sequel Radar"
* **Automatische Erkennung:** Prüft Medien mit dem Status *„Beendet“* oder *„Gerade dabei“* auf Nachfolger.
* **1-Klick-Übernahme:** Mit einem Klick auf *„+ Zu 'Geplant' hinzufügen“* oder *„Direkt starten“* wandert die Fortsetzung direkt in deine Sammlung.
* **Manueller Sync-Button:** *„Sequel Radar prüfen“* ruft den Route Handler `/api/check-sequels` auf.

### 3. Kachel-First Dark-Mode UI
* **Design:** Konsequenter Dark Mode mit Tailwind Zinc/Slate-Farben und 2:3 Poster-Format.
* **Farbkodierte Badges:**
  * Rot: Film
  * Amber: Serie
  * Blau: Anime
  * Orange: Buch
  * Violett: Videospiel
* **Quick-Increment:** Ein Klick auf `+1 Ep.`, `+10 S.` oder `+1 Std.` aktualisiert den Fortschritt optimistisch in Echtzeit.
* **Sterne-Rating:** Schnelle visuelle Orientierung ohne automatische Vorbelegung.

---

## Optionale API-Keys (.env.local)

OmniList funktioniert standardmäßig **100 % out-of-the-box ohne API-Keys** dank integrierter Mock-Kataloge und öffentlicher Endpunkte (wie AniList, Open Library & DNB). 

Falls du Live-Daten für TMDB oder RAWG nutzen möchtest, erstelle eine `.env.local`:
```env
TMDB_API_KEY=dein_tmdb_api_key
RAWG_API_KEY=dein_rawg_api_key
GOOGLE_BOOKS_API_KEY=optionaler_key
```
