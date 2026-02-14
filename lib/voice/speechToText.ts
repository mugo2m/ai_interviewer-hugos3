// lib/voice/speechToText.ts - COMPLETE FIXED VERSION
"use client";

import { SpeechToTextEvents } from "./types";

export class SpeechToText {
  private recognition: any = null;
  private isListening: boolean = false;
  private isPaused: boolean = false;
  private transcript: string = "";
  private finalTranscript: string = "";
  private interimTranscript: string = "";
  private lastSpeechTimestamp: number = 0;
  private speechTimeout: NodeJS.Timeout | null = null;
  private maxSilenceDuration: number = 20000;
  private _interviewMode: boolean = true;
  private manualStop: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 10;
  private permissionGranted: boolean = false;

  private events: SpeechToTextEvents = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeRecognition();
    }
  }

  private initializeRecognition(): void {
    try {
      // Get the SpeechRecognition constructor
      const SpeechRecognition = (window as any).SpeechRecognition ||
                               (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error("❌ SpeechRecognition: API not available");
        this.events.onError?.("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      // Create recognition instance
      this.recognition = new SpeechRecognition();

      // Configure for best performance
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;

      console.log("✅ SpeechRecognition: Initialized successfully", {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang
      });

      this.setupEventHandlers();

      // Check permissions immediately
      this.checkMicrophonePermissions();

    } catch (error) {
      console.error("❌ SpeechRecognition: Failed to initialize:", error);
      this.events.onError?.("Failed to initialize speech recognition");
    }
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    // FIXED: Proper onstart handler
    this.recognition.onstart = () => {
      console.log("✅✅✅ SpeechRecognition: STARTED - Microphone is ACTIVE");
      this.isListening = true;
      this.manualStop = false;
      this.restartAttempts = 0;
      this.lastSpeechTimestamp = Date.now();
      this.events.onStart?.();
      this.startSpeechTimeout();
    };

    // FIXED: Better result handling
    this.recognition.onresult = (event: any) => {
      console.log("📢 SpeechRecognition: Received audio data", {
        resultIndex: event.resultIndex,
        resultCount: event.results.length
      });

      this.lastSpeechTimestamp = Date.now();

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          console.log(`✅ FINAL: "${transcript}" (${Math.round(confidence * 100)}% confidence)`);
        } else {
          interimTranscript += transcript;
          console.log(`🟡 INTERIM: "${transcript}"`);
        }
      }

      // Update final transcript
      if (finalTranscript) {
        this.finalTranscript = finalTranscript;
        this.transcript = this.finalTranscript;
        this.events.onTranscript?.(finalTranscript, true);
      }

      // Update interim transcript (REAL-TIME)
      if (interimTranscript) {
        this.interimTranscript = interimTranscript;
        this.transcript = this.interimTranscript;
        this.events.onTranscript?.(interimTranscript, false);
      }

      // FIXED: Force update even with short utterances
      if (!finalTranscript && !interimTranscript && event.results.length > 0) {
        const fallback = event.results[0][0].transcript;
        if (fallback) {
          console.log(`⚠️ FALLBACK: "${fallback}"`);
          this.transcript = fallback;
          this.events.onTranscript?.(fallback, false);
        }
      }
    };

    // FIXED: Better error handling
    this.recognition.onerror = (event: any) => {
      console.log("❌ SpeechRecognition: Error event:", event.error);

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          this.permissionGranted = false;
          this.events.onError?.("Microphone access denied. Please allow microphone access in your browser settings.");
          this.events.onPermissionChange?.(false);
          this.manualStop = true;
          break;

        case 'no-speech':
          console.log("🔇 No speech detected - still listening");
          this.events.onTimeout?.();
          break;

        case 'audio-capture':
          this.events.onError?.("No microphone found. Please connect a microphone.");
          break;

        case 'network':
          this.events.onError?.("Network error. Please check your internet connection.");
          break;

        case 'aborted':
          console.log("⏹️ Recognition aborted (normal)");
          break;

        case 'language-not-supported':
          this.events.onError?.("Language not supported. Using en-US.");
          this.setLanguage("en-US");
          break;

        default:
          console.warn("⚠️ Unknown error:", event.error);
      }
    };

    // FIXED: Auto-restart with backoff
    this.recognition.onend = () => {
      console.log("🛑 SpeechRecognition: ENDED", {
        isListening: this.isListening,
        manualStop: this.manualStop,
        interviewMode: this._interviewMode,
        restartAttempts: this.restartAttempts
      });

      this.isListening = false;
      this.clearSpeechTimeout();
      this.events.onEnd?.();

      // Auto-restart for interview mode
      if (this._interviewMode && !this.manualStop && this.restartAttempts < this.maxRestartAttempts) {
        this.restartAttempts++;
        const delay = Math.min(500 * this.restartAttempts, 3000);
        console.log(`🔄 Auto-restarting in ${delay}ms (attempt ${this.restartAttempts}/${this.maxRestartAttempts})...`);

        setTimeout(() => {
          if (this._interviewMode && !this.manualStop) {
            this.start().catch(e => {
              console.log("❌ Auto-restart failed:", e);
            });
          }
        }, delay);
      }
    };

    // FIXED: Sound detection for debugging
    this.recognition.onsoundstart = () => {
      console.log("🔊🔊🔊 SOUND DETECTED - Microphone is receiving audio!");
      this.lastSpeechTimestamp = Date.now();
    };

    this.recognition.onsoundend = () => {
      console.log("🔇 Sound ended");
    };

    this.recognition.onspeechstart = () => {
      console.log("🗣️ Speech start detected");
    };

    this.recognition.onspeechend = () => {
      console.log("🤚 Speech end detected");
    };

    this.recognition.onaudiostart = () => {
      console.log("🎵 Audio stream started");
    };

    this.recognition.onaudioend = () => {
      console.log("🎵 Audio stream ended");
    };
  }

  private startSpeechTimeout(): void {
    this.clearSpeechTimeout();
    this.speechTimeout = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTimestamp;
      if (timeSinceLastSpeech > this.maxSilenceDuration && this.isListening) {
        console.log(`⏰ No speech for ${this.maxSilenceDuration / 1000} seconds`);
        this.events.onTimeout?.();
      }
    }, 1000);
  }

  private clearSpeechTimeout(): void {
    if (this.speechTimeout) {
      clearInterval(this.speechTimeout);
      this.speechTimeout = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // FIXED: Start with better error recovery
  async start(): Promise<void> {
    console.log("🎤 SpeechRecognition: START command received");

    return new Promise(async (resolve, reject) => {
      if (!this.recognition) {
        this.initializeRecognition();
        await this.delay(500);
        if (!this.recognition) {
          reject(new Error("Speech recognition not available"));
          return;
        }
      }

      // Check permissions first
      const hasPermission = await this.checkMicrophonePermissions();
      if (!hasPermission) {
        this.events.onError?.("Microphone access denied. Please allow access in browser settings.");
        reject(new Error("Microphone permission denied"));
        return;
      }

      // Stop if already listening
      if (this.isListening) {
        console.log("⚠️ Already listening, stopping first");
        this.stop();
        await this.delay(500);
      }

      this.manualStop = false;

      try {
        // Set up start handler
        const startHandler = () => {
          console.log("✅✅✅ SpeechRecognition: Successfully started!");
          this.isListening = true;
          this.events.onStart?.();
          resolve();
        };

        this.recognition.onstart = startHandler;

        // Start recognition
        await this.recognition.start();
        console.log("🎤 Start command sent to browser");

      } catch (error: any) {
        console.error("❌ Failed to start:", error);

        if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
          console.log("⚠️ Already started, stopping and retrying...");
          this.stop();
          await this.delay(500);
          try {
            await this.recognition.start();
            resolve();
          } catch (retryError) {
            reject(retryError);
          }
        } else {
          reject(error);
        }
      }
    });
  }

  // FIXED: Stop with proper cleanup
  stop(): void {
    console.log("🛑 SpeechRecognition: STOP command received");
    this.manualStop = true;
    this.restartAttempts = this.maxRestartAttempts;

    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log("✅ Stop command sent");
      } catch (error) {
        console.warn("⚠️ Error stopping:", error);
      }
    }

    this.isListening = false;
    this.isPaused = false;
    this.clearSpeechTimeout();
  }

  pause(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isPaused = true;
        this.clearSpeechTimeout();
        console.log("⏸️ Paused");
      } catch (error) {
        console.warn("⚠️ Error pausing:", error);
      }
    }
  }

  resume(): void {
    if (this.recognition && this.isPaused) {
      try {
        this.recognition.start();
        this.isPaused = false;
        this.manualStop = false;
        this.startSpeechTimeout();
        console.log("▶️ Resumed");
      } catch (error) {
        console.warn("⚠️ Error resuming:", error);
      }
    }
  }

  // ============ SETTINGS ============

  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
      console.log("🌐 Language set to", language);
    }
  }

  setInterviewMode(enabled: boolean): void {
    this._interviewMode = enabled;
    if (enabled) {
      this.maxSilenceDuration = 20000;
      this.maxRestartAttempts = 10;
      this.setLanguage("en-US");
      console.log("🎤 Interview mode enabled");
    }
  }

  // ============ EVENT HANDLERS ============

  onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.events.onTranscript = callback;
  }

  onError(callback: (error: string) => void): void {
    this.events.onError = callback;
  }

  onStart(callback: () => void): void {
    this.events.onStart = callback;
  }

  onEnd(callback: () => void): void {
    this.events.onEnd = callback;
  }

  onTimeout(callback: () => void): void {
    this.events.onTimeout = callback;
  }

  onPermissionChange(callback: (granted: boolean) => void): void {
    this.events.onPermissionChange = callback;
  }

  // ============ UTILITY METHODS ============

  getTranscript(): string {
    return this.transcript;
  }

  getFinalTranscript(): string {
    return this.finalTranscript;
  }

  getInterimTranscript(): string {
    return this.interimTranscript;
  }

  clearTranscript(): void {
    this.transcript = "";
    this.finalTranscript = "";
    this.interimTranscript = "";
    console.log("🧹 Transcript cleared");
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  // FIXED: More reliable permission check
  async checkMicrophonePermissions(): Promise<boolean> {
    try {
      console.log("🎤 Checking microphone permissions...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Stop all tracks
      stream.getTracks().forEach(track => {
        console.log(`🎤 Microphone track: ${track.label}`, {
          enabled: track.enabled,
          readyState: track.readyState
        });
        track.stop();
      });

      console.log("✅✅✅ Microphone permission GRANTED - Audio hardware is working");
      this.permissionGranted = true;
      this.events.onPermissionChange?.(true);
      return true;

    } catch (error: any) {
      console.error("❌ Microphone permission DENIED:", error.name, error.message);
      this.permissionGranted = false;
      this.events.onPermissionChange?.(false);

      let errorMessage = "Microphone access denied";
      if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is in use by another application.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone permission blocked. Please allow access in browser settings.";
      }

      this.events.onError?.(errorMessage);
      return false;
    }
  }

  // FIXED: Force microphone test
  async testMicrophone(): Promise<boolean> {
    return this.checkMicrophonePermissions();
  }

  destroy(): void {
    console.log("🧹 Destroying SpeechRecognition");
    this.stop();
    this.recognition = null;
    this.events = {};
    this.clearSpeechTimeout();
  }
}

export default SpeechToText;