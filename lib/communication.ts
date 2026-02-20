import { db } from "@/db"
import { eq } from "drizzle-orm"
import { clinics } from "@/db/schema"

import twilio from "twilio"
import sgMail from "@sendgrid/mail"

export class CommunicationService {
    /**
     * Creates a Twilio subaccount for a clinic and saves credentials to the database.
     */
    static async provisionClinic(clinicId: string) {
        const clinicRows = await db.select().from(clinics).where(eq(clinics.id, clinicId))
        const clinic = clinicRows[0]
        if (!clinic) throw new Error("Clinic not found")

        // Ensure master credentials exist
        const masterSid = process.env.TWILIO_ACCOUNT_SID;
        const masterToken = process.env.TWILIO_AUTH_TOKEN;

        if (!masterSid || !masterToken) {
            throw new Error("Master Twilio credentials not configured.");
        }

        const client = twilio(masterSid, masterToken);

        // Create Subaccount
        const subaccount = await client.api.v2010.accounts.create({
            friendlyName: `Clinic: ${clinic.name}`,
        });

        // Store credentials
        await db.update(clinics).set({
            twilioSid: subaccount.sid,
            twilioToken: subaccount.authToken
        }).where(eq(clinics.id, clinicId));

        return { success: true, sid: subaccount.sid };
    }

    /**
     * Sends an SMS. Will use mock mode if configured or if credentials are not fully available.
     */
    static async sendSms({ to, body, clinicId }: { to: string, body: string, clinicId?: string }) {
        if (process.env.COMMUNICATION_MODE === "mock") {
            console.log(`[MOCK SMS] To: ${to} | Body: ${body} | ClinicId: ${clinicId}`)
            return { success: true, mock: true }
        }

        if (!clinicId) throw new Error("Clinic ID required for live SMS");

        const clinicRows = await db.select().from(clinics).where(eq(clinics.id, clinicId));
        const clinic = clinicRows[0];

        if (!clinic || !clinic.twilioSid || !clinic.twilioToken) {
            console.warn(`[SMS Fallback] No Twilio credentials for clinic ${clinicId}. Mocking SMS.`);
            return { success: true, mock: true, warning: "Missing credentials" };
        }

        const client = twilio(clinic.twilioSid, clinic.twilioToken);

        // Fetch a number belonging to this subaccount. If none, we might fail or need pooling.
        // For now, assuming they have a number provisioned or use a registered alphanumeric sender.
        // (In a real scenario, we'd look up the clinic's assigned incoming phone number Sid).
        const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 1 });
        const fromNumber = incomingNumbers.length > 0 ? incomingNumbers[0].phoneNumber : process.env.DEFAULT_TWILIO_NUMBER;

        if (!fromNumber) throw new Error("No available Twilio number for sending.");

        await client.messages.create({
            body,
            from: fromNumber,
            to
        });

        return { success: true, mock: false };
    }

    /**
     * Sends an Email. Will use mock mode if configured or if credentials are not fully available.
     */
    static async sendEmail({ to, subject, html, clinicId }: { to: string, subject: string, html: string, clinicId?: string }) {
        if (process.env.COMMUNICATION_MODE === "mock") {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | ClinicId: ${clinicId}`)
            return { success: true, mock: true }
        }

        if (!clinicId) throw new Error("Clinic ID required for live Email");

        const clinicRows = await db.select().from(clinics).where(eq(clinics.id, clinicId));
        const clinic = clinicRows[0];

        if (!clinic || !clinic.sendgridApiKey) {
            console.warn(`[Email Fallback] No SendGrid credentials for clinic ${clinicId}. Mocking Email.`);
            return { success: true, mock: true, warning: "Missing credentials" };
        }

        sgMail.setApiKey(clinic.sendgridApiKey);

        // Dynamically set from email or use a default
        const fromEmail = clinic.doctorEmail || "notifications@kat-clinic.com";

        await sgMail.send({
            to,
            from: {
                email: fromEmail,
                name: clinic.name
            },
            subject,
            html
        });

        return { success: true, mock: false };
    }
}
