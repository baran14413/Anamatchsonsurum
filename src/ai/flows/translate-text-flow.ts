'use server';
/**
 * @fileOverview Metin çevirisi için bir Genkit akışı.
 *
 * - translateText - Metinleri bir dilden diğerine çeviren fonksiyon.
 * - TranslateTextInput - translateText fonksiyonu için giriş tipi.
 * - TranslateTextOutput - translateText fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('Çevrilecek metin.'),
  targetLanguage: z.string().describe('Metnin çevrileceği hedef dil kodu (ör. "en", "tr").'),
  sourceLanguage: z.string().optional().describe('Kaynak metnin dil kodu (isteğe bağlı).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('Çevrilmiş metin.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ text, targetLanguage, sourceLanguage }) => {
    // We will use a simple prompt for translation with Gemini for now
    // as a direct translation API is not available in this context.
    const prompt = `Translate the following text to ${targetLanguage}${sourceLanguage ? ` from ${sourceLanguage}` : ''}. Respond only with the translated text, without any additional explanations or formatting.

Text to translate:
"""
${text}
"""`;

    const { text: translatedText } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash', // Using a powerful model for accurate translation
    });

    if (!translatedText) {
      throw new Error('Translation failed to produce a result.');
    }

    return { translatedText };
  }
);
