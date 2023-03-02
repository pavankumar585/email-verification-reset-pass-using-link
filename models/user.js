const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const transporter = require("../config/transporter")();
const UserVerification = require("../models/userVerification");
const PasswordReset = require("../models/passwordReset");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 10,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 60,
  },

  verified: {
    type: Boolean,
    default: false,
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.genAuthToken = function () {
  const { _id, isAdmin } = this;

  return jwt.sign({ _id, isAdmin }, process.env.JWT_PRIVATE_KEY);
};

userSchema.methods.sendVerificationEmail = async function (user, res) {
  const { _id, email } = user;
  const currentUrl = process.env.CURRENT_URL;
  const uniqueString = uuidv4() + _id;
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Verify your email address to complete the signup and login to your account.</p>
           <p>This link will <b>expires in 6 hours</b>.</p>
           <p>Press <a href=${
             currentUrl + "users/verify/" + _id + "/" + uniqueString
           }>here</a> to proceed.</p>
           `,
  };

  const userVerification = new UserVerification({ userId: _id, uniqueString });
  const hashed = await bcrypt.hash(userVerification.uniqueString, 10);
  userVerification.uniqueString = hashed;
  await userVerification.save();

  await transporter.sendMail(mailOptions);
  res.send("Verification email sent.");
};

userSchema.methods.sendResetEmail = async function (user, redirectUrl, res) {
  const { _id, email } = user;
  const resetString = uuidv4() + _id;
  await PasswordReset.deleteMany({ userId: _id });
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Password Reset",
    html: `<p>We heared that you lost the password.</p>
    <p>Don't worry, use the link below to reset it.</p>
    <p>This link will <b>expires in 1 hour</b>.</p>
    <p>Press <a href=${
      redirectUrl + "/" + _id + "/" + resetString
    }>here</a> to proceed.</p>`,
  };

  const passwordReset = new PasswordReset({ userId: _id, resetString });
  passwordReset.resetString = await bcrypt.hash(passwordReset.resetString, 10);
  await passwordReset.save();

  await transporter.sendMail(mailOptions);
  res.send("Password reset email sent.");
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required().min(10).max(50),
    password: Joi.string().required().min(8).max(50),
  });

  return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validateUser;
