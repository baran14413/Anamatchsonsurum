
'use server';
/**
 * @fileOverview Cinsiyet doğrulaması için bir Genkit akışı.
 *
 * - verifyGender - Bir kullanıcının beyan ettiği cinsiyetin profil fotoğraflarıyla tutarlı olup olmadığını kontrol eder.
 * - VerifyGenderInput - verifyGender fonksiyonu için giriş tipi.
 * - VerifyGenderOutput - verifyGender fonksiyonu için dönüş tipi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyGenderInputSchema = z.object({
  declaredGender: z.string().describe("Kullanıcının beyan ettiği cinsiyet ('male' veya 'female')."),
  imageUrls: z.array(z.string()).describe("Kullanıcının profil fotoğraflarının URL'lerinin bir listesi."),
});
export type VerifyGenderInput = z.infer<typeof VerifyGenderInputSchema>;

const VerifyGenderOutputSchema = z.object({
  isConsistent: z.boolean().describe('Fotoğraflardaki kişinin görünümünün beyan edilen cinsiyetle tutarlı olup olmadığı.'),
  reason: z.string().describe('Kararın kısa bir açıklaması.'),
});
export type VerifyGenderOutput = z.infer<typeof VerifyGenderOutputSchema>;

export async function verifyGender(input: VerifyGenderInput): Promise<VerifyGenderOutput> {
  return verifyGenderFlow(input);
}

const verifyGenderFlow = ai.defineFlow(
  {
    name: 'verifyGenderFlow',
    inputSchema: VerifyGenderInputSchema,
    outputSchema: VerifyGenderOutputSchema,
  },
  async ({ declaredGender, imageUrls }) => {

    const mediaParts = imageUrls.map(url => ({ media: { url } }));

    const { output } = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: [
        {
          text: `You are a strict gender verification system for a dating app. Your task is to determine if the person in the provided images appears consistent with the declared gender: "${declaredGender}".

        Analyze facial features, body shape, and overall presentation across all images. Do not make assumptions based on clothing, hair style, or makeup alone. Focus on biological and generally accepted visual gender cues.
        
        Respond with ONLY a JSON object with 'isConsistent' (boolean) and 'reason' (string).
        - If the person in the photos is visually consistent with the declared gender, set isConsistent to true.
        - If the person in the photos is NOT visually consistent with the declared gender, set isConsistent to false.
        - If you cannot determine (e.g., no clear person, ambiguous features, non-human subject), set isConsistent to false.
        `
        },
        ...mediaParts,
      ],
      output: {
        format: 'json',
        schema: VerifyGenderOutputSchema
      },
      config: {
        temperature: 0.0
      }
    });

    if (!output) {
      throw new Error('Gender verification failed to produce a result.');
    }
    
    return output;
  }
);
