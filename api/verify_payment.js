import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { session_id } = request.body;

    if (!session_id) {
        return response.status(400).json({ error: 'Missing session_id' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            return response.status(200).json({ verified: true });
        } else {
            return response.status(200).json({ verified: false, status: session.payment_status });
        }
    } catch (error) {
        console.error('Stripe API Error:', error);
        return response.status(500).json({ error: 'Failed to verify session' });
    }
}
