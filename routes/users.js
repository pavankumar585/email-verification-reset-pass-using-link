const moment = require("moment");
const path = require("path");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { User, validate } = require("../models/user");
const validator = require("../middleware/validator");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateId = require("../middleware/validateId");
const UserVerification = require("../models/userVerification");
const PasswordReset = require("../models/passwordReset");

router.get("/me", [auth], async (req, res) => {
  const user = await User.findOne({ _id: req.user._id }).select("-password");

  res.send(user);
});

router.get("/", [auth, admin], async (req, res) => {
  const users = await User.find({ isAdmin: false }).select("-password");

  res.send(users);
});

router.post("/", [validator(validate)], async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already exist.");

  user = new User(req.body);
  user.password = await bcrypt.hash(user.password, 10);
  await user.save();

  user.sendVerificationEmail(user, res);
});

router.get("/verify/:id/:string", [validateId], async (req, res) => {
  const { id: userId, string: uniqueString } = req.params;
  const userVerification = await UserVerification.findOne({ userId });

  if (!userVerification) {
    const message =
      "Account doesn't exist or has been verified already. please signup or login.";
    res.redirect(`/api/users/verified?error=true&message=${message}`);
    return;
  }

  if (moment(userVerification.expiresIn).isBefore(moment())) {
    await UserVerification.deleteOne({ userId });
    await User.deleteOne({ _id: userId });
    const message = "Link has expired. please signup again.";
    res.redirect(`/api/users/verified?error=true&message=${message}`);
    return;
  }

  const validUniqueString = await bcrypt.compare(
    uniqueString,
    userVerification.uniqueString
  );

  if (!validUniqueString) {
    const message = "Invalid verification details passed. Check your inbox.";
    res.redirect(`/api/users/verified?error=true&message=${message}`);
    return;
  }

  await User.updateOne({ _id: userId }, { $set: { verified: true } });
  await UserVerification.deleteOne({ userId });

  res.sendFile(path.join(__dirname, "../views/verified.html"));
});

router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/verified.html"));
});

module.exports = router;
