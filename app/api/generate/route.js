import { streamChatCompletion } from '@/lib/openrouter';
import { buildSystemPrompt, buildUserPrompt, getTemperatureForTone } from '@/lib/prompts';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            topic,
            subtopics,
            targetAudience,
            tone,
            wordCount,
            customInstructions,
            model,
        } = body;

        if (!topic) {
            return Response.json({ error: 'Konu alanı zorunludur' }, { status: 400 });
        }

        const systemPrompt = buildSystemPrompt({
            tone: tone || 'samimi',
            wordCount: wordCount || 1500,
            customInstructions: customInstructions || '',
            topic,
            subtopics: subtopics || '',
        });

        // Ton bazlı temperature ayarı
        const temperature = getTemperatureForTone(tone || 'samimi');

        const userPrompt = buildUserPrompt({
            topic,
            subtopics: subtopics || '',
            targetAudience: targetAudience || 'genel',
        });

        // OpenRouter'dan streaming yanıt al
        const response = await streamChatCompletion({
            model,
            systemPrompt,
            userPrompt,
            temperature,
            maxTokens: 8000,
        });

        // ReadableStream olarak istemciye aktar
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') {
                                    controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                                    continue;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                                    }
                                } catch (e) {
                                    // JSON parse hatası, devam et
                                }
                            }
                        }
                    }
                } catch (error) {
                    controller.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
                    );
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Generate API hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
