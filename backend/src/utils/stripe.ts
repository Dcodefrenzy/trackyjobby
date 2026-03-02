import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ [STRIPE] STRIPE_SECRET_KEY is missing. Stripe features will be disabled.');
}

// Stripe requires a non-empty string for the API key even if we just want to initialize it
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any,
});

export const STRIPE_PLANS = {
    MONTHLY: {
        id: 'monthly',
        priceId: 'price_1T6Yr7H5khr25gCNFnDtqJkZ', // USER: Replace with actual Stripe Price ID
        amount: 200, // €2.00
    },
    YEARLY: {
        id: 'yearly',
        priceId: 'price_1T6Yr7H5khr25gCNsd5QBbOk', // USER: Replace with actual Stripe Price ID
        amount: 1500, // €15.00
    }
};

export async function createCheckoutSession(userId: string, userEmail: string, planId: string) {
    const plan = Object.values(STRIPE_PLANS).find(p => p.id === planId);

    if (!plan) {
        throw new Error('Invalid plan ID');
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        customer_email: userEmail,
        client_reference_id: userId,
        subscription_data: {
            trial_period_days: 3,
            metadata: {
                userId,
                planId,
            },
        },
        success_url: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard?payment=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/plan-selection?payment=cancelled`,
        metadata: {
            userId,
            planId,
        },
    });

    return session;
}

export async function createPortalSession(customerId: string) {
    const portalOptions: Stripe.BillingPortal.SessionCreateParams = {
        customer: customerId,
        return_url: `${process.env.APP_URL || 'http://localhost:5174'}/dashboard?portal=return`,
    };

    if (process.env.STRIPE_PORTAL_CONFIG_ID) {
        portalOptions.configuration = process.env.STRIPE_PORTAL_CONFIG_ID;
    }

    const session = await stripe.billingPortal.sessions.create(portalOptions);
    return session;
}

export default stripe;
