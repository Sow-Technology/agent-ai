
'use server';
/**
 * @fileOverview An AI flow to generate a QA Parameter Campaign from an SOP.
 *
 * - generateParametersFromSop - A function that takes SOP content and returns a structured QA Parameter campaign.
 * - GenerateParametersFromSopInput - The input type for the flow.
 * - GenerateParametersFromSopOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const IndividualParameterItemSchema = z.object({
  name: z.string().describe('The name of the audit parameter.'),
  weight: z.number().min(0).max(100).describe('The weight of this parameter (0-100).'),
});

const GenerateParametersFromSopInputSchema = z.object({
  title: z.string().describe("The title of the Standard Operating Procedure (SOP)."),
  content: z.string().min(10).describe("The full content of the SOP."),
});
export type GenerateParametersFromSopInput = z.infer<typeof GenerateParametersFromSopInputSchema>;

const GenerateParametersFromSopOutputSchema = z.object({
  name: z.string().describe("A concise and relevant name for the generated QA Parameter Campaign, based on the SOP title."),
  description: z.string().describe("A brief description of what this QA campaign audits, based on the SOP content."),
  items: z.array(IndividualParameterItemSchema).min(1).describe("An array of parameter items. The sum of all weights MUST be exactly 100."),
});
export type GenerateParametersFromSopOutput = z.infer<typeof GenerateParametersFromSopOutputSchema>;

export async function generateParametersFromSop(input: GenerateParametersFromSopInput): Promise<GenerateParametersFromSopOutput> {
  return generateParametersFromSopFlow(input);
}

const generationPrompt = ai.definePrompt({
  name: 'generateParametersFromSopPrompt',
  input: {schema: GenerateParametersFromSopInputSchema},
  output: {schema: GenerateParametersFromSopOutputSchema},
  prompt: `You are an expert QA Manager responsible for creating effective audit campaigns.
Based on the provided Standard Operating Procedure (SOP) title and content, your task is to generate a complete QA Parameter Campaign.

**Instructions:**
1.  Read the SOP Title and Content carefully to understand the process.
2.  Create a concise and descriptive 'name' for this new QA Campaign. It should clearly reflect the SOP's purpose.
3.  Write a brief 'description' for the campaign that summarizes what is being evaluated.
4.  Identify the key steps, critical quality points, and mandatory actions from the SOP content.
5.  Convert these key points into a list of specific, measurable 'items' for the audit. Each item should have a 'name' and a 'weight'.
6.  Assign a 'weight' to each parameter item based on its importance in the process. More critical steps should have higher weights.
7.  **Crucially, the sum of all 'weight' values in the 'items' array MUST equal exactly 100.** Distribute the weights logically.

**SOP Title:**
{{{title}}}

**SOP Content:**
{{{content}}}

Now, generate the QA Parameter Campaign in the required JSON format.
`,
});

const generateParametersFromSopFlow = ai.defineFlow(
  {
    name: 'generateParametersFromSopFlow',
    inputSchema: GenerateParametersFromSopInputSchema,
    outputSchema: GenerateParametersFromSopOutputSchema,
  },
  async (input) => {
    const {output} = await generationPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid QA campaign.');
    }

    // Post-processing to ensure weights sum to 100, as the model can sometimes be slightly off.
    const totalWeight = output.items.reduce((sum, item) => sum + item.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01 && output.items.length > 0) {
        const adjustmentFactor = 100 / totalWeight;
        let runningTotal = 0;
        for (let i = 0; i < output.items.length - 1; i++) {
            const adjustedWeight = Math.round(output.items[i].weight * adjustmentFactor);
            output.items[i].weight = adjustedWeight;
            runningTotal += adjustedWeight;
        }
        output.items[output.items.length - 1].weight = 100 - runningTotal;
    }

    return output;
  }
);
