
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!webhookSecret) {
  console.error('FATAL: STRIPE_WEBHOOK_SECRET is not set.');
}

async function updateUserSubscriptionInDb(
  userId: string,
  data: {
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    subscriptionTier: 'free' | 'hypertrophy';
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete';
    planId?: string; // Optional: Store the Stripe Price ID or Product ID
  }
) {
  if (!userId) {
    console.error('updateUserSubscriptionInDb: Missing userId');
    return;
  }
  try {
    const userRef = doc(db, 'users', userId);
    // Using setDoc with merge to create or update the user's subscription info
    await setDoc(userRef, { 
        ...data,
        updatedAt: serverTimestamp() 
    }, { merge: true });
    console.log(`Subscription updated in DB for user ${userId}:`, data);
  } catch (error) {
    console.error(`Error updating subscription in DB for user ${userId}:`, error);
  }
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

  console.log('Stripe Webhook Event Received:', event.type, event.data.object?.id);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id; // This should be your Firebase User ID
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
      const customerId = typeof session.customer === 'string' ? session.customer : null;
      
      console.log(`Checkout session completed for user ID: ${userId}`);
      console.log(`Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

      if (userId && subscriptionId && customerId) {
        // Determine the plan/tier. For simplicity, we assume 'hypertrophy' if a checkout session for a paid plan completes.
        // A more robust solution would inspect session.line_items if you have multiple paid tiers.
        // For now, hardcoding to 'hypertrophy' for any successful paid checkout.
        const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.id === 'hypertrophy'); // Get your plan details
        if (plan) {
            await updateUserSubscriptionInDb(userId, {
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: customerId,
                subscriptionTier: 'hypertrophy',
                subscriptionStatus: 'active',
                planId: plan.stripePriceId // Store the specific price ID
            });
        } else {
            console.error(`Plan details for 'hypertrophy' not found in MOCK_SUBSCRIPTION_PLANS for session ${session.id}`);
        }
      } else {
        console.error('Checkout session completed but missing userId, subscriptionId, or customerId.', session);
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription updated: ${updatedSubscription.id} for customer ${updatedSubscription.customer}, status: ${updatedSubscription.status}`);
      // Potentially update status in DB, e.g., if it becomes 'past_due' or 'active' again.
      // You need a way to map stripeSubscriptionId back to your Firebase userId.
      // This usually involves querying your 'users' collection by 'stripeSubscriptionId'.
      // For now, this is a placeholder. You'd need to implement lookup logic.
      // Example: await updateSubscriptionStatusByStripeId(updatedSubscription.id, updatedSubscription.status as any);
      break;

    case 'customer.subscription.deleted': // Handles cancellations (at period end or immediate)
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${deletedSubscription.id} for customer ${deletedSubscription.customer}`);
      // Find user by stripeSubscriptionId and update their status to 'canceled' or 'free' tier.
      // This also needs a lookup mechanism.
      // Example: 
      // const firebaseUserId = await findUserByStripeSubscriptionId(deletedSubscription.id);
      // if (firebaseUserId) {
      //   await updateUserSubscriptionInDb(firebaseUserId, {
      //     stripeSubscriptionId: deletedSubscription.id,
      //     stripeCustomerId: typeof deletedSubscription.customer === 'string' ? deletedSubscription.customer : null,
      //     subscriptionTier: 'free',
      //     subscriptionStatus: 'canceled',
      //   });
      // }
      // For now, this is a placeholder.
      // A simple example if you have the user ID (you won't directly from this event without a lookup based on subscription ID)
      // if (deletedSubscription.metadata?.firebaseUserId) { // If you store firebaseUserId in Stripe subscription metadata
      //     await updateUserSubscriptionInDb(deletedSubscription.metadata.firebaseUserId, {
      //         stripeSubscriptionId: deletedSubscription.id,
      //         stripeCustomerId: typeof deletedSubscription.customer === 'string' ? deletedSubscription.customer : null,
      //         subscriptionTier: 'free',
      //         subscriptionStatus: 'canceled',
      //     });
      // }
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Invoice payment succeeded for customer: ${invoice.customer}, subscription: ${invoice.subscription}`);
      // Ensure subscription remains active. Usually Stripe handles this, but you might want to confirm/log.
      // If a subscription was 'past_due', this might make it 'active' again.
      // const subIdForInvoice = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      // if (subIdForInvoice) {
      //    const firebaseUserId = await findUserByStripeSubscriptionId(subIdForInvoice);
      //    if (firebaseUserId) {
      //        await updateUserSubscriptionInDb(firebaseUserId, {
      //             stripeSubscriptionId: subIdForInvoice,
      //             stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
      //             subscriptionTier: 'hypertrophy', // Or determine from subscription items
      //             subscriptionStatus: 'active',
      //        });
      //    }
      // }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log(`Invoice payment failed for customer: ${failedInvoice.customer}, subscription: ${failedInvoice.subscription}`);
      // Notify user, update subscription status (e.g., to 'past_due').
      // const subIdForFailedInvoice = typeof failedInvoice.subscription === 'string' ? failedInvoice.subscription : null;
      // if (subIdForFailedInvoice) {
      //    const firebaseUserId = await findUserByStripeSubscriptionId(subIdForFailedInvoice);
      //    if (firebaseUserId) {
      //        await updateUserSubscriptionInDb(firebaseUserId, {
      //             stripeSubscriptionId: subIdForFailedInvoice,
      //             stripeCustomerId: typeof failedInvoice.customer === 'string' ? failedInvoice.customer : null,
      //             subscriptionTier: 'hypertrophy', // Or determine from subscription items
      //             subscriptionStatus: 'past_due', 
      //        });
      //    }
      // }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Dummy MOCK_SUBSCRIPTION_PLANS needed for the webhook logic to find plan details
// This should ideally be fetched from a config or a more robust source if plans change.
const MOCK_SUBSCRIPTION_PLANS = [
  { id: "free", name: "FitFlow Basic", price: "Free", features: [], stripePriceId: "" },
  { id: "hypertrophy", name: "FitFlow Hypertrophy", price: "$14.99/month", features: [], stripePriceId: "price_1RTTxuLZkqAmFk4bPvEANF0J" }, // Ensure this matches your actual plan ID
];
