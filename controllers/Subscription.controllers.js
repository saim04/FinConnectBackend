import Stripe from "stripe";
import Subscription from "../models/Subscription.model.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, userEmail } = req.body;
    const id = req.user.id;

    console.log(id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      client_reference_id: id,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("WEBHOOK INVOKED");

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { client_reference_id: userId, subscription, customer } = session;

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription
      );

      console.log("SUBSCRIPTION", stripeSubscription);

      await Subscription.create({
        userId,
        stripeCustomerId: customer,
        stripeSubscriptionId: subscription,
        plan: stripeSubscription.items.data[0].price.id || "Unknown",
        status: stripeSubscription.status,
        startDate: new Date(stripeSubscription.start_date * 1000),
        endDate: new Date(
          stripeSubscription.items.data[0].current_period_end * 1000
        ),
        nextBillingDate: new Date(
          stripeSubscription.items.data[0].current_period_end * 1000
        ),
        amount: stripeSubscription.items.data[0].price.unit_amount,
        currency: stripeSubscription.items.data[0].price.currency,
      });

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
      });

      if (subscription) {
        subscription.status = "past_due";
        await subscription.save();
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription,
      });

      if (subscription) {
        subscription.status = "active";
        subscription.nextBillingDate = new Date(
          invoice.lines.data[0].period.end * 1000
        );
        await subscription.save();
      }
      break;
    }

    case "customer.subscription.deleted": {
      const deleted = event.data.object;
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: deleted.id,
      });

      if (subscription) {
        subscription.status = "canceled";
        subscription.endDate = new Date(deleted.ended_at * 1000);
        await subscription.save();
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  For Admin
export const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find user's subscription in the database
    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Cancel the subscription immediately in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
      invoice_now: true,
      prorate: true,
    });

    // Update subscription status in the database
    subscription.status = "canceled";
    subscription.endDate = new Date();
    await subscription.save();

    return res.status(200).json({
      message: "Subscription canceled successfully",
      subscription,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};
