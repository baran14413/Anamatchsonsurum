
'use server';
/**
 * @fileOverview A Genkit flow for verifying if two faces are the same person.
 *
 * - verifyFace - A function that compares two images and checks for facial similarity.
 * - VerifyFaceInput - The input type for the verifyFace function.
 * - VerifyFaceOutput - The return type for the verifyFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyFaceInputSchema = z.object({
  profileImageDataUri: z
    .string()
    .describe(
      "The user's main profile picture, as a data URI."
    ),
  cameraFrameDataUri: z
    .string()
    .describe(
      "A live snapshot from the user's camera, as a data URI."
    ),
});
export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isSamePerson: z.boolean().describe('Whether the person in both images is the same.'),
  reason: z.string().describe('A brief explanation for the decision.'),
});
export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(input: VerifyFaceInput): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const verifyFaceFlow = ai.defineFlow(
  {
    name: 'verifyFaceFlow',
    inputSchema: VerifyFaceInputSchema,
    outputSchema: VerifyFaceOutputSchema,
  },
  async ({ profileImageDataUri, cameraFrameDataUri }) => {

    const { output } = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: {
        text: `You are a strict face verification system. Your only task is to determine if the person in the first image (profile photo) is the same person in the second image (live camera photo).
        
        Analyze facial features like eyes, nose, mouth, and face shape. Ignore differences in lighting, background, hair style, or glasses.
        
        Respond with ONLY a JSON object with 'isSamePerson' (boolean) and 'reason' (string). 
        - If they are the same person, set isSamePerson to true.
        - If they are different people, set isSamePerson to false.
        - If you cannot determine (e.g., no clear face in one image), set isSamePerson to false.
        `,
        media: [
            { url: profileImageDataUri },
            { url: cameraFrameDataUri },
        ],
      },
      output: {
        format: 'json',
        schema: VerifyFaceOutputSchema
      },
      config: {
        temperature: 0.0
      }
    });

    if (!output) {
      throw new Error('Face verification failed to produce a result.');
    }
    
    return output;
  }
);
