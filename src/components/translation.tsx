"use client";

import { useState, useEffect } from "react";
import { translateText } from "@/ai/flows/translate-text-flow";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface TranslationProps {
  text: string;
  sourceLanguage: string;
}

export function Translation({ text, sourceLanguage }: TranslationProps) {
  const [browserLanguage, setBrowserLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    // This effect runs only on the client-side
    const lang = navigator.language.split("-")[0];
    setBrowserLanguage(lang);
  }, []);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      if (!translatedText) {
        const result = await translateText({
          text,
          targetLanguage: browserLanguage,
          sourceLanguage,
        });
        setTranslatedText(result.translatedText);
      }
      setShowOriginal(false);
    } catch (error) {
      console.error("Translation failed:", error);
      // Optional: show a toast notification to the user
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowOriginal = () => {
    setShowOriginal(true);
  };
  
  const needsTranslation = sourceLanguage !== browserLanguage;

  if (!needsTranslation) {
    return <span>{text}</span>;
  }

  const currentText = showOriginal || !translatedText ? text : translatedText;
  
  return (
    <div>
      <span>{currentText}</span>
      <div className="mt-2">
        {isTranslating ? (
           <div className="flex items-center text-sm text-muted-foreground">
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             Çevriliyor...
           </div>
        ) : (
          showOriginal || !translatedText ? (
            <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={handleTranslate}>
              Çevirisine bak
            </Button>
          ) : (
            <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={handleShowOriginal}>
              Orijinalini gör
            </Button>
          )
        )}
      </div>
    </div>
  );
}
