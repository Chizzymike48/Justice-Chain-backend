/**
 * Voice Recognition Service
 * Handles speech-to-text conversion using Web Speech API
 */

import resolveSpeechLocale from './speechLocale';

export class VoiceRecognitionService {
  private recognition: SpeechRecognitionLike | null = null;
  private isListening: boolean = false;
  private transcript: string = '';

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }
    this.recognition = new SpeechRecognitionCtor();
    this.setupRecognition();
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.language = resolveSpeechLocale('en');

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  public startListening(onResult: (transcript: string, isFinal: boolean) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('Speech Recognition not supported');
      return;
    }

    this.transcript = '';

    this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      const fullTranscript = this.transcript + interim;
      onResult(fullTranscript, event.results[event.results.length - 1].isFinal);
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public getTranscript(): string {
    return this.transcript;
  }

  public setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.language = language;
    }
  }

  public setLanguageByCode(language: string) {
    this.setLanguage(resolveSpeechLocale(language));
  }
}

export default new VoiceRecognitionService();

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
