import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../utils/email';

const router = Router();

const mailDomain = () => process.env.MAIL_DOMAIN || 'trackyjobby.com';
const forwardingEmail = (forwarder: string) => `${forwarder}@${mailDomain()}`;

// ─── STEP 1: Register ────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    console.log('📝 Register attempt:', { email, name });

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: existing } = await supabase
        .from('users').select('id').eq('email', email).single();
    if (existing) {
        console.log('⚠️ Email already registered:', email);
        return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = require('crypto').randomUUID();

    const { data: insertData, error } = await supabase.from('users').insert({
        email,
        name: name || null,
        password_hash: passwordHash,
        verification_token: verificationToken,
        email_verified: false,
    }).select().single();

    if (error) {
        console.error('❌ Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create account' });
    }

    console.log('✅ User created in DB:', insertData?.id);

    try {
        await sendVerificationEmail(email, verificationToken, name);
        console.log('✅ Verification email sent to:', email);

        // Notify admin of new registration
        const { sendAdminNotification } = require('../utils/email');
        await sendAdminNotification('New User Registered', `
          <p style="margin-bottom:12px;">A new user has just registered on TrackyJobby!</p>
          <div style="background:#161b22;padding:16px;border-radius:8px;border:1px solid #30363d;">
            <div style="color:#8b949e;font-size:12px;text-transform:uppercase;margin-bottom:4px;">Email</div>
            <div style="font-size:15px;margin-bottom:12px;">${email}</div>
            <div style="color:#8b949e;font-size:12px;text-transform:uppercase;margin-bottom:4px;">Name</div>
            <div style="font-size:15px;">${name || 'N/A'}</div>
          </div>
        `);
    } catch (emailErr) {
        console.error('❌ Failed to send emails:', emailErr);
    }

    return res.status(201).json({
        message: 'Account created. Please check your email to verify your account.',
    });
});

// ─── STEP 2: Verify email ────────────────────────────────────────────────────
router.get('/verify/:token', async (req: Request, res: Response) => {
    const { token } = req.params;

    const { data: user } = await supabase
        .from('users')
        .select('id, email, name, email_verified, subscription_status')
        .eq('verification_token', token)
        .single();

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    if (!user.email_verified) {
        await supabase
            .from('users')
            .update({ email_verified: true, verification_token: null })
            .eq('id', user.id);
    }

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
    return res.json({
        token: jwtToken,
        user: { id: user.id, email: user.email, name: user.name, subscription_status: user.subscription_status || 'none' },
        needsSetup: true,
    });
});

// ─── STEP 3: Set mail forwarder ──────────────────────────────────────────────
router.post('/setup-forwarder', authenticate, async (req: AuthRequest, res: Response) => {
    const { mailForwarder } = req.body;
    if (!mailForwarder) {
        return res.status(400).json({ error: 'Mail forwarder name is required' });
    }

    const clean = mailForwarder.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean.length < 3) {
        return res.status(400).json({ error: 'Must be at least 3 characters (letters, numbers, hyphens)' });
    }

    const { data: existing } = await supabase
        .from('users').select('id').eq('mail_forwarder', clean).single();
    if (existing && existing.id !== req.userId) {
        return res.status(409).json({ error: 'That name is already taken' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .update({ mail_forwarder: clean })
        .eq('id', req.userId)
        .select('id, email, name, mail_forwarder, subscription_status')
        .single();

    if (error || !user) {
        return res.status(500).json({ error: 'Failed to save forwarder' });
    }

    return res.json({
        forwardingEmail: forwardingEmail(clean),
        user: { id: user.id, email: user.email, name: user.name, mailForwarder: clean, subscription_status: user.subscription_status },
    });
});

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user } = await supabase
        .from('users').select('*').eq('email', email).single();

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.email_verified) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

    return res.json({
        token,
        needsSetup: !user.mail_forwarder,
        forwardingEmail: user.mail_forwarder ? forwardingEmail(user.mail_forwarder) : null,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            mailForwarder: user.mail_forwarder,
            subscription_status: user.subscription_status
        },
    });
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const { data: user } = await supabase
            .from('users')
            .select('id, email, name, mail_forwarder, email_verified, created_at, subscription_status')
            .eq('id', payload.userId)
            .single();

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({
            ...user,
            forwardingEmail: user.mail_forwarder ? forwardingEmail(user.mail_forwarder) : null,
        });
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// ─── Forwarding Verification ──────────────────────────────────────────────────
router.get('/forwarding-verification', authenticate, async (req: AuthRequest, res: Response) => {
    const { data: alert, error } = await supabase
        .from('alerts')
        .select('action_url')
        .eq('user_id', req.userId)
        .eq('title', 'Gmail Forwarding Setup')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !alert) {
        return res.status(404).json({ error: 'No verification link found yet' });
    }

    return res.json({ verificationUrl: alert.action_url });
});

export default router;
