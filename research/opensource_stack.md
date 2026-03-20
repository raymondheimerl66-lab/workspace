# Therapeuten-CRM: Open Source Stack Konzept

## Anforderungen (aus Audio 20.03. 13:42)

| Modul | Anforderung |
|-------|-------------|
| **Buchungssystem** | Terminbuchung für Patienten |
| **Erinnerungen** | Mail + SMS für Termine |
| **Audio-Zusammenfassung** | Sprachnotiz → Transkript → Zusammenfassung |
| **Dashboard/CRM** | Kundenübersicht, Patientenakten |
| **Kunden-Login** | Patienten-Portal |
| **Kostenmodell** | Keine laufenden Kosten, Abo für Kunden |

---

## Empfohlener Open Source Stack

### 1. Buchungssystem: **Cal.com** (Self-Hosted)
- **Repo:** https://github.com/calcom/cal.com
- **Stack:** Next.js, TypeScript, PostgreSQL
- **Features:** Terminbuchung, Kalender-Sync, Erinnerungen
- **Kosten:** Gratis (Self-Hosted)

### 2. Backend/CRM: **Directus** oder **Strapi**
- **Directus:** https://github.com/directus/directus
  - Headless CMS mit Admin-UI
  - PostgreSQL/MySQL
  - API-first
  - Rollen & Berechtigungen
  
### 3. Audio-Zusammenfassung: **Whisper + LLM**
- **Whisper:** OpenAI (lokal oder API)
- **Zusammenfassung:** Ollama (lokales LLM) oder OpenRouter
- **Workflow:**
  ```
  Audio-Upload → Whisper Transkription → LLM Zusammenfassung → Speichern in DB
  ```

### 4. Auth/Login: **Keycloak** oder **Supabase Auth**
- **Supabase:** https://github.com/supabase/supabase
  - Auth, DB, Storage, Realtime
  - PostgreSQL-basiert
  - Gratis Tier verfügbar

### 5. Frontend Dashboard: **Next.js + Tailwind**
- React-basiert
- Server Components
- Einfache Integration mit APIs

### 6. SMS: **Twilio** (nicht Open Source, aber notwendig)
- Alternative: **Sinch**, **Vonage**
- Oder: **Gammu** (Self-Hosted SMS Gateway mit Hardware)

### 7. E-Mail: **Nodemailer** + **Mailgun/SendGrid**
- Oder: **Mailcow** (Self-Hosted Mailserver)

---

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    THERapeuten-CRM                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                         │
│  ├─ Therapeuten Dashboard                                   │
│  ├─ Patienten Portal (Login)                                │
│  └─ Audio-Upload + Notizen                                  │
├─────────────────────────────────────────────────────────────┤
│  Backend/API Layer                                          │
│  ├─ Directus (CMS/CRM)                                      │
│  ├─ Cal.com API (Termine)                                   │
│  └─ Supabase (Auth, DB)                                     │
├─────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ├─ Whisper (Transkription)                                 │
│  ├─ Ollama/LLM (Zusammenfassung)                            │
│  ├─ Mailer (E-Mail)                                         │
│  └─ SMS Gateway                                             │
├─────────────────────────────────────────────────────────────┤
│  Datenbank: PostgreSQL                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Kosten (Self-Hosted auf Hetzner/DigitalOcean)

| Komponente | Kosten/Monat |
|------------|--------------|
| VPS (4GB RAM, 2 vCPU) | €5-10 |
| Domain + SSL | €1-2 |
| SMS (Twilio) | pay-per-use (~€0.08/SMS) |
| E-Mail (Mailgun) | 1.000/Monat gratis |
| **Gesamt** | **~€10-15/Monat Basis** |

---

## Nächste Schritte

1. **MVP Scope definieren** - Was ist im ersten Release?
2. **Technische POCs** - Whisper + LLM Zusammenfassung testen
3. **Cal.com Self-Hosting** evaluieren
4. **Datenmodell** für CRM erstellen
5. **UI/UX Mockups** für Dashboard

---

*Erstellt: 20.03.2026*
