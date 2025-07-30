import Stripe from 'stripe'
import { User, StripeSubscription } from '../types'
import { generateId } from './utils'

export class StripeService {
  private stripe: Stripe

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-09-30.acacia',
    })
  }

  async createCustomer(user: User): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
        company: user.company || ''
      }
    })

    return customer.id
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
      },
    })

    return session.url!
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session.url
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId)
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId)
  }

  async constructWebhookEvent(payload: string, signature: string, secret: string): Promise<Stripe.Event> {
    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<{ userId?: string; action: string; data: any }> {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription
        const customer = await this.stripe.customers.retrieve(subscription.customer as string)
        
        if (customer.deleted) {
          throw new Error('Customer not found')
        }

        return {
          userId: customer.metadata?.userId,
          action: 'subscription_updated',
          data: {
            subscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelledAt: subscription.canceled_at,
            planId: subscription.items.data[0]?.price.id
          }
        }

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        const invoiceCustomer = await this.stripe.customers.retrieve(invoice.customer as string)
        
        if (invoiceCustomer.deleted) {
          throw new Error('Customer not found')
        }

        return {
          userId: invoiceCustomer.metadata?.userId,
          action: 'payment_succeeded',
          data: {
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
            subscriptionId: invoice.subscription
          }
        }

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        const failedCustomer = await this.stripe.customers.retrieve(failedInvoice.customer as string)
        
        if (failedCustomer.deleted) {
          throw new Error('Customer not found')
        }

        return {
          userId: failedCustomer.metadata?.userId,
          action: 'payment_failed',
          data: {
            invoiceId: failedInvoice.id,
            amount: failedInvoice.amount_due,
            subscriptionId: failedInvoice.subscription
          }
        }

      default:
        return {
          action: 'unhandled_event',
          data: { type: event.type }
        }
    }
  }

  // Predefined pricing plans
  static readonly PLANS = {
    starter: {
      priceId: 'price_starter_monthly',
      name: 'Starter',
      price: 9,
      features: {
        chatbots: 1,
        conversations: 100,
        documents: 10
      }
    },
    pro: {
      priceId: 'price_pro_monthly',
      name: 'Pro',
      price: 29,
      features: {
        chatbots: 5,
        conversations: 1000,
        documents: -1 // unlimited
      }
    }
  }
}