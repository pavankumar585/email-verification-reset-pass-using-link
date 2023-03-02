const bcrypt = require("bcrypt");
const Joi = require("joi");
const moment = require("moment");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const validator = require("../middleware/validator");
const PasswordReset = require("../models/passwordReset");

router.post(
  "/request-reset-password",
  [validator(requestRestPassword)],
  async (req, res) => {
    const { email, redirectUrl } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("Invalid email.");

    if (!user.verified)
      return res
        .status(400)
        .send("Email hasn't been verified yet. Check your inbox.");

    user.sendResetEmail(user, redirectUrl, res);
  }
);

router.post("/reset-password", [validator(restPassword)], async (req, res) => {
  const { userId, resetString, newPassword } = req.body;

  const passwordReset = await PasswordReset.findOne({ userId });
  if (!passwordReset)
    return res.status(400).send("Pasword reset request  not found.");

  if (moment(passwordReset.expiresIn).isBefore(moment())) {
    await PasswordReset.deleteOne({ userId });
    res.status(400).send("Password reset link has expired");
    return;
  }

  const validPasswordReset = await bcrypt.compare(
    resetString,
    passwordReset.resetString
  );

  if (!validPasswordReset)
    return res.status(400).send("Invalid password reset details passed.");

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: userId }, { $set: { password: hashed } });
  await PasswordReset.deleteOne({ userId });

  res.send("Pasword has been reset successfully.");
});

function requestRestPassword(req) {
  const schema = Joi.object({
    email: Joi.string().email().required().min(10).max(50),
    redirectUrl: Joi.string().required().min(20).max(255),
  });

  return schema.validate(req);
}

function restPassword(req) {
  const schema = Joi.object({
    userId: Joi.objectId().required(),
    resetString: Joi.string().required().min(50).max(70),
    newPassword: Joi.string().required().min(8).max(50),
  });

  return schema.validate(req);
}

module.exports = router;
