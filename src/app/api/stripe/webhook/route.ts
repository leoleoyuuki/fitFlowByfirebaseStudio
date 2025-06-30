
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants';

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
    // Re-throw a more specific error for the main handler
    throw new Error(`Erro de permissão ou falha ao atualizar o banco de dados para o usuário ${userId}: ${error.message}`);
  }
}

// Helper function to find user by Stripe Customer ID
async function findUserByStripeCustomerId(stripeCustomerId: string): Promise<UserProfile | null> {
    const usersRef = adminDb.collection('users');
    const q = usersRef.where("stripeCustomerId", "==", stripeCustomerId);
    const querySnapshot = await q.get();
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
    return createCorsResponse({ error: 'Webhook secret não configurado no servidor.' }, 500);
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
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        
        console.log(`Checkout session completed for user ID: ${userId}. Linking with Customer ID: ${customerId}`);

        // The primary job of this event is to create the link between our user and Stripe's customer.
        if (userId && customerId) {
            await updateUserSubscriptionInDb(userId, {
                stripeCustomerId: customerId,
            });
        } else {
          console.error('Checkout session completed but missing critical info to link user.', { userId, customerId });
        }
        break;

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // This is a more robust way to get customer and subscription IDs.
        const customerIdForInvoice = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
        const subIdForInvoice = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as Stripe.Subscription)?.id;
        
        if (!customerIdForInvoice || !subIdForInvoice) {
            console.error('invoice.payment_succeeded event without customer or subscription ID.', { customer: invoice.customer, subscription: invoice.subscription });
            break;
        }

        console.log(`Invoice payment succeeded for customer: ${customerIdForInvoice}, subscription: ${subIdForInvoice}`);
        
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
        break;
      }
        
      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object as Stripe.Subscription;
        const customerIdForUpdate = typeof updatedSubscription.customer === 'string' ? updatedSubscription.customer : (updatedSubscription.customer as Stripe.Customer)?.id;

        if (!customerIdForUpdate) {
            console.error('customer.subscription.updated event without a customer ID.');
            break;
        }

        console.log(`Subscription updated: ${updatedSubscription.id} for customer ${customerIdForUpdate}, status: ${updatedSubscription.status}`);

        const userToUpdate = await findUserByStripeCustomerId(customerIdForUpdate);
        if (userToUpdate && userToUpdate.id) {
            const priceId = updatedSubscription.items.data[0]?.price.id;
            const plan = MOCK_SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);

            const dataToUpdate: Partial<UserProfile> = {
                stripeSubscriptionId: updatedSubscription.id,
                subscriptionStatus: updatedSubscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
            };

            if (plan) {
                dataToUpdate.subscriptionTier = plan.id as 'free' | 'hypertrophy';
            } else {
                console.warn(`Webhook: customer.subscription.updated: Could not find a plan matching priceId ${priceId}. Subscription tier not updated.`);
            }
            
            // Handle cancelation at period end vs immediate cancelation
            if (updatedSubscription.status === 'canceled' || updatedSubscription.cancel_at_period_end) {
                dataToUpdate.subscriptionStatus = 'canceled';
                dataToUpdate.subscriptionTier = 'free';
                dataToUpdate.stripeSubscriptionId = null;
            }

            await updateUserSubscriptionInDb(userToUpdate.id, dataToUpdate);
        } else {
            console.error("Could not find user for subscription update by customer ID:", customerIdForUpdate);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const customerIdForDelete = typeof deletedSubscription.customer === 'string' ? deletedSubscription.customer : (deletedSubscription.customer as Stripe.Customer)?.id;

        if (!customerIdForDelete) {
            console.error('customer.subscription.deleted event without a customer ID.');
            break;
        }
        
        console.log(`Subscription deleted: ${deletedSubscription.id} for customer ${customerIdForDelete}`);
        
        const userToDeleteSub = await findUserByStripeCustomerId(customerIdForDelete);
        if (userToDeleteSub && userToDeleteSub.id) {
            await updateUserSubscriptionInDb(userToDeleteSub.id, {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null, 
            });
        } else {
             console.error("Could not find user for subscription deletion by customer ID:", customerIdForDelete);
        }
        break;
      }
      
      default:
        // Quietly ignore unhandled events to prevent unnecessary noise in logs.
        // console.log(`Unhandled event type ${event.type}`);
    }
  } catch (processingError: any) {
    console.error(`Error processing webhook event ${event.type} (ID: ${event.id || 'N/A'}):`, processingError);
    // Return a 500 so Stripe knows to retry the webhook
    return createCorsResponse({ error: `Webhook event processing error: ${processingError.message}` }, 500);
  }

  return createCorsResponse({ received: true }, 200);
}
