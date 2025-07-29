import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  type: 'email-verification' | 'password-reset' | 'phone-verification';
  isUsed: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email-verification', 'password-reset', 'phone-verification'],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance and automatic cleanup
OTPSchema.index({ email: 1, type: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;
