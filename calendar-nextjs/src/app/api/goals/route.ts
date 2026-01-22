import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonWithCors } from '@/lib/cors';

// GET - Fetch all goals for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('position', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ goals: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new goal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, text, position } = body;

        if (!userId || !text || position === undefined) {
            return NextResponse.json({ error: 'User ID, text, and position required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('goals')
            .insert({
                user_id: userId,
                text,
                position,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ goal: data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete a goal
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('goals')
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
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
