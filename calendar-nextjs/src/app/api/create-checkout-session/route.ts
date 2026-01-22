import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Be more specific in production
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { origin } = new URL(req.url); // Use request origin if needed

        const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Task Master Pro - 14 Day Free Trial',
                            description: 'Full access to all premium features',
                        },
                        unit_amount: 1900,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 14,
            },
            success_url: `${frontendUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${frontendUrl}?canceled=true`,
        });

        return NextResponse.json({ url: session.url }, { headers: corsHeaders });
    } catch (err: any) {
        console.error('Stripe error:', err);
        return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
}
