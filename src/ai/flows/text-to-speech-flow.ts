
'use server';
/**
 * @fileOverview A Genkit flow to convert text into speech with multiple speakers.
 *
 * - textToSpeech - A function that takes text and returns a Data URI for the audio.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';
import {googleAI} from '@genkit-ai/googleai';

// Define the input and output schemas
const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech. It should contain speaker labels like "Agent (Male):" and "Customer (Female):".'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a WAV Data URI."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// Helper function to convert raw PCM audio buffer to a Base64-encoded WAV string
async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });

    const chunks: Buffer[] = [];
    writer.on('data', (chunk) => chunks.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}

// Main Genkit flow
const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text }) => {
    // Modify the text to fit the multi-speaker format expected by the model.
    // The model expects speakers to be labeled like "Speaker 1:", "Speaker 2:", etc.
    const ttsPrompt = text
      .replace(/Agent.*?:\s/g, 'Speaker 1: ')
      .replace(/Customer.*?:/g, 'Speaker 2:');

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Onyx' } } }, // Agent voice (Male)
              { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Nova' } } },  // Customer voice (Female)
            ],
          },
        },
      },
      prompt: ttsPrompt,
    });

    if (!media || !media.url) {
      throw new Error('No audio media was returned from the AI model.');
    }

    // The returned URL is a data URI with base64 encoded PCM data
    const pcmBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    
    // Convert the PCM buffer to a WAV base64 string
    const wavBase64 = await toWav(pcmBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
