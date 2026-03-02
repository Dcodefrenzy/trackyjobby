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
// Preserve raw body for webhook signature verification
app.use(express.json({
    verify: (req: any, _res, buf) => {
        req.rawBody = buf;
    }
}));

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
