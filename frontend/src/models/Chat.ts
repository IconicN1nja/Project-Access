import mongoose, { Schema } from "mongoose";

const SourceDocSchema = new Schema(
  {
    title: { type: String, default: "Legal Reference" },
    url: { type: String, default: "" },
    snippet: { type: String, default: "" },
    score: { type: Number, default: 0 },
    act_title: { type: String, default: "" },
    section_number: { type: String, default: "" },
    section_title: { type: String, default: "" },
    domain: { type: String, default: "" },
  },
  { _id: false },
);

const MessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },
    timestamp: { type: Number, required: true },
    thinking: { type: String, default: "" },
    sources: [SourceDocSchema],
    isError: { type: Boolean, default: false },
  },
  { _id: false },
);

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
