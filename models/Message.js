import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  fromName: { type: String },
  to: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: "text" }, // "text" o "image"
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
