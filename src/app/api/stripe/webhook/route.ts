
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Added getDoc
import type { UserProfile } from '@/types';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
if (!webhookSecret) {
  console.error('FATAL: STRIPE_WEBHOOK_SECRET is not set.');
}

// Helper function to construct response with CORS headers
function createCorsResponse(body: any, status: number) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsResponse({ message: 'CORS preflight successful' }, 200);
}

async function updateUserSubscriptionInDb(
  userId: string,
  data: Partial<UserProfile> // Allow partial updates
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
    return createCorsResponse({ error: 'Missing Stripe signature.' }, 400);
  }
  if (!webhookSecret) {
     console.error('Webhook Error: Webhook secret is not configured on the server.');
    return createCorsResponse({ error: 'Webhook secret not configured.' }, 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return createCorsResponse({ error: `Webhook Error: ${err.message}` }, 400);
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
                // planId: plan.stripePriceId // Store the specific price ID - optional, if needed
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
      // You need a way to map stripeSubscriptionId back to your Firebase userId.
      // This usually involves querying your 'users' collection by 'stripeSubscriptionId'.
      // For this example, we'll assume you have a method or will implement one.
      // For instance, if client_reference_id was used in subscription metadata, or if you query users table by stripeCustomerId.
      // This part is crucial for production.
      if (updatedSubscription.customer) {
        // Placeholder: Find user by stripeCustomerId. In a real app, you'd query Firestore.
        // const user = await findUserByStripeCustomerId(updatedSubscription.customer as string);
        // if (user && user.id) {
        //   await updateUserSubscriptionInDb(user.id, {
        //     stripeSubscriptionId: updatedSubscription.id,
        //     subscriptionStatus: updatedSubscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
        //     subscriptionTier: 'hypertrophy' // This might need to be determined from the plan items.
        //   });
        // } else {
        //   console.error("Could not find user for subscription update:", updatedSubscription.id);
        // }
      }
      break;

    case 'customer.subscription.deleted': // Handles cancellations (at period end or immediate)
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${deletedSubscription.id} for customer ${deletedSubscription.customer}`);
      // Find user by stripeSubscriptionId or stripeCustomerId and update their status to 'canceled' or 'free' tier.
      // Example (requires finding the user):
      // const user = await findUserByStripeCustomerId(deletedSubscription.customer as string);
      // if (user && user.id) {
      //   await updateUserSubscriptionInDb(user.id, {
      //     subscriptionTier: 'free',
      //     subscriptionStatus: 'canceled',
      //     stripeSubscriptionId: null, // Or keep the ID but mark as inactive
      //   });
      // } else {
      //    console.error("Could not find user for subscription deletion:", deletedSubscription.id);
      // }
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      const subIdForInvoice = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      const customerIdForInvoice = typeof invoice.customer === 'string' ? invoice.customer : null;

      console.log(`Invoice payment succeeded for customer: ${customerIdForInvoice}, subscription: ${subIdForInvoice}`);
      // Ensure subscription remains active. Usually Stripe handles this, but you might want to confirm/log.
      // If a subscription was 'past_due', this might make it 'active' again.
      // Example (requires finding the user):
      // if (customerIdForInvoice && subIdForInvoice) {
      //    const user = await findUserByStripeCustomerId(customerIdForInvoice);
      //    if (user && user.id) {
      //        await updateUserSubscriptionInDb(user.id, {
      //             stripeSubscriptionId: subIdForInvoice,
      //             stripeCustomerId: customerIdForInvoice,
      //             subscriptionTier: 'hypertrophy', // Or determine from subscription items
      //             subscriptionStatus: 'active',
      //        });
      //    } else {
      //        console.error("Could not find user for invoice payment succeeded:", subIdForInvoice);
      //    }
      // }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      const subIdForFailedInvoice = typeof failedInvoice.subscription === 'string' ? failedInvoice.subscription : null;
      const customerIdForFailedInvoice = typeof failedInvoice.customer === 'string' ? failedInvoice.customer : null;

      console.log(`Invoice payment failed for customer: ${customerIdForFailedInvoice}, subscription: ${subIdForFailedInvoice}`);
      // Notify user, update subscription status (e.g., to 'past_due').
      // Example (requires finding the user):
      // if (customerIdForFailedInvoice && subIdForFailedInvoice) {
      //    const user = await findUserByStripeCustomerId(customerIdForFailedInvoice);
      //    if (user && user.id) {
      //        await updateUserSubscriptionInDb(user.id, {
      //             stripeSubscriptionId: subIdForFailedInvoice,
      //             stripeCustomerId: customerIdForFailedInvoice,
      //             subscriptionTier: 'hypertrophy', // Or determine from subscription items
      //             subscriptionStatus: 'past_due', 
      //        });
      //    } else {
      //        console.error("Could not find user for invoice payment failed:", subIdForFailedInvoice);
      //    }
      // }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return createCorsResponse({ received: true }, 200);
}

// Dummy MOCK_SUBSCRIPTION_PLANS needed for the webhook logic to find plan details
// This should ideally be fetched from a config or a more robust source if plans change.
const MOCK_SUBSCRIPTION_PLANS = [
  { id: "free", name: "FitFlow Basic", price: "Free", features: [], stripePriceId: "" },
  { id: "hypertrophy", name: "FitFlow Hypertrophy", price: "$14.99/month", features: [], stripePriceId: "price_1RTTxuLZkqAmFk4bPvEANF0J" }, // Ensure this matches your actual plan ID
];
