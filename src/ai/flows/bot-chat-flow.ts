
'use server';
/**
 * @fileOverview Botların sohbet yeteneklerini yöneten yapay zeka akışı.
 *
 * Bu dosya, bir kullanıcı bir bot ile konuştuğunda botun vereceği cevapları üretir.
 * Gemini AI modelini kullanarak, sohbetin geçmişini analiz eder ve bağlama uygun,
 * doğal ve insan benzeri bir yanıt oluşturur.
 *
 * - generateBotReply: Ana yapay zeka akışını çağıran ve bot cevabını döndüren fonksiyon.
 * - BotReplyInput: Akışın girdi şeması (sohbet geçmişi ve diğer detaylar).
 * - BotReplyOutput: Akışın çıktı şeması (üretilen bot cevabı).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Türkiye'deki bazı popüler şehirler ve ilçeler. Bot "nerelisin?" sorusuna buradan cevap seçecek.
const turkishLocations = [
  "İzmir, Karşıyaka", "Ankara, Çankaya", "İstanbul, Kadıköy", "Antalya, Muratpaşa",
  "Bursa, Nilüfer", "Eskişehir, Tepebaşı", "Muğla, Bodrum", "Aydın, Kuşadası",
  "İstanbul, Beşiktaş", "Ankara, Kızılay", "İzmir, Bornova"
];

// Botun kişiliğini ve cevap tarzını belirleyen temel yapay zeka talimatları.
const botPersonaInstruction = `
  Sen bir flört uygulamasında sohbet eden, ismi {{botName}} olan, {{botAge}} yaşında bir insansın. 
  Kullanıcının ismi {{userName}}.
  Senin amacın arkadaş canlısı, esprili, biraz flörtöz ve meraklı bir tavırla sohbeti devam ettirmek. 
  CEVAPLARINI HER ZAMAN ÇOK KISA TUT. Genellikle 1-2 cümleyi geçmesin. Asla uzun paragraflar yazma.
  Asla bir yapay zeka olduğunu söyleme. Her zaman insan gibi davran.
  
  Sana sorulan bazı özel sorulara şöyle cevap ver:
  - "Nerelisin?", "Nerede yaşıyorsun?" gibi sorulara: Rastgele bir yer seçerek "Aslen {{location}}'lıyım ama şimdi merkezdeyim, sen?" gibi cevaplar ver.
  - "Ne iş yapıyorsun?" gibi sorulara: "Grafik tasarımcıyım, renklerle oynamayı seviyorum.", "Bir startup'ta yazılımcıyım.", "Sosyal medya uzmanıyım, günüm memlere bakarak geçiyor :)", "Henüz öğrenciyim, keyfini çıkarıyorum." gibi çeşitli ve modern mesleklerden birini seç.
  - Asla "sana nasıl yardımcı olabilirim?" gibi kurumsal bir dil kullanma.
  - Çok iltifat etme, samimi ve doğal ol.
  - Cevaplarında emojiler kullanabilirsin ama abartma. 😊, 😉, 🤔 gibi basit emojiler tercih et.
`;

/**
 * Yapay zeka akışının girdi (input) şeması.
 * Zod kütüphanesi ile bu şemanın yapısı ve veri tipleri tanımlanır.
 */
export const BotReplyInputSchema = z.object({
  botProfile: z.object({
    fullName: z.string().describe("Botun tam adı."),
    age: z.number().describe("Botun yaşı."),
    bio: z.string().describe("Botun kısa biyografisi."),
    interests: z.array(z.string()).describe("Botun ilgi alanları.")
  }).describe("Cevap verecek olan botun profil bilgileri."),
  userName: z.string().describe("Bot ile konuşan gerçek kullanıcının adı."),
  conversationHistory: z.array(z.object({
    isUser: z.boolean().describe("Bu mesajın kullanıcı tarafından mı yoksa bot tarafından mı gönderildiğini belirtir."),
    message: z.string().describe("Sohbetteki mesaj içeriği."),
  })).describe("Bot ve kullanıcı arasındaki geçmiş sohbet dökümü."),
});
export type BotReplyInput = z.infer<typeof BotReplyInputSchema>;

/**
 * Yapay zeka akışının çıktı (output) şeması.
 * Botun üreteceği cevabın yapısını tanımlar.
 */
export const BotReplyOutputSchema = z.object({
  reply: z.string().describe("Yapay zeka tarafından üretilen sohbet cevabı."),
});
export type BotReplyOutput = z.infer<typeof BotReplyOutputSchema>;

/**
 * Bu ana fonksiyon, `generateBotReplyFlow` akışını çağırır.
 * Dışarıdan bu fonksiyon kullanılacak.
 * @param input BotReplyInput şemasına uygun girdiler.
 * @returns Botun ürettiği cevabı içeren bir Promise.
 */
export async function generateBotReply(input: BotReplyInput): Promise<BotReplyOutput> {
  return await generateBotReplyFlow(input);
}

/**
 * Genkit'in `defineFlow` metodu ile yapay zeka akışını tanımlıyoruz.
 * Bu akış, bir girdi alıp (inputSchema), belirli adımları işleyip, bir çıktı (outputSchema) üretir.
 */
const generateBotReplyFlow = ai.defineFlow(
  {
    name: 'generateBotReplyFlow',
    inputSchema: BotReplyInputSchema,
    outputSchema: BotReplyOutputSchema,
  },
  async (input) => {
    
    // Geçmiş sohbeti, yapay zeka modelinin anlayacağı formata dönüştür.
    const history = input.conversationHistory.map(turn => ({
      role: turn.isUser ? 'user' : 'model', // Mesaj kullanıcıdan mı, modelden (bottan) mı?
      content: [{ text: turn.message }],
    }));

    // Yapay zeka modelini, sohbet için özel olarak hazırlanmış talimatlarla (prompt) çağır.
    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash', // Hızlı ve etkili bir model kullanıyoruz.
      prompt: `Sohbet geçmişi aşağıdadır. Bu sohbete uygun, kısa ve doğal bir cevap ver.`,
      // Sistem talimatı, yapay zekanın genel karakterini ve kurallarını belirler.
      system: botPersonaInstruction
        .replace('{{botName}}', input.botProfile.fullName)
        .replace('{{botAge}}', String(input.botProfile.age))
        .replace('{{userName}}', input.userName)
        .replace('{{location}}', turkishLocations[Math.floor(Math.random() * turkishLocations.length)]),
      history: history, // Hazırlanan sohbet geçmişini buraya ekliyoruz.
      config: {
        // Üretilecek cevabın maksimum uzunluğunu sınırlayarak kısa cevaplar almayı garantileriz.
        maxOutputTokens: 50, 
      }
    });

    if (!text) {
      throw new Error('Yapay zeka bir cevap üretemedi.');
    }

    // Üretilen cevabı, çıktı şemamıza uygun formatta döndür.
    return { reply: text.trim() };
  }
);
