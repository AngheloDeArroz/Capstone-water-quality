
'use server';
/**
 * @fileOverview Provides AI-driven insights based on historical RRJ Aquatique data.
 *
 * - getHistoryInsights - A function that analyzes historical data to provide recommendations and container level estimations.
 * - HistoryInsightsInput - The input type for the getHistoryInsights function.
 * - HistoryInsightsOutput - The return type for the getHistoryInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the structure for a single day's historical entry
const HistoricalEntrySchema = z.object({
  date: z.string().describe('The date of the historical entry (e.g., "Jun 20th, 2023").'),
  waterQuality: z.object({
    temp: z.string().describe('Average temperature in °C.'),
    turbidity: z.string().describe('Average turbidity in NTU.'),
    ph: z.string().describe('Average pH level.'),
  }),
  feedingSchedules: z.array(z.string()).describe('List of feeding times for the day (e.g., ["08:00", "18:00"]). Empty if no feeding occurred.'),
  phBalancerTriggered: z.boolean().describe('Whether the pH balancer was triggered on this day.'),
  isAutoFeedingEnabledToday: z.boolean().optional().describe('Whether automated feeding was enabled on this day. If undefined, it means not recorded.'),
  isAutoPhEnabledToday: z.boolean().optional().describe('Whether automated pH balancing was enabled on this day. If undefined, it means not recorded.'),
  foodLevelStartOfDay: z.number().optional().describe('Food container percentage at the start of the day (0-100). If undefined, it means not recorded.'),
  foodLevelEndOfDay: z.number().optional().describe('Food container percentage at the end of the day (0-100). If undefined, it means not recorded.'),
  phSolutionLevelStartOfDay: z.number().optional().describe('pH solution container percentage at the start of the day (0-100). If undefined, it means not recorded.'),
  phSolutionLevelEndOfDay: z.number().optional().describe('pH solution container percentage at the end of the day (0-100). If undefined, it means not recorded.'),
});
type HistoricalEntry = z.infer<typeof HistoricalEntrySchema>;


const HistoryInsightsInputSchema = z.object({
  historicalData: z.array(HistoricalEntrySchema).describe('An array of historical data entries, ideally for the last 7 days, but can be fewer.'),
  currentFoodLevel: z.number().describe('The current food container level as a percentage (0-100).'),
  currentPhSolutionLevel: z.number().describe('The current pH solution container level as a percentage (0-100).'),
});
export type HistoryInsightsInput = z.infer<typeof HistoryInsightsInputSchema>;

const HistoryInsightsOutputSchema = z.object({
  recommendedActions: z.array(z.string()).describe('Up to 3 concise, actionable recommendations based on the historical data analysis. If data is very limited, this might be a general statement.'),
  estimatedFoodEmptyDate: z.string().describe('Estimated date or timeframe when the food container will be empty (e.g., "in X days", "on YYYY-MM-DD", or "Estimation unavailable"). Qualify certainty if data is limited.'),
  estimatedPhSolutionEmptyDate: z.string().describe('Estimated date or timeframe when the pH solution container will be empty (e.g., "in X days", "on YYYY-MM-DD", or "Estimation unavailable"). Qualify certainty if data is limited.'),
});
export type HistoryInsightsOutput = z.infer<typeof HistoryInsightsOutputSchema>;

export async function getHistoryInsights(input: HistoryInsightsInput): Promise<HistoryInsightsOutput> {
  return historyInsightsFlow(input);
}

const historyInsightsPrompt = ai.definePrompt({
  name: 'historyInsightsPrompt',
  input: {schema: HistoryInsightsInputSchema},
  output: {schema: HistoryInsightsOutputSchema},
  prompt: `You are an expert aquaculture and IoT system advisor. Analyze the provided historical data from an RRJ Aquatique system and current container levels.
If the provided historical data covers fewer than 7 days, acknowledge this limitation directly in your 'recommendedActions' and qualify the certainty of your estimations.

Historical Data:
{{#each historicalData}}
Date: {{{date}}}
  Water Quality: Temp: {{{waterQuality.temp}}}°C, Turbidity: {{{waterQuality.turbidity}}} NTU, pH: {{{waterQuality.ph}}}
  Feeding Times: {{#if feedingSchedules.length}}{{#each feedingSchedules}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
  pH Balancer Triggered: {{{phBalancerTriggered}}}
  {{#if isAutoFeedingEnabledToday~}}
  Auto Feeding System Enabled Today: {{{isAutoFeedingEnabledToday}}}
  {{~/if}}
  {{#if isAutoPhEnabledToday~}}
  Auto pH System Enabled Today: {{{isAutoPhEnabledToday}}}
  {{~/if}}
  {{#if foodLevelStartOfDay~}}
  Food Level (Start -> End of Day): {{{foodLevelStartOfDay}}}% -> {{{foodLevelEndOfDay}}}%
  {{~/if}}
  {{#if phSolutionLevelStartOfDay~}}
  pH Solution Level (Start -> End of Day): {{{phSolutionLevelStartOfDay}}}% -> {{{phSolutionLevelEndOfDay}}}%
  {{~/if}}
{{/each}}

Current Container Levels:
- Food Level: {{{currentFoodLevel}}}%
- pH Solution Level: {{{currentPhSolutionLevel}}}%

Based on this data:
1.  **Recommended Actions**: Identify any notable patterns, potential issues (e.g., consistently high turbidity, significant pH swings, days with no feeding if schedules usually exist and auto-feed was enabled, frequent pH balancer activation especially if auto-pH was enabled).
    Consider the daily operational parameters:
    *   \`Auto Feeding System Enabled Today\`: (true/false) Indicates if the automated feeding system was active for that day. Absence of this field means status was not recorded for that day. If feedings are missed while the auto-feeding system was supposedly enabled, flag this as an issue.
    *   \`Auto pH System Enabled Today\`: (true/false) Indicates if the automated pH balancing system was active. Absence of this field means status was not recorded for that day.
    *   \`Food Level (Start -> End of Day)\`: Shows food percentage. Absence means not recorded. Note any unusually high daily consumption.
    *   \`pH Solution Level (Start -> End of Day)\`: Shows pH solution percentage. Absence means not recorded. Note any unusually high daily consumption.
    Provide 2-3 concise, actionable recommendations to maintain or improve the aquatic environment. If data is very limited (e.g., 1-2 days), recommendations may need to be more general or focus on establishing a baseline.

2.  **Food Container Estimation**:
    *   Assume each feeding time listed in the historical data consumes approximately 2.5% of the total food container capacity.
    *   Calculate the average number of feedings per day from the historical data.
    *   Based on this average daily consumption and the 'currentFoodLevel', estimate when the food container will be empty.
    *   State this as "in X days", "on YYYY-MM-DD (using the date of the last entry in historicalData as the 'current day' for this estimation)", or "Estimation unavailable due to insufficient/unreliable data". If data is limited, explicitly state that the estimation is less certain.

3.  **pH Solution Container Estimation**:
    *   Assume each day the 'phBalancerTriggered' is true, it consumes approximately 1.5% of the total pH solution container capacity.
    *   Calculate the average daily consumption based on how many days the balancer was triggered in the historical data.
    *   Based on this average daily consumption and the 'currentPhSolutionLevel', estimate when the pH solution will be empty.
    *   State this as "in X days", "on YYYY-MM-DD (using the date of the last entry in historicalData as the 'current day' for this estimation)", or "Estimation unavailable due to insufficient/unreliable data". If data is limited, explicitly state that the estimation is less certain.

Return your response in the specified JSON format.
`,
});

const historyInsightsFlow = ai.defineFlow(
  {
    name: 'historyInsightsFlow',
    inputSchema: HistoryInsightsInputSchema,
    outputSchema: HistoryInsightsOutputSchema,
  },
  async (input) => {
    // The check for historicalData.length < 7 has been removed.
    // The prompt now instructs the LLM on how to handle limited data.
    // It's assumed that if this flow is called, historicalData will not be completely empty,
    // as SystemOverviewCard.tsx typically ensures some data is present before calling.
    // If historicalData could be empty, an additional check here might be useful:
    if (!input.historicalData || input.historicalData.length === 0) {
      return {
        recommendedActions: ["No historical data provided. Cannot generate insights."],
        estimatedFoodEmptyDate: "Estimation unavailable",
        estimatedPhSolutionEmptyDate: "Estimation unavailable",
      };
    }

    const {output} = await historyInsightsPrompt(input);
    if (!output) {
        // This error means the AI's response didn't match the expected schema or the call failed.
        throw new Error("AI failed to generate insights or the response was not in the expected format.");
    }
    return output;
  }
);

