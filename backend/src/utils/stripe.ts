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

function getBaseUrl() {
    let url = process.env.APP_URL || 'https://trackyjobby.com';
    // Remove trailing slash if present
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}

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

export async function createCheckoutSession(userId: string, userEmail: string, planId: string, customerId?: string) {
    const plan = Object.values(STRIPE_PLANS).find(p => p.id === planId);
    const baseUrl = getBaseUrl();

    if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
    }

    console.log(`ℹ️ [STRIPE] Creating checkout session for ${userEmail} (Plan: ${planId})`);

    // Check if we are using a test key with what might be live prices
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
        console.warn('⚠️ [STRIPE] Using TEST MODE secret key. Ensure price IDs match.');
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
            {
                price: plan.priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        client_reference_id: userId,
        subscription_data: {
            trial_period_days: 3,
            metadata: {
                userId,
                planId,
            },
        },
        success_url: `${baseUrl}/dashboard?payment=success`,
        cancel_url: `${baseUrl}/plan-selection?payment=cancelled`,
        metadata: {
            userId,
            planId,
        },
    };

    if (customerId) {
        sessionOptions.customer = customerId;
    } else if (userEmail) {
        sessionOptions.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return session;
}

export async function createPortalSession(customerId: string) {
    const baseUrl = getBaseUrl();
    const portalOptions: Stripe.BillingPortal.SessionCreateParams = {
        customer: customerId,
        return_url: `${baseUrl}/dashboard?portal=return`,
    };

    if (process.env.STRIPE_PORTAL_CONFIG_ID) {
        portalOptions.configuration = process.env.STRIPE_PORTAL_CONFIG_ID;
    }

    const session = await stripe.billingPortal.sessions.create(portalOptions);
    return session;
}

export default stripe;
