const nodemailer = require("nodemailer");

const simpleTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.AUTH_EMAIL,
    clientId: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    refreshToken: process.env.AUTH_REFRESH_TOKEN,
  },
});

async function sendEmail() {
  const mailOptions = {
    from: process.env.AUTH_USER,
    to: "pavankumarmaddala585@gmail.com",
    subject: "testing node mailer",
    text: "Hi i'm pavan testing nodemailer",
  };

  await transporter.sendMail(mailOptions);
}

sendEmail();
