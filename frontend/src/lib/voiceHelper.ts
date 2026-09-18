export interface VoiceSettings {
  voiceURI: string;
  pitch: number;
  rate: number;
}

export const getSavedVoiceSettings = (): VoiceSettings => {
  if (typeof window === "undefined") return { voiceURI: "", pitch: 1.0, rate: 1.0 };
  try {
    const saved = localStorage.getItem("project_access_voice_settings");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { voiceURI: "", pitch: 1.0, rate: 1.0 };
};

export const saveVoiceSettings = (settings: VoiceSettings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("project_access_voice_settings", JSON.stringify(settings));
  } catch {}
};

export const stopActiveAudio = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

export const detectTextLangCode = (text: string): string => {
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN"; // Hindi / Marathi / Devanagari
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN"; // Telugu
  if (/[\u0980-\u09FF]/.test(text)) return "bn-IN"; // Bengali
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN"; // Gujarati
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa-IN"; // Punjabi
  if (/[\u0600-\u06FF]/.test(text)) return "ur-PK"; // Urdu / Arabic
  if (/[\u0400-\u04FF]/.test(text)) return "ru-RU"; // Russian / Cyrillic
  return "en-IN";
};

export const playAudioOrSpeech = ({
  text,
  onProgress,
  onEnd,
  onError,
}: {
  text: string;
  onProgress: (charIndex: number) => void;
  onEnd: () => void;
  onError?: () => void;
}) => {
  stopActiveAudio();

  const cleanText = text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*+/g, "")
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  if (!cleanText) {
    onEnd();
    return;
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onError) onError();
    onEnd();
    return;
  }

  const settings = getSavedVoiceSettings();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = window.speechSynthesis.getVoices();

  const langCode = detectTextLangCode(cleanText);
  utterance.lang = langCode;

  if (voices.length > 0) {
    let matchedVoice = null;
    if (settings.voiceURI) {
      matchedVoice = voices.find(
        (v) => v.voiceURI === settings.voiceURI || v.name === settings.voiceURI
      );
    }
    if (!matchedVoice && langCode !== "en-IN") {
      const prefix = langCode.slice(0, 2);
      matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    }
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.pitch = settings.pitch ?? 1.0;
  utterance.rate = settings.rate ?? 1.0;

  utterance.onboundary = (event: any) => {
    if (event.name === "word" || !event.name) {
      const idx = event.charIndex + (event.charLength || 0);
      onProgress(idx);
    }
  };

  utterance.onend = () => {
    onProgress(cleanText.length);
    onEnd();
  };

  utterance.onerror = () => {
    if (onError) onError();
    onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
