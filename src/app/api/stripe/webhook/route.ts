
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants';

// Helper function to update user data in Firestore
async function updateUserSubscriptionInDb(
  userId: string,
  data: Partial<UserProfile>
) {
  if (!userId) {
    console.error('updateUserSubscriptionInDb: Missing userId');
    throw new Error('ID de usuário ausente ao tentar atualizar a assinatura.');
  }
  try {
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.set({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Subscription updated in DB for user ${userId}:`, data);
  } catch (error: any) {
    console.error(`Error updating subscription in DB for user ${userId}:`, error);
    // Re-throw the error with a more specific message
    throw new Error(`Erro de permissão ou falha ao atualizar o banco de dados para o usuário ${userId}: ${error.message}`);
  }
}

// Helper function to find user by Stripe Customer ID
async function findUserByStripeCustomerId(stripeCustomerId: string): Promise<UserProfile | null> {
    const usersRef = adminDb.collection('users');
    const q = usersRef.where("stripeCustomerId", "==", stripeCustomerId);
    const querySnapshot = await q.get();
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
}


export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CRITICAL: STRIPE_WEBHOOK_SECRET não está configurado no servidor.");
    return NextResponse.json({ error: 'Webhook secret não configurado no servidor.' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Signature Verification Error: ${err.message}` }, { status: 400 });
  }

  try {
    console.log('Stripe Webhook Event Received:', event.type);

    switch (event.type) {
      // Step 1 & 2: Link user and grant access on successful payment.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        // This event can fire for various reasons, we only care about successful subscription payments.
        if (session.payment_status === 'paid' && userId) {
            // Retrieve the session with line_items expanded to reliably get the priceId.
            const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
                session.id,
                { expand: ['line_items'] }
            );
            const lineItems = sessionWithLineItems.line_items;

            const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
            const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
            const priceId = lineItems?.data[0]?.price?.id;
            const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);

            if (customerId && subscriptionId && plan) {
                await updateUserSubscriptionInDb(userId, {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    subscriptionTier: plan.id as 'free' | 'hypertrophy',
                    subscriptionStatus: 'active',
                });
                console.log(`User ${userId} subscription activated for plan ${plan.id}`);
            } else {
                 // Fallback if we can't activate here, just link the customer
                 if(customerId) {
                    await updateUserSubscriptionInDb(userId, { stripeCustomerId: customerId });
                    console.log(`User ${userId} linked with Stripe Customer ${customerId}. Activation will follow from other events.`);
                 }
                console.error('checkout.session.completed with paid status, but missing data for full activation.', { customerId, subscriptionId, planExists: !!plan });
            }
        } else {
          console.log(`checkout.session.completed event for user ${userId} ignored. Status: ${session.payment_status}.`);
        }
        break;
      }

      // Step 3: Handle renewals.
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // This handles renewals. Initial activation is now handled by checkout.session.completed.
        // We only care about invoices related to a subscription.
        if (invoice.billing_reason === 'subscription_cycle') {
            const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
            const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as Stripe.Subscription)?.id;
        
            if (!customerId || !subscriptionId) {
                console.error('invoice.payment_succeeded (renewal) event missing customer or subscription ID.');
                break;
            }
            
            const user = await findUserByStripeCustomerId(customerId);
            if (user && user.id) {
                const lineItem = invoice.lines.data[0];
                const priceId = lineItem?.price?.id;
                const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);
                
                if (plan) {
                    await updateUserSubscriptionInDb(user.id, {
                        stripeSubscriptionId: subscriptionId,
                        subscriptionTier: plan.id as 'free' | 'hypertrophy', 
                        subscriptionStatus: 'active',
                    });
                     console.log(`Subscription renewal processed for user ${user.id}`);
                } else {
                    console.warn(`Could not find a plan matching priceId ${priceId} from renewal invoice ${invoice.id}.`);
                }
            } else {
                console.error("Could not find user for invoice.payment_succeeded (renewal) by customer ID:", customerId);
            }
        } else {
             console.log(`invoice.payment_succeeded event ignored. Reason: ${invoice.billing_reason}`);
        }
        break;
      }
        
      // Step 4: Handle subscription changes (e.g., cancellation).
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as Stripe.Customer)?.id;

        if (!customerId) {
            console.error('subscription.updated/deleted event without a customer ID.');
            break;
        }

        const user = await findUserByStripeCustomerId(customerId);
        if (user && user.id) {
          // For cancellations (immediate or at period end)
          if (subscription.status === 'canceled' || event.type === 'customer.subscription.deleted' || subscription.cancel_at_period_end) {
            await updateUserSubscriptionInDb(user.id, {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null, 
            });
            console.log(`Subscription canceled for user ${user.id}`);
          } else {
             // For other updates (e.g., past_due, active, or plan changes)
             const priceId = subscription.items.data[0]?.price.id;
             const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);
             await updateUserSubscriptionInDb(user.id, {
                subscriptionStatus: subscription.status,
                subscriptionTier: plan ? (plan.id as 'free' | 'hypertrophy') : user.subscriptionTier,
                stripeSubscriptionId: subscription.id,
             });
             console.log(`Subscription status updated to ${subscription.status} for user ${user.id}`);
          }
        } else {
            console.error("Could not find user for subscription update/delete by customer ID:", customerId);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }
  } catch (processingError: any) {
    console.error(`---! WEBHOOK PROCESSING ERROR !---`);
    console.error(`Event Type: ${event.type}`);
    console.error('Error Details:', processingError);
    if (processingError instanceof Error) {
        console.error('Stack Trace:', processingError.stack);
    }
    
    let errorMessage = 'An unknown error occurred during webhook processing.';
    if (processingError instanceof Error) {
        errorMessage = processingError.message;
    } else if (typeof processingError === 'string') {
        errorMessage = processingError;
    }

    return NextResponse.json(
        { 
            error: `Webhook processing failed. Event: ${event.type}. Reason: ${errorMessage}` 
        }, 
        { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
