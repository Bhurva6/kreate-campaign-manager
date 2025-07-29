import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  provider: 'email' | 'google';
  isEmailVerified: boolean;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  refreshToken?: string;
  tokenVersion: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function(this: any) {
        return this.provider === 'email';
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatar: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['email', 'google'],
      required: true,
      default: 'email',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      sparse: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('password') || !user.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ refreshToken: 1 });

// Remove sensitive fields when converting to JSON
UserSchema.set('toJSON', {
  transform: function(_doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
