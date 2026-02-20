import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Mocking email send.");
        console.dir({ to, subject, html }, { depth: null });
        return { success: true, mocked: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'Keep America Trucking <onboarding@resend.dev>', // Should be updated to a verified domain
            to,
            subject,
            html,
        });

        console.log("Email sent successfully", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}
