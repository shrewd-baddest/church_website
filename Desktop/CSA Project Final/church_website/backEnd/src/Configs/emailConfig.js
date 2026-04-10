import { MailtrapClient } from "mailtrap";


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
    logger.info(`Email sent successfully to ${recipient} with subject: "${subject}"`);
  } catch (error) {
    logger.error(`Failed to send email to ${recipient} with subject: "${subject}" - ${error?.message}`);
  }
};

export default sendEmail;
