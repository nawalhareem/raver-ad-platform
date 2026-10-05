"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Custom hook for Text-to-Speech using backend ElevenLabs API.
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechIdRef = useRef<number>(0);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      speechIdRef.current++; 
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, []);

  const speak = useCallback(async (text: string, voiceId: string = "EXAVITQu4vr4xnSDxMaL") => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    const currentSpeechId = ++speechIdRef.current;

    // Robust cleaning for natural speech
    let cleanText = text
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`[^`]*?`/g, "")       // Remove inline code
      .replace(/<[^>]*>?/gm, "")      // Remove HTML tags
      .replace(/\[.*?\]/g, "")         // Remove brackets like [IMAGE]
      .replace(/\(\d+:\d+\)/g, "")     // Remove aspect ratios like (9:16)
      .replace(/[*_#`~]/g, " ")         // Replace markdown symbols with spaces
      .replace(/["'()]/g, "")          // Strip quotes and parentheses for smoother flow
      .replace(/^[\s]*[-+*][\s]+/gm, " ") // Remove bullet points
      .replace(/^[\s]*\d+\.[\s]+/gm, " ") // Remove numbered list markers
      .replace(/\n+/g, " ")            // Replace newlines with spaces
      .replace(/\s+/g, " ")            // Normalize spaces
      .trim();

    // Final punctuation cleanup
    cleanText = cleanText
      .replace(/[:]\s+\./g, ":")
      .replace(/\s+\./g, ".")
      .replace(/\.\./g, ".");

    if (!cleanText) return;

    setIsLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://apiplatform.raver.ai/api";
      const response = await apiFetch(`${API_BASE}/voice/generate-tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice_id: voiceId })
      });

      if (currentSpeechId !== speechIdRef.current) return;

      if (!response.ok) {
        throw new Error("Failed to generate TTS");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (currentSpeechId !== speechIdRef.current) return;

      audioRef.current.src = url;
      
      audioRef.current.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
      };

      await audioRef.current.play();

    } catch (error) {
      console.error("[TTS] Error:", error);
      if (currentSpeechId === speechIdRef.current) {
        setIsSpeaking(false);
        setIsLoading(false);
      }
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    isSupported,
    isMuted,
    setIsMuted
  };
}




