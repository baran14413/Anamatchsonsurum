
'use server';
/**
 * @fileOverview Generates a daily quote about relationships or dating.
 *
 * - getDailyQuote - A function that returns a witty, motivational, or thought-provoking quote.
 * - DailyQuoteOutput - The return type for the getDailyQuote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyQuoteOutputSchema = z.object({
  quote: z.string().describe('The generated quote.'),
});
export type DailyQuoteOutput = z.infer<typeof DailyQuoteOutputSchema>;

// This function can be called from server components to get the daily quote.
// Caching is handled automatically by Next.js for server-side fetches.
export async function getDailyQuote(): Promise<DailyQuoteOutput> {
  // By not passing any dynamic input, we signal that the output can be cached.
  // We will revalidate this data periodically (e.g., once a day).
  return dailyQuoteFlow();
}

const dailyQuoteFlow = ai.defineFlow(
  {
    name: 'dailyQuoteFlow',
    inputSchema: z.void(),
    outputSchema: DailyQuoteOutputSchema,
  },
  async () => {
    const { text: generatedQuote } = await ai.generate({
      prompt: `Generate a single, short (1-2 sentences), witty, motivational, or thought-provoking quote or tip about modern dating, relationships, or making new connections. The tone should be encouraging and slightly playful. Do not include quotation marks. Respond only with the quote itself.`,
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: 0.9, // Higher temperature for more creative/varied responses
      },
    });

    if (!generatedQuote) {
      throw new Error('Failed to generate a daily quote.');
    }

    return { quote: generatedQuote.trim() };
  }
);
