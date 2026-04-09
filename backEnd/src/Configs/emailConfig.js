import { MailtrapClient } from "mailtrap";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
//   throw new Error("Email credentials are missing in .env");
// }

const transporter = nodemailer.createTransport({
  // host: "smtp.gmail.com",
  // port: 587,
  // secure: false,
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

export const sendEmail = async (subject, text, to) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const TOKEN = process.env.MAILTRAP_TOKEN;
console.log(TOKEN);

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};

// const sendEmail = async (subject, text, recipient) => {
//   const recipients = [
//     {
//       email: recipient,
//     },
//   ];

//   try {
//     await client.send({
//       from: sender,
//       to: recipients,
//       subject,
//       text,
//       category: "test ",
//     });
//   } catch (error) {
//     console.error("Error sending email:", error.message);
//   }
// };

export default sendEmail;
