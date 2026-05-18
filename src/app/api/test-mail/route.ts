import { NextResponse } from "next/server";
import { transporter } from "@/lib/mail";

export async function GET() {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL,
            subject: "AtomQuest SMTP Test",
            text: "SMTP is working successfully 🚀",
            html: `
        <div style="font-family:sans-serif;padding:20px">
          <h2>AtomQuest SMTP Test</h2>
          <p>Email notifications are working successfully.</p>
        </div>
      `,
        });

        return NextResponse.json({
            success: true,
            message: "Test email sent successfully",
        });
    } catch (error) {
        console.error("EMAIL ERROR:", error);

        return NextResponse.json({
            success: false,
            error: String(error),
        });
    }
}
