
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const contactSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(5000),
    website: z.string().optional(), // Honeypot
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = contactSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Please check your details and try again." },
                { status: 400 },
            );
        }

        const { name, email, subject, message, website } = result.data;

        // Silently accept bot submissions caught by the honeypot.
        if (website) {
            return NextResponse.json({ success: true });
        }

        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT);
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
            return NextResponse.json(
                { error: "Contact service is temporarily unavailable." },
                { status: 500 },
            );
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"Vistaar Contact Form" <${smtpUser}>`,
            to: smtpUser,
            replyTo: email,
            subject: `[Vistaar Contact] ${subject.replace(/[\r\n]/g, " ")}`,
            text: [
                "New contact form submission",
                "",
                `Name: ${name}`,
                `Email: ${email}`,
                `Subject: ${subject}`,
                "",
                "Message:",
                message,
            ].join("\n"),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);

        return NextResponse.json(
            { error: "Unable to send your message right now. Please try again." },
            { status: 500 },
        );
    }
}