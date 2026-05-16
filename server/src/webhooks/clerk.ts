import type { Request, Response } from "express";
import { getEnv } from "../lib/env";
import { verifyWebhook } from "@clerk/express/webhooks";
import { parseRole } from "../lib/roles";
import { db } from "../databases";
import { users } from "../databases/schema";
import { eq } from "drizzle-orm";

export async function clerkWebhookHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const env = getEnv();

  //   Webhook verification is crucial for security. If the secret is not set, we should not process the webhook as we can't trust incoming requests without it.
  if (!env.CLERK_WEBHOOK_SECRET) {
    console.warn(
      "CLERK_WEBHOOK_SECRET is not set. Skipping webhook verification.",
    );
    res.status(503).send("Webhook secret not configured");
    return;
  }

  try {
    // Throws error if signature is wrong or body tempered with. Always wrap in try/catch to handle invalid webhooks gracefully.
    const evt = await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    if (evt.type === "user.created" || evt.type === "user.updated") {
      // Handle the evt (e.g., user.created, user.updated, etc.)
      const user = evt.data;

      const email =
        user.email_addresses?.find(
          (email) => email.id === user.primary_email_address_id,
        )?.email_address ?? user.email_addresses?.[0]?.email_address;

      const phone =
        user.phone_numbers?.find(
          (phone) => phone.id === user.primary_phone_number_id,
        )?.phone_number ?? user.phone_numbers?.[0]?.phone_number;

      const displayName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username ||
        "Unknown User";

      const role = parseRole(user.public_metadata?.role);

      await db
        .insert(users)
        .values({ clerkUserId: user.id, email, phone, displayName, role })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, phone, displayName, role, updatedAt: new Date() },
        });

      console.log("Received Clerk webhook event:", evt);
    }

    if (evt.type === "user.deleted") {
      const user = evt.data;

      if (user && user.id) {
        await db.delete(users).where(eq(users.clerkUserId, user.id));
        console.log(
          "Deleted user from database due to Clerk webhook event:",
          evt,
        );

        res.status(200).json({ message: "User deleted", ok: true });
      }
    }
  } catch (error) {
    // Bad signature, malformed payload, DB error - do not leak details to the client, but log for debugging.
    console.error("Error processing Clerk webhook:", error);
    res.status(400).send("Invalid webhook");
    return;
  }

  // Respond to acknowledge receipt of the webhook
  res.status(200).send("Webhook received");
}
