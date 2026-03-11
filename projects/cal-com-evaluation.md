# cal.com Self-Hosting Evaluation

## TL;DR
cal.com ist technisch geeignet für unser Projekt. AGPL-Lizenz erlaubt Self-Hosting ohne Lizenzkosten. Schweizer Hosting kein Problem. Multi-Tenant möglich, aber SSO nur mit Enterprise-Lizenz ($30/Seat/Monat). Grösste Hürde: DevOps-Aufwand für Setup und Wartung.

## Lizenz

| Variante | Kosten | Was man bekommt |
|----------|--------|-----------------|
| AGPL (Open Source) | $0 + Infrastruktur | Alle Kernfunktionen: Buchung, Workflows, Integrationen, API |
| Enterprise | $30/Seat/Monat | SSO/SAML, Managed Hosting, Custom SLAs, dedizierter Support |

**Empfehlung:** Start mit AGPL. Enterprise erst wenn SSO/SAML für Praxen mit mehreren Therapeuten nötig wird.

## Hardware-Anforderungen
- Min. 4 CPU Cores, 8 GB RAM, SSD
- Stack: Node.js, Yarn, PostgreSQL (Prisma ORM)
- Deployment via Docker empfohlen

## Deployment
- Docker-Container mit offiziellen Images
- `.env` konfigurieren (Domain, Auth-Secret, DB, Integrationen)
- Reverse Proxy (Caddy/Nginx) für SSL
- Cron-Jobs für Erinnerungen etc. manuell einrichten
- Railway bietet One-Click-Deploy (Alternative für schnellen Start)

## Multi-Tenant
- Team-Scheduling, Multi-Location, Resource Management im AGPL-Core enthalten
- Mandantenfähig über Teams/Orgs
- SSO für Multi-Tenant-Orgs nur mit Enterprise-Lizenz
- Skaliert via Container horizontal

## Customizing
- Branding, Zeitzone, Custom Fields/Forms über `.env` und UI
- Workflow-Automationen (Erinnerungen, Follow-ups)
- App Store für Integrationen (Google Calendar, Zoom etc.)
- API für eigene Integrationen
- Frontend basiert auf Next.js → eigene Anpassungen möglich

## Schweizer Hosting
Voll kompatibel. Self-Hosting auf jedem CH-Provider möglich:
- **Infomaniak** (Genf) — Managed VPS, guter CH-Support
- **Exoscale** (Bern/Zürich) — Cloud/IaaS, Kubernetes-ready
- **Hetzner CH** — Günstig, Datacenter Zürich

Daten bleiben vollständig in der Schweiz. DSG/DSGVO-konform durch eigene Infrastruktur.

## Bekannte Probleme
- Auth/401-Fehler bei Self-Hosted (bekannt seit Mai 2025)
- Docker-Env: Domain/Port müssen explizit konfiguriert werden
- SSO nur Enterprise → Community fordert offenen Zugang
- Google Calendar API: Verifikation für permanenten Zugang problematisch
- Edge-Configs (Reverse Proxy, SSL) nicht offiziell dokumentiert

## Risiken für uns
1. **DevOps-Last:** Setup und Wartung brauchen Know-how oder externen Support
2. **SSO-Lock:** Wenn Praxen mit mehreren Therapeuten SSO brauchen → Enterprise-Kosten
3. **Updates:** AGPL Self-Host bekommt keine managed Updates → eigene CI/CD nötig
4. **Google Calendar:** Integration kann Verifikationshürden haben

## Entscheidung
**Go.** cal.com AGPL Self-Hosted auf CH-Provider. Docker-Deployment, PostgreSQL, Caddy als Reverse Proxy. Enterprise-Upgrade erst bei nachgewiesenem SSO-Bedarf.

## Nächste Schritte
- [ ] Testinstanz auf Infomaniak oder Exoscale aufsetzen
- [ ] Multi-Tenant mit 2–3 Dummy-Therapeuten testen
- [ ] Branding/Customizing evaluieren
- [ ] Google Calendar Integration testen

---
*Quellen: cal.com Docs, GitHub Discussions, Railway Blog, SchedulingKit, WZ-IT (Stand März 2026)*
