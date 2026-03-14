import mongoose, { type InferSchemaType, type Model } from "mongoose";
import crypto from "crypto";

export interface UserFields {
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    passwordHash: { 
      type: String, 
      required: true, 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { versionKey: false }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", UserSchema);

/**
 * Hash a password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
