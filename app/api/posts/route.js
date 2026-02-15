import { createServerClient } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

// GET — Tüm yazıları listele
export async function GET(request) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // draft, published

        let query = supabase
            .from('posts')
            .select('*')
            .order('date', { ascending: false });

        // Status filtresi
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return Response.json({ posts: data || [] });
    } catch (error) {
        console.error('Posts GET hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Yeni yazı kaydet
export async function POST(request) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { title, content, summary, tags, featured_image_url, status } = body;

        if (!title) {
            return Response.json({ error: 'Başlık zorunludur' }, { status: 400 });
        }

        const slug = generateSlug(title);

        // Aynı slug var mı kontrol et
        const { data: existing } = await supabase
            .from('posts')
            .select('slug')
            .eq('slug', slug)
            .single();

        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const { data, error } = await supabase
            .from('posts')
            .insert({
                title,
                slug: finalSlug,
                content: content || '',
                summary: summary || '',
                tags: tags || [],
                featured_image_url: featured_image_url || '',
                status: status || 'draft',
                date: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return Response.json({ post: data }, { status: 201 });
    } catch (error) {
        console.error('Posts POST hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
