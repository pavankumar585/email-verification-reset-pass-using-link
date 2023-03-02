const mongoose = require("mongoose");
const moment = require("moment");

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  resetString: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: moment(),
  },
  expiresIn: {
    type: Date,
    default: moment().add(1, "hour"),
  },
});

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);

module.exports = PasswordReset;
