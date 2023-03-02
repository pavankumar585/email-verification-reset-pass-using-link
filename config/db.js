const mongoose = require("mongoose");

async function connectDb() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to ${process.env.MONGO_URI}`);
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = connectDb;
