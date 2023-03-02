const _ = require("lodash");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const validator = require("../middleware/validator");

router.post("/", [validator(validate)], async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  if (!user.verified)
    return res
      .status(400)
      .send("Email hasn't been verified yet. Check your inbox.");

  const token = user.genAuthToken();

  user = _.pick(user, ["_id", "name", "email"]);
  res.setHeader("Authorization", `Bearer ${token}`).send(user);
});

function validate(auth) {
  const schema = Joi.object({
    email: Joi.string().email().required().min(10).max(50),
    password: Joi.string().min(8).max(50),
  });

  return schema.validate(auth);
}

module.exports = router;
