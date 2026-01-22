import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch all tasks for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ tasks: data }, {
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, title, date, status } = body;

        if (!userId || !title || !date) {
            return NextResponse.json({ error: 'User ID, title, and date required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                user_id: userId,
                title,
                date,
                status: status || 'Pending',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ task: data }, {
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updateData.title = title;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ task: data }, {
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete a task
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, {
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
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
