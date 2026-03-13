/**
 * Text-to-Speech Service
 * Handles text-to-speech conversion using Web Speech API
 */

import resolveSpeechLocale from './speechLocale';

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null;
  private isPlaying: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private preferredLanguage: string | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        if (this.preferredLanguage) {
          this.selectVoiceForLanguage(this.preferredLanguage);
        }
      };
    }
  }

  public speak(text: string, onEnd?: () => void, onError?: (error: string) => void): void {
    if (!this.synthesis) {
      onError?.('Text-to-Speech not supported');
      return;
    }
    if (!text || !text.trim()) {
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredLanguage) {
      utterance.lang = this.preferredLanguage;
    }
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    utterance.rate = 1.0; // Speed
    utterance.pitch = 1.0; // Pitch
    utterance.volume = 1.0; // Volume

    utterance.onstart = () => {
      this.isPlaying = true;
    };

    utterance.onend = () => {
      this.isPlaying = false;
      onEnd?.();
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      this.isPlaying = false;
      onError?.(event.error);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  public pause(): void {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.pause();
    }
  }

  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
    }
  }

  public isPlaying_(): boolean {
    return this.isPlaying;
  }

  public setRate(rate: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.rate = Math.max(0.1, Math.min(10, rate));
    }
  }

  public setPitch(pitch: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.pitch = Math.max(0, Math.min(2, pitch));
    }
  }

  public setVolume(volume: number): void {
    if (this.currentUtterance) {
      this.currentUtterance.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  public setVoice(voiceIndex: number): void {
    const voices = this.getVoices();
    if (this.currentUtterance && voices[voiceIndex]) {
      this.currentUtterance.voice = voices[voiceIndex];
    }
  }

  public setLanguage(language: string): void {
    const locale = resolveSpeechLocale(language);
    this.preferredLanguage = locale;
    this.selectVoiceForLanguage(locale);
  }

  private selectVoiceForLanguage(locale: string): void {
    const voices = this.getVoices();
    if (!voices.length) {
      return;
    }
    const normalized = locale.toLowerCase();
    const exactMatch = voices.find((voice) => voice.lang?.toLowerCase() === normalized) || null;
    if (exactMatch) {
      this.preferredVoice = exactMatch;
      return;
    }
    const prefix = normalized.split('-')[0];
    const prefixMatch = voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix)) || null;
    this.preferredVoice = prefixMatch;
  }
}

export default new TextToSpeechService();
