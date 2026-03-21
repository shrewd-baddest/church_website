import { MailtrapClient } from "mailtrap";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const x = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});
export const sendEmail = async (subject, text, to) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
  };

  try {
    await x.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
};

// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// const TOKEN = process.env.MAILTRAP_TOKEN;
// console.log(TOKEN);

// const client = new MailtrapClient({
//   token: TOKEN,
// });

// const sender = {
//   email: "hello@demomailtrap.co",
//   name: "Mailtrap Test",
// };

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
//     logger.info(`Email sent successfully to ${recipient} with subject: "${subject}"`);
//   } catch (error) {
//     logger.error(`Failed to send email to ${recipient} with subject: "${subject}" - ${error?.message}`);
//   }
// };

export default sendEmail;
