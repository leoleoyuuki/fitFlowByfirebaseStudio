
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants'; 
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  let planId: string | null = null;
  try {
    const body = await req.json();
    planId = body.planId;
    const userId = body.userId;

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Plan ID and User ID are required.' }, { status: 400 });
    }

    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId);

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan or plan does not have a Stripe Price ID.' }, { status: 400 });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fitflowpro.com.br';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/subscribe?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe?canceled=true`,
      client_reference_id: userId, 
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session.');
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    
    const plan = planId ? MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId) : null;
    const priceId = plan?.stripePriceId || 'N/A';
    let errorMessage = 'Failed to create checkout session.';

    if (error instanceof stripe.errors.StripeError) {
        switch (error.type) {
            case 'StripeInvalidRequestError':
                errorMessage = `Invalid request to Stripe: ${error.message}. This can happen if the Price ID ('${priceId}') does not exist in your Stripe account's current mode (Live vs. Test). Please verify your Vercel environment variables and Stripe dashboard.`;
                break;
            case 'StripeAuthenticationError':
                errorMessage = `Stripe authentication failed: ${error.message}. Please check if your STRIPE_SECRET_KEY environment variable is set correctly on Vercel.`;
                break;
            default:
                errorMessage = `A Stripe error occurred: ${error.message}`;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
