import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationCode = async (
  email: string,
  code: string
) => {

  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Tu código de verificación",
    html: `
    <div style="
      font-family: Arial, Helvetica, sans-serif;
      background:#f5f7fb;
      padding:40px;
      text-align:center;
    ">

      <div style="
        max-width:500px;
        margin:auto;
        background:white;
        padding:40px;
        border-radius:10px;
        box-shadow:0 5px 20px rgba(0,0,0,0.08);
      ">

        <h2 style="margin-bottom:10px;color:#111;">
          Verificación de cuenta
        </h2>

        <p style="color:#555;margin-bottom:30px;">
          Usa el siguiente código para continuar:
        </p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:6px;
          background:#f0f3ff;
          padding:15px 25px;
          border-radius:8px;
          display:inline-block;
          color:#3b5bdb;
        ">
          ${code}
        </div>

        <p style="
          margin-top:30px;
          color:#777;
          font-size:14px;
        ">
          Este código expira en <b>10 minutos</b>.
        </p>

        <p style="
          margin-top:25px;
          color:#999;
          font-size:12px;
        ">
          Si no solicitaste este código puedes ignorar este mensaje.
        </p>

      </div>

    </div>
    `
  });

};