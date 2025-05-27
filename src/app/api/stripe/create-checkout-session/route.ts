
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants'; 

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Plan ID and User ID are required.' }, { status: 400 });
    }

    const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === planId);

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan or plan does not have a Stripe Price ID.' }, { status: 400 });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

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
    return NextResponse.json({ error: error.message || 'Failed to create checkout session.' }, { status: 500 });
  }
}
