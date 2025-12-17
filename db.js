const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://divinkumar02012002_db_user:divin123@flyers-soft.jndrtke.mongodb.net/game";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("\nMongoDB Connected Successfully\n");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
