#!/bin/bash
# Harvey Transkription via whisper.cpp
AUDIO_FILE=$1
if [ -z "$AUDIO_FILE" ]; then
  echo "Verwendung: transcribe.sh <audio-datei>"
  exit 1
fi
~/whisper.cpp/build/bin/whisper-cli \
  -m ~/whisper.cpp/models/ggml-small.bin \
  -f "$AUDIO_FILE" \
  -l de \
  --output-txt \
  -of "${AUDIO_FILE%.*}"
echo "✅ Transkript: ${AUDIO_FILE%.*}.txt"
