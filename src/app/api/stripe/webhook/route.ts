
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!webhookSecret) {
  console.error('FATAL: STRIPE_WEBHOOK_SECRET is not set.');
  // Potentially throw an error or handle this state, 
  // as webhooks will fail without it.
}


export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook Error: Missing Stripe signature.');
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }
  if (!webhookSecret) {
     console.error('Webhook Error: Webhook secret is not configured on the server.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }


  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('Stripe Webhook Event Received:', event.type);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription;
      const customerId = session.customer;
      
      // You might have stored the plan ID in metadata if needed
      // const planId = session.metadata?.planId; 

      console.log(`Checkout session completed for user ID: ${userId}`);
      console.log(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);
      
      // TODO: Implement database update logic here.
      // This is where you would update the user's record in Firestore (or other DB)
      // to reflect their new subscription status (e.g., set subscriptionTier, stripeSubscriptionId, stripeCustomerId).
      // Example: await updateUserSubscriptionInDb(userId, 'pro', subscriptionId, customerId);

      break;
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Invoice payment succeeded for customer: ${invoice.customer}, subscription: ${invoice.subscription}`);
      // TODO: Ensure subscription remains active. Usually handled by Stripe unless specific logic needed.
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log(`Invoice payment failed for customer: ${failedInvoice.customer}, subscription: ${failedInvoice.subscription}`);
      // TODO: Notify user, update subscription status (e.g., to 'past_due' or 'canceled').
      // Example: await updateUserSubscriptionStatusInDb(failedInvoice.subscription, 'past_due');
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${deletedSubscription.id} for customer ${deletedSubscription.customer}`);
      // TODO: Update user's subscription status in your database to 'canceled' or 'free'.
      // Example: await updateUserSubscriptionStatusInDb(deletedSubscription.id, 'canceled');
      break;
    // Add more cases as needed for customer.subscription.updated, etc.
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
