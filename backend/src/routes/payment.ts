import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '../utils/stripe';
import { authenticate } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// Create a Stripe Checkout Session
router.post('/create-session', authenticate, async (req: any, res) => {
    const { planId } = req.body;
    const userId = req.userId;

    try {
        // 1. Get user email from Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Create the session
        const session = await createCheckoutSession(userId, user.email, planId);

        res.json({ url: session.url });
    } catch (err: any) {
        console.error('❌ [PAYMENT] Error creating session:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Create a Stripe Customer Portal Session
router.post('/create-portal-session', authenticate, async (req: any, res) => {
    const userId = req.userId;

    try {
        // 1. Get stripe_customer_id from Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('stripe_customer_id, subscription_status')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.stripe_customer_id) {
            return res.status(400).json({ error: 'No active subscription found for this user.' });
        }

        // 2. Create the portal session
        const { createPortalSession } = require('../utils/stripe');
        const session = await createPortalSession(user.stripe_customer_id);

        res.json({ url: session.url });
    } catch (err: any) {
        console.error('❌ [PAYMENT] Error creating portal session:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
