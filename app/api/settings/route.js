import { LLM_MODELS } from '@/lib/openrouter';
import { TONE_OPTIONS } from '@/lib/prompts';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        llmModels: LLM_MODELS,
        toneOptions: TONE_OPTIONS,
    });
}
