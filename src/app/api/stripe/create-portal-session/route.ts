
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth as adminAuth } from 'firebase-admin'; // Assuming you might need admin for user lookup later if not passing ID
import { 앱이름 } from '@/lib/constants'; // Assuming APP_NAME might be used or you have a similar constant for return_url base

// Initialize Firebase Admin if not already initialized (important for server-side operations)
// This part would typically be in a separate firebase-admin-init.js file and imported
// For simplicity here, it's conceptual. Ensure admin is initialized in your actual setup if needed.
// import { initializeAdminApp } from '@/lib/firebase-admin'; // hypothetical
// initializeAdminApp();


export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Stripe Customer ID é obrigatório.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/subscribe`, // Usuário retorna para a página de assinatura
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Erro ao criar sessão do Stripe Portal:', error);
    return NextResponse.json({ error: error.message || 'Falha ao criar sessão do portal.' }, { status: 500 });
  }
}
