import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonWithCors } from '@/lib/cors';

// GET - Fetch widget layout for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('widget_layouts')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return default layout if none exists
        if (!data) {
            return jsonWithCors({
                layout: ['goals', 'activity', 'habits', 'efficiency']
            });
        }

        return jsonWithCors({ layout: data.layout });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Save widget layout for a user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, layout } = body;

        if (!userId || !layout) {
            return NextResponse.json({ error: 'User ID and layout required' }, { status: 400 });
        }

        // Check if layout exists
        const { data: existing } = await supabaseAdmin
            .from('widget_layouts')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Update existing layout
            const { data, error } = await supabaseAdmin
                .from('widget_layouts')
                .update({
                    layout,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return jsonWithCors({ layout: data.layout });
        } else {
            // Create new layout
            const { data, error } = await supabaseAdmin
                .from('widget_layouts')
                .insert({
                    user_id: userId,
                    layout,
                })
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return jsonWithCors({ layout: data.layout });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
