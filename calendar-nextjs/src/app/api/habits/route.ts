import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonWithCors } from '@/lib/cors';

// GET - Fetch all habits for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ habits: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new habit
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, name } = body;

        if (!userId || !name) {
            return NextResponse.json({ error: 'User ID and name required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('habits')
            .insert({
                user_id: userId,
                name,
                history: [false, false, false, false, false, false, false],
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ habit: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update habit history
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, history } = body;

        if (!id || !history) {
            return NextResponse.json({ error: 'Habit ID and history required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('habits')
            .update({
                history,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ habit: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete a habit
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Habit ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('habits')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ success: true });
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
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
