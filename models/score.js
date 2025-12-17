const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    attempts: { type: Number, required: true },
    level: { type: String, enum: ["Easy", "Medium", "Hard"], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Score", scoreSchema);
