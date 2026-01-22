import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jsonWithCors } from '@/lib/cors';

// GET - Fetch user by Google ID
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const googleId = searchParams.get('googleId');

        if (!googleId) {
            return jsonWithCors({ error: 'Google ID required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found
            return jsonWithCors({ error: error.message }, { status: 500 });
        }

        return jsonWithCors({ user: data });
    } catch (error) {
        return jsonWithCors({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, googleId, subscriptionStatus } = body;

        if (!email || !googleId) {
            return jsonWithCors({ error: 'Email and Google ID required' }, { status: 400 });
        }

        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();

        if (existingUser) {
            // Update existing user
            const { data, error } = await supabaseAdmin
                .from('users')
                .update({
                    name,
                    subscription_status: subscriptionStatus || existingUser.subscription_status,
                })
                .eq('google_id', googleId)
                .select()
                .single();

            if (error) {
                return jsonWithCors({ error: error.message }, { status: 500 });
            }

            return jsonWithCors({ user: data });
        } else {
            // Create new user
            const { data, error } = await supabaseAdmin
                .from('users')
                .insert({
                    email,
                    name,
                    google_id: googleId,
                    subscription_status: subscriptionStatus || 'none',
                })
                .select()
                .single();

            if (error) {
                return jsonWithCors({ error: error.message }, { status: 500 });
            }

            return jsonWithCors({ user: data });
        }
    } catch (error) {
        return jsonWithCors({ error: 'Internal server error' }, { status: 500 });
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
