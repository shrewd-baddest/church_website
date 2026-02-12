import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const x=nodemailer.createTransport(
    {
        service:'gmail',
        auth:{
            user:process.env.MAIL_USER,
            password:process.env.MAIL_PASSWORD
        }
    }
)


export const sendMail=async(to,subject,text)=>{
    const mailOptions={
from:process.env.FROM_MAIL,
to,
subject,
text
    };
try {
await x.sendMail(mailOptions);
console.log('message sent successfully');
    
} catch (error) {
  console.error(error.message)  ;
}
}