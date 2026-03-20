#!/usr/bin/env python3
"""
POC: Audio-Zusammenfassung für Therapeuten
Workflow: Audio → Whisper → LLM-Zusammenfassung

Setup:
    pip install openai requests
    
    ODER lokales Setup:
    - whisper.cpp kompiliert (bereits vorhanden)
    - Ollama für lokales LLM
"""

import subprocess
import json
import os
import sys
from pathlib import Path

# Konfiguration
WHISPER_BIN = "/usr/local/bin/whisper"
WHISPER_MODEL = os.path.expanduser("~/.local/share/whisper/ggml-base.bin")
OLLAMA_URL = "http://localhost:11434/api/generate"


def transcribe_audio(audio_path: str) -> str:
    """
    Transkribiert Audio mit whisper.cpp
    """
    # Konvertiere zu WAV falls nötig
    wav_path = "/tmp/poc_audio.wav"
    
    if not audio_path.endswith('.wav'):
        subprocess.run([
            "ffmpeg", "-y", "-i", audio_path,
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
            wav_path
        ], capture_output=True, check=True)
    else:
        wav_path = audio_path
    
    # Whisper Transkription
    result = subprocess.run(
        [WHISPER_BIN, wav_path, "-m", WHISPER_MODEL, "--language", "de", "-np"],
        capture_output=True,
        text=True
    )
    
    # Extrahiere Text aus Output
    transcript = ""
    for line in result.stdout.split('\n'):
        if ']' in line:
            # Format: [00:00:00.000 --> 00:00:05.000]   Text hier
            text_part = line.split(']')[-1].strip()
            transcript += text_part + " "
    
    return transcript.strip()


def summarize_with_ollama(transcript: str, template: str = "standard") -> str:
    """
    Erstellt Zusammenfassung mit lokalem LLM via Ollama
    """
    
    prompts = {
        "standard": f"""Fasse die folgende Therapiesitzung zusammen:

{transcript}

Erstelle eine strukturierte Zusammenfassung mit:
1. Hauptthemen
2. Patientenstimmung
3. Wichtige Erkenntnisse
4. Nächste Schritte

Zusammenfassung:""",
        
        "kurz": f"""Fasse in 3 Sätzen zusammen: {transcript}""",
        
        "bullet": f"""Erstelle Bullet-Points aus dieser Sitzung:

{transcript}
"""
    }
    
    prompt = prompts.get(template, prompts["standard"])
    
    # Ollama API Call
    try:
        import requests
        response = requests.post(OLLAMA_URL, json={
            "model": "llama3.2",  # oder anderes Modell
            "prompt": prompt,
            "stream": False
        })
        
        if response.status_code == 200:
            return response.json().get("response", "Keine Zusammenfassung erstellt")
        else:
            return f"Fehler: {response.status_code}"
    
    except Exception as e:
        return f"Fehler bei Ollama: {str(e)}\n\n(Bitte stelle sicher, dass Ollama läuft: 'ollama serve')"


def summarize_with_openrouter(transcript: str, api_key: str) -> str:
    """
    Alternative: Zusammenfassung via OpenRouter API
    """
    import requests
    
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openrouter/moonshotai/kimi-k2.5",
            "messages": [
                {
                    "role": "system",
                    "content": "Du bist ein Assistent für Therapeuten. Fasse Sitzungen professionell und prägnant zusammen."
                },
                {
                    "role": "user",
                    "content": f"Fasse diese Therapiesitzung zusammen:\n\n{transcript}"
                }
            ]
        }
    )
    
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"API Fehler: {response.status_code}"


def main():
    """
    CLI Interface
    """
    if len(sys.argv) < 2:
        print("Usage: python audio_summary_poc.py <audio_file> [template]")
        print("Templates: standard, kurz, bullet")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    template = sys.argv[2] if len(sys.argv) > 2 else "standard"
    
    print("🎙️  Transkribiere Audio...")
    print("-" * 50)
    
    transcript = transcribe_audio(audio_file)
    print(f"📝 Transkription:\n{transcript}\n")
    
    print("🤖 Erstelle Zusammenfassung...")
    print("-" * 50)
    
    # Versuche lokales Ollama
    summary = summarize_with_ollama(transcript, template)
    print(f"📋 Zusammenfassung:\n{summary}")


if __name__ == "__main__":
    main()
