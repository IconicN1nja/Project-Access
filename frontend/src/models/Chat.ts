import mongoose, { Schema } from "mongoose";

const SourceDocSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String },
  snippet: { type: String },
  score: { type: Number },
  act_title: { type: String },
  section_number: { type: String },
  section_title: { type: String },
});

const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, default: "" },
  timestamp: { type: Number, required: true },
  thinking: { type: String },
  sources: [SourceDocSchema],
});

const ChatSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New chat",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
