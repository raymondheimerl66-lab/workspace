# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### 🎙️ Audio Transkription (whisper.cpp)

**Binary:** `/usr/local/bin/whisper`
**Modell:** `~/.local/share/whisper/ggml-base.bin` (147 MB, de/en)
**Workflow:** OGG → ffmpeg (16000Hz WAV) → whisper

```bash
# Konvertierung + Transkription
ffmpeg -i input.ogg -ar 16000 -ac 1 -c:a pcm_s16le /tmp/audio.wav
whisper /tmp/audio.wav -m ~/.local/share/whisper/ggml-base.bin --language de -np
```

---

Add whatever helps you do your job. This is your cheat sheet.
