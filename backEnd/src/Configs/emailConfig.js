import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const TOKEN = process.env.MAILTRAP_TOKEN;
console.log(TOKEN);

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};

const sendEmail = async (subject, text, recipient) => {
  const recipients = [
    {
      email: recipient,
    },
  ];

  try {
    await client.send({
      from: sender,
      to: recipients,
      subject,
      text,
      category: "test ",
    });
  } catch (error) {
    console.error("error from mailtrap", error?.message);
  }
};

export default sendEmail;
