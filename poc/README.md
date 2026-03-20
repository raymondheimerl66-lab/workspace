# POC: Audio-Zusammenfassung

## Was ist das?
Proof-of-Concept für die Audio-Zusammenfassungs-Funktion, die Ray in seiner Audio-Nachricht (20.03. 13:42) beschrieben hat.

## Funktion
```
Audio-Upload → Whisper Transkription → LLM Zusammenfassung
```

## Setup

### 1. Voraussetzungen (bereits installiert)
- `whisper` (whisper.cpp binary)
- `ffmpeg` (Audio-Konvertierung)
- Whisper Model: `~/.local/share/whisper/ggml-base.bin`

### 2. Option A: Lokales LLM (empfohlen)
```bash
# Ollama installieren
curl -fsSL https://ollama.com/install.sh | sh

# Modell herunterladen
ollama pull llama3.2

# Server starten
ollama serve
```

### 3. Option B: OpenRouter API
```bash
export OPENROUTER_API_KEY="dein-key"
```

## Usage

```bash
cd /Users/harvey/.openclaw/workspace/poc

# Mit Standard-Zusammenfassung
python3 audio_summary_poc.py /pfad/zu/audio.ogg

# Mit kurzer Zusammenfassung
python3 audio_summary_poc.py /pfad/zu/audio.ogg kurz

# Als Bullet-Points
python3 audio_summary_poc.py /pfad/zu/audio.ogg bullet
```

## Templates

| Template | Beschreibung |
|----------|--------------|
| `standard` | Strukturierte Zusammenfassung mit Hauptthemen, Stimmung, Erkenntnisse, nächste Schritte |
| `kurz` | 3-Satz Zusammenfassung |
| `bullet` | Bullet-Point Liste |

## Integration ins CRM

Später soll dies in das Dashboard integriert werden:
1. Audio-Upload im Patienten-Profil
2. Automatische Transkription
3. LLM-Zusammenfassung
4. Speicherung in `transcriptions` Tabelle
5. Verknüpfung mit Sitzung

## Dateien
- `audio_summary_poc.py` - Hauptskript
- Siehe auch: `../research/opensource_stack.md` für Gesamt-Architektur
