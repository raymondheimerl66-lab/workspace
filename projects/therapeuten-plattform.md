# Therapeuten-Plattform (CH)

## Vision
Die administrative Last für selbstständige Therapeuten in der Schweiz um 30–50% senken.

## Zielgruppe
Selbstständige Therapeuten in der Schweiz:
- Psychotherapeuten
- Physiotherapeuten
- Ernährungsberater

Gemeinsamer Schmerzpunkt: Zu viel Zeit für Termine, Dokumentation, Abrechnung — zu wenig für Patienten.

## Kernfunktionen

### 1. Terminbuchung
Basierend auf cal.com (Open Source), self-hosted in der Schweiz. Online-Buchung, Kalender-Sync, Erinnerungen, mandantenfähig.

### 2. Lokale Sprachaufnahme + KI-Zusammenfassung
Therapeut nimmt Sitzung auf, KI erstellt strukturierte Zusammenfassung. Daten verlassen die Schweiz nie. DSG/DSGVO-konform.

### 3. Klientenverwaltung
Digitale Patientenakte: Stammdaten, Sitzungsnotizen, Dokumente, Verlauf.

### 4. Abrechnung
Leistungspositionen erfassen, Rechnungen generieren, Export. Ziel: minimaler manueller Aufwand.

## Differenzierung
- Schweizer Datenhoheit (kein Cloud-Export, kein US-Hosting)
- End-to-end Workflow statt Einzeltools
- KI-gestützte Dokumentation ohne Datenschutz-Kompromisse

## Tech-Stack (vorläufig)
- cal.com (Buchung)
- CH-Hosting (z.B. Infomaniak, Exoscale)
- Lokale/On-Device Transkription (Whisper o.ä.)
- Auth: noch offen
- Frontend: noch offen
