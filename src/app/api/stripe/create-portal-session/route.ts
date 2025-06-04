
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { APP_NAME } from '@/lib/constants';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: 'Stripe Customer ID é obrigatório.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    console.log(`Tentando criar sessão do portal para o customerId: ${customerId}`);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/subscribe`, 
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Erro ao criar sessão do Stripe Portal:', error);
    let errorMessage = 'Falha ao criar sessão do portal.';
    let statusCode = 500;

    if (error instanceof stripe.errors.StripeError) {
      switch (error.type) {
        case 'StripeInvalidRequestError':
          if (error.message.toLowerCase().includes('no such customer')) {
            errorMessage = `Cliente Stripe não encontrado: ${customerId}. Este ID pode ser de um ambiente diferente (Teste vs. Live) ou o cliente foi excluído.`;
            statusCode = 404; 
          } else if (error.message.toLowerCase().includes("customer a similar object exists in live mode, but a test mode key was used") || error.message.toLowerCase().includes("customer a similar object exists in test mode, but a live mode key was used")) {
            errorMessage = `Conflito de ambiente de chaves Stripe: O ID do cliente '${customerId}' parece ser de um ambiente (Teste/Live) diferente do ambiente das chaves de API que estão sendo usadas. Verifique suas chaves de API e o ID do cliente.`;
            statusCode = 400;
          } else {
            errorMessage = `Erro de requisição inválida do Stripe: ${error.message}`;
            statusCode = 400;
          }
          break;
        case 'StripeAPIError':
          errorMessage = `Erro na API do Stripe: ${error.message}`;
          statusCode = 502; // Bad Gateway, pois é um erro do Stripe
          break;
        case 'StripeConnectionError':
          errorMessage = `Erro de conexão com o Stripe: ${error.message}`;
          statusCode = 503; // Service Unavailable
          break;
        case 'StripeAuthenticationError':
          errorMessage = `Erro de autenticação com o Stripe: ${error.message}. Verifique suas chaves de API.`;
          statusCode = 401;
          break;
        default:
          errorMessage = `Erro inesperado do Stripe: ${error.message}`;
          statusCode = 500;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error(`Retornando erro ${statusCode}: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
