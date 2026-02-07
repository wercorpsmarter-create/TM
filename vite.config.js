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

                    // SLACK PROXY MIDDLEWARE
                    server.middlewares.use('/api/slack/exchange', async (req, res, next) => {
                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', chunk => body += chunk.toString());
                            req.on('end', async () => {
                                try {
                                    const { code, redirect_uri } = JSON.parse(body);
                                    const clientId = env.SLACK_CLIENT_ID;
                                    const clientSecret = env.SLACK_CLIENT_SECRET;

                                    if (!clientId || !clientSecret) {
                                        throw new Error('Missing Slack env vars');
                                    }

                                    const params = new URLSearchParams();
                                    params.append('client_id', clientId);
                                    params.append('client_secret', clientSecret);
                                    params.append('code', code);
                                    if (redirect_uri) params.append('redirect_uri', redirect_uri);

                                    const slackRes = await fetch('https://slack.com/api/oauth.v2.access', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                        body: params
                                    });
                                    const data = await slackRes.json();

                                    res.statusCode = 200;
                                    res.end(JSON.stringify(data));
                                } catch (error) {
                                    console.error('Slack Exchange Error:', error);
                                    res.statusCode = 500;
                                    res.end(JSON.stringify({ error: error.message }));
                                }
                            });
                        } else {
                            next();
                        }
                    });

                    server.middlewares.use('/api/slack/proxy', async (req, res, next) => {
                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', chunk => body += chunk.toString());
                            req.on('end', async () => {
                                try {
                                    const { endpoint, token, method = 'GET', ...rest } = JSON.parse(body);

                                    const url = `https://slack.com/api/${endpoint}`;
                                    const headers = {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json; charset=utf-8'
                                    };

                                    const slackRes = await fetch(url, {
                                        method: method,
                                        headers: headers,
                                        body: method !== 'GET' ? JSON.stringify(rest) : undefined
                                    });

                                    const data = await slackRes.json();
                                    res.statusCode = 200;
                                    res.end(JSON.stringify(data));
                                } catch (error) {
                                    console.error('Slack Proxy Error:', error);
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
