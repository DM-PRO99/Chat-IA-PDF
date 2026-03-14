import mongoose, { type InferSchemaType, type Model, type Schema } from "mongoose";

export interface DocumentFields {
  name: string;
  content: string;
  pageCount: number;
  sizeKb: number;
  uploadedAt: Date;
}

const DocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    pageCount: { type: Number, required: true, min: 1 },
    sizeKb: { type: Number, required: true, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
) satisfies Schema;

DocumentSchema.index({ uploadedAt: -1 });

export type DocumentDoc = InferSchemaType<typeof DocumentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DocumentModel: Model<DocumentDoc> =
  (mongoose.models.Document as Model<DocumentDoc> | undefined) ??
  mongoose.model<DocumentDoc>("Document", DocumentSchema);

