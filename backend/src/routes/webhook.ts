import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { parseJobEmail } from '../utils/llmParser';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import { processJobApplication } from '../services/jobApplicationService';
import stripe from '../utils/stripe';
import Stripe from 'stripe';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/webhook/stripe
 * 
 * Handles Stripe subscription and payment events
 */
router.post('/stripe', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event: Stripe.Event;

    console.log(`🔍 [STRIPE] Secret: ${webhookSecret ? webhookSecret.substring(0, 8) + '...' : 'MISSING'}`);
    console.log(`🔍 [STRIPE] Signature Header: ${sig ? sig.substring(0, 20) + '...' : 'MISSING'}`);
    console.log(`🔍 [STRIPE] Raw Body Present: ${!!(req as any).rawBody}`);

    try {
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody,
            sig,
            webhookSecret
        );
    } catch (err: any) {
        console.error(`❌ [STRIPE] Webhook signature verification failed: ${err.message}`);
        // Log more details about what might be wrong
        if (!webhookSecret) console.error('❌ [STRIPE] Missing STRIPE_WEBHOOK_SECRET in .env');
        if (!sig) console.error('❌ [STRIPE] Missing stripe-signature header');
        if (!(req as any).rawBody) console.error('❌ [STRIPE] Missing req.rawBody - Check index.ts middleware');

        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 [STRIPE] Received event: ${event.type}`);

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.userId;
                const planId = subscription.metadata.planId;

                if (userId) {
                    console.log(`🔍 [STRIPE] Subscription State - Status: ${subscription.status}, CancelAtEnd: ${subscription.cancel_at_period_end}`);
                    const status = subscription.cancel_at_period_end ? 'canceled' : subscription.status;

                    const { error } = await supabase
                        .from('users')
                        .update({
                            subscription_status: status,
                            stripe_customer_id: subscription.customer as string,
                            stripe_subscription_id: subscription.id,
                            plan_id: planId
                        })
                        .eq('id', userId);

                    if (error) {
                        console.error('❌ [STRIPE] Database update failed:', error.message);
                    } else {
                        console.log(`✅ [STRIPE] Updated subscription for user ${userId}: ${status}`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.userId;

                if (userId) {
                    await supabase
                        .from('users')
                        .update({
                            subscription_status: 'canceled'
                        })
                        .eq('id', userId);
                    console.log(`✅ [STRIPE] Canceled subscription for user ${userId}`);
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                // Find user by stripe_subscription_id
                const { data: user } = await supabase
                    .from('users')
                    .select('id, plan_id')
                    .eq('stripe_subscription_id', subscriptionId)
                    .single();

                if (user) {
                    await supabase.from('transactions').insert({
                        user_id: user.id,
                        stripe_invoice_id: invoice.id,
                        stripe_payment_intent_id: invoice.payment_intent as string,
                        amount: invoice.amount_paid,
                        currency: invoice.currency,
                        status: 'succeeded',
                        plan_id: user.plan_id
                    });
                    console.log(`💰 [STRIPE] Payment recorded for user ${user.id}: €${invoice.amount_paid / 100}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription as string;

                const { data: user } = await supabase
                    .from('users')
                    .select('id, plan_id')
                    .eq('stripe_subscription_id', subscriptionId)
                    .single();

                if (user) {
                    await supabase.from('transactions').insert({
                        user_id: user.id,
                        stripe_invoice_id: invoice.id,
                        stripe_payment_intent_id: invoice.payment_intent as string,
                        amount: invoice.amount_due,
                        currency: invoice.currency,
                        status: 'failed',
                        plan_id: user.plan_id
                    });
                    console.log(`⚠️ [STRIPE] Payment failed for user ${user.id}`);
                }
                break;
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'payment') {
                    const userId = session.metadata?.userId;
                    const planId = session.metadata?.planId;

                    if (userId && planId === 'lifetime') {
                        await supabase
                            .from('users')
                            .update({
                                subscription_status: 'lifetime',
                                stripe_customer_id: session.customer as string,
                                plan_id: 'lifetime'
                            })
                            .eq('id', userId);

                        await supabase.from('transactions').insert({
                            user_id: userId,
                            stripe_payment_intent_id: session.payment_intent as string,
                            amount: session.amount_total || 0,
                            currency: session.currency || 'eur',
                            status: 'succeeded',
                            plan_id: 'lifetime'
                        });
                        console.log(`✅ [STRIPE] Set lifetime access & recorded transaction for user ${userId}`);
                    }
                }
                break;
            }

            default:
                console.log(`ℹ️ [STRIPE] Unhandled event type: ${event.type}`);
        }
    } catch (dbError: any) {
        console.error(`❌ [STRIPE] Error processing event: ${dbError.message}`);
    }

    res.json({ received: true });
});

/**
 * POST /api/webhook/inbound
 * 
 * Catch-all inbound endpoint for Resend emails
 */
router.post('/inbound', async (req: Request, res: Response) => {
    const rawBody = (req as any).rawBody;
    const payloadString = rawBody ? rawBody.toString('utf8') : JSON.stringify(req.body);

    if (process.env.RESEND_SIGN_IN) {
        try {
            const wh = new Webhook(process.env.RESEND_SIGN_IN);
            wh.verify(rawBody || payloadString, {
                "svix-id": req.headers["svix-id"] as string,
                "svix-timestamp": req.headers["svix-timestamp"] as string,
                "svix-signature": req.headers["svix-signature"] as string,
            });
        } catch (err: any) {
            console.error('❌ Resend Webhook signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }
    }

    const body = req.body;
    const emailData = body.data || body;
    const toRaw: string = Array.isArray(emailData.to) ? emailData.to[0] : (emailData.to || '');
    const localPart = toRaw.split('@')[0]?.toLowerCase().trim();

    if (!localPart) {
        return res.status(400).json({ error: 'Cannot determine recipient' });
    }

    const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('mail_forwarder', localPart)
        .single();

    if (!user) {
        return res.status(200).json({ ok: false, reason: `No forwarder found for "${localPart}"` });
    }

    const subject = emailData.subject || '';
    let bodyText = emailData.text || emailData.html || '';

    if (body.type === 'email.received') {
        try {
            const { data: email, error } = await resend.emails.receiving.get(body.data.email_id);
            if (!error && email) {
                bodyText = email.text || email.html || bodyText;
            }
        } catch (err) {
            console.error('❌ Error fetching email from Resend:', err);
        }
    }

    const gmailLinkMatch = bodyText.match(/(https:\/\/mail(-settings)?\.google\.com\/mail\/[^ \n\r>]+)/i);
    if (subject.toLowerCase().includes('forwarding confirmation') && gmailLinkMatch) {
        await supabase.from('alerts').insert({
            user_id: user.id,
            title: 'Gmail Forwarding Setup',
            message: 'Click here to complete your Gmail forwarding setup.',
            action_url: gmailLinkMatch[0]
        });
        return res.status(200).json({ ok: true });
    }

    const result = await parseJobEmail(subject, bodyText);
    if (result.isJobRelated && result.jobData) {
        try {
            await processJobApplication(user.id, result.jobData);
            return res.status(200).json({ ok: true });
        } catch (dbError) {
            return res.status(500).json({ error: 'Database transaction failed' });
        }
    }

    return res.status(200).json({ ok: true, reason: 'Ignored' });
});

export default router;
