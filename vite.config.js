import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Stripe from 'stripe';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            {
                name: 'configure-server',
                configureServer(server) {
                    server.middlewares.use('/api/verify_payment', async (req, res, next) => {
                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', chunk => {
                                body += chunk.toString();
                            });

                            req.on('end', async () => {
                                try {
                                    const { session_id } = JSON.parse(body);

                                    if (!session_id) {
                                        res.statusCode = 400;
                                        res.end(JSON.stringify({ error: 'Missing session_id' }));
                                        return;
                                    }

                                    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
                                    console.log(`[Vite] Verifying session: ${session_id}`);
                                    console.log(`[Vite] Secret Key loaded: ${env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);

                                    const session = await stripe.checkout.sessions.retrieve(session_id);
                                    console.log(`[Vite] Session Status: ${session.payment_status}`);

                                    if (session.payment_status === 'paid') {
                                        res.statusCode = 200;
                                        res.end(JSON.stringify({ verified: true }));
                                    } else {
                                        res.statusCode = 200;
                                        res.end(JSON.stringify({ verified: false, status: session.payment_status }));
                                    }
                                } catch (error) {
                                    console.error('[Vite] Verification Error:', error.message);
                                    res.statusCode = 500;
                                    res.end(JSON.stringify({ error: error.message }));
                                }
                            });
                        } else {
                            next();
                        }
                    });
                }
            }
        ],
        server: {
            port: 5173
        }
    };
});
