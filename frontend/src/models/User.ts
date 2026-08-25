import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
    },
    name: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js hot reloads
export default mongoose.models.User || mongoose.model('User', UserSchema);
