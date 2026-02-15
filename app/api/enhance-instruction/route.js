import { streamChatCompletion } from '@/lib/openrouter';
import { buildInstructionEnhancementPrompt } from '@/lib/prompts';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const { instruction, model } = await request.json();

        if (!instruction || !instruction.trim()) {
            return Response.json({ error: 'Talimat gerekli' }, { status: 400 });
        }

        const userPrompt = buildInstructionEnhancementPrompt(instruction);

        const response = await streamChatCompletion({
            model: model || 'google/gemini-2.5-flash',
            systemPrompt: 'You are a helpful content strategist.',
            userPrompt,
            maxTokens: 1000,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices?.[0]?.delta?.content;
                        if (content) fullText += content;
                    } catch (e) { }
                }
            }
        }

        // Temizlik (tırnak varsa kaldır)
        let cleanText = fullText.trim();
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
            cleanText = cleanText.slice(1, -1);
        }

        return Response.json({ enhancedInstruction: cleanText });

    } catch (error) {
        console.error('Instruction enhancement error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
