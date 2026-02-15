import { createServerClient } from '@/lib/supabase';

// GET — Tek bir yazıyı getir
export async function GET(request, { params }) {
    try {
        const supabase = createServerClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            return Response.json({ error: 'Yazı bulunamadı' }, { status: 404 });
        }

        return Response.json({ post: data });
    } catch (error) {
        console.error('Post GET hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — Yazıyı güncelle
export async function PATCH(request, { params }) {
    try {
        const supabase = createServerClient();
        const { id } = await params;
        const body = await request.json();

        const updates = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.content !== undefined) updates.content = body.content;
        if (body.summary !== undefined) updates.summary = body.summary;
        if (body.tags !== undefined) updates.tags = body.tags;
        if (body.featured_image_url !== undefined) updates.featured_image_url = body.featured_image_url;
        if (body.slug !== undefined) updates.slug = body.slug;
        if (body.status !== undefined) updates.status = body.status;

        const { data, error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return Response.json({ post: data });
    } catch (error) {
        console.error('Post PATCH hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Yazıyı sil
export async function DELETE(request, { params }) {
    try {
        const supabase = createServerClient();
        const { id } = await params;

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Post DELETE hatası:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
