
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants'; // Ensure this path is correct

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
  data: Partial<UserProfile>
) {
  if (!userId) {
    console.error('updateUserSubscriptionInDb: Missing userId');
    return;
  }
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`Subscription updated in DB for user ${userId}:`, data);
  } catch (error) {
    console.error(`Error updating subscription in DB for user ${userId}:`, error);
  }
}

// Helper function to find user by Stripe Customer ID
async function findUserByStripeCustomerId(stripeCustomerId: string): Promise<UserProfile | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("stripeCustomerId", "==", stripeCustomerId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        // Assuming one user per customer ID
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
}


export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('FATAL: STRIPE_WEBHOOK_SECRET is not set in .env. Webhook processing cannot continue.');
    return createCorsResponse({ error: 'Webhook secret not configured on the server.' }, 500);
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook Error: Missing Stripe-Signature header.');
    return createCorsResponse({ error: 'Missing Stripe-Signature header.' }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook Signature Verification Failed: ${err.message}. \n>>> IMPORTANT: This usually means the STRIPE_WEBHOOK_SECRET environment variable on your server (e.g., Vercel) does not match the 'Signing secret' for the LIVE webhook endpoint in your Stripe Dashboard. Please check and update the variable.`);
    return createCorsResponse({ error: `Webhook Signature Verification Error: ${err.message}` }, 400);
  }

  try {
    console.log('Stripe Webhook Event Received:', event.type, event.data.object?.id);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id; 
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        const customerId = typeof session.customer === 'string' ? session.customer : null;
        
        console.log(`Checkout session completed for user ID: ${userId}. Linking with Customer ID: ${customerId}`);

        // The primary job of this event is to create the link between our user and Stripe's customer.
        if (userId && customerId && subscriptionId) {
            await updateUserSubscriptionInDb(userId, {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
            });
        } else {
          console.error('Checkout session completed but missing critical info to link user.', { userId, customerId, subscriptionId });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        const subIdForInvoice = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        const customerIdForInvoice = typeof invoice.customer === 'string' ? invoice.customer : null;

        console.log(`Invoice payment succeeded for customer: ${customerIdForInvoice}, subscription: ${subIdForInvoice}`);
        
        // This is the reliable event for provisioning access (for new subscriptions and renewals).
        if (customerIdForInvoice && subIdForInvoice) {
           const user = await findUserByStripeCustomerId(customerIdForInvoice);
           if (user && user.id) {
               const lineItem = invoice.lines.data[0];
               if (!lineItem || !lineItem.price) {
                 console.error(`Invoice ${invoice.id} for customer ${customerIdForInvoice} has no line items or price.`);
                 break;
               }
               const priceId = lineItem.price.id;
               const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);
               
               if (plan) {
                    await updateUserSubscriptionInDb(user.id, {
                        stripeSubscriptionId: subIdForInvoice,
                        subscriptionTier: plan.id as 'free' | 'hypertrophy', 
                        subscriptionStatus: 'active',
                    });
               } else {
                   console.error(`Could not find a plan in MOCK_SUBSCRIPTION_PLANS matching priceId ${priceId} from invoice ${invoice.id}.`);
               }
           } else {
               console.error("Could not find user for invoice payment succeeded by customer ID:", customerIdForInvoice);
           }
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${updatedSubscription.id} for customer ${updatedSubscription.customer}, status: ${updatedSubscription.status}`);
        if (updatedSubscription.customer) {
          const userToUpdate = await findUserByStripeCustomerId(updatedSubscription.customer as string);
          if (userToUpdate && userToUpdate.id) {
            await updateUserSubscriptionInDb(userToUpdate.id, {
              stripeSubscriptionId: updatedSubscription.id,
              subscriptionStatus: updatedSubscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
            });
          } else {
            console.error("Could not find user for subscription update by customer ID:", updatedSubscription.customer);
          }
        }
        break;

      case 'customer.subscription.deleted': 
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${deletedSubscription.id} for customer ${deletedSubscription.customer}`);
        if (deletedSubscription.customer) {
          const userToUpdate = await findUserByStripeCustomerId(deletedSubscription.customer as string);
          if (userToUpdate && userToUpdate.id) {
            await updateUserSubscriptionInDb(userToUpdate.id, {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null, 
            });
          } else {
             console.error("Could not find user for subscription deletion by customer ID:", deletedSubscription.customer);
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        const subIdForFailedInvoice = typeof failedInvoice.subscription === 'string' ? failedInvoice.subscription : null;
        const customerIdForFailedInvoice = typeof failedInvoice.customer === 'string' ? failedInvoice.customer : null;

        console.log(`Invoice payment failed for customer: ${customerIdForFailedInvoice}, subscription: ${subIdForFailedInvoice}`);
        if (customerIdForFailedInvoice) {
           const user = await findUserByStripeCustomerId(customerIdForFailedInvoice);
           if (user && user.id) {
               await updateUserSubscriptionInDb(user.id, {
                    subscriptionStatus: 'past_due', 
               });
           } else {
               console.error("Could not find user for invoice payment failed by customer ID:", customerIdForFailedInvoice);
           }
        }
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (processingError: any) {
    console.error(`Error processing webhook event ${event.type} (ID: ${event.id || 'N/A'}):`, processingError);
    return createCorsResponse({ error: `Webhook event processing error: ${processingError.message}` }, 500);
  }

  return createCorsResponse({ received: true }, 200);
}
