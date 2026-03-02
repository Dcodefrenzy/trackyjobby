import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import webhookRoutes from './routes/webhook';
import jobsRoutes from './routes/jobs';
import feedbackRoutes from './routes/feedback';
import paymentRoutes from './routes/payment';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// --- WEBHOOKS (MUST go BEFORE express.json() to preserve raw body) ---
// We handle Stripe with express.raw() to avoid signature verification failures.
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// Global JSON parsing for all other routes
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ ok: true, version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`✅ TrackyJobby backend running on http://localhost:${PORT}`);
    console.log(`🌍 Active Mail Domain: ${process.env.MAIL_DOMAIN || 'trackyjobby.com'}`);
});

export default app;
