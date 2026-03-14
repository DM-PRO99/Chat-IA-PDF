import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DocumentModel } from "@/models/Document";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  await connectDB();

  const docs = await DocumentModel.find({}, { content: 0 })
    .sort({ uploadedAt: -1 })
    .lean<{ _id: unknown; name: string; uploadedAt: Date; pageCount: number; sizeKb: number }[]>();

  const meta = docs.map((d) => ({
    _id: String(d._id),
    name: d.name,
    uploadedAt: new Date(d.uploadedAt),
    pageCount: d.pageCount,
    sizeKb: d.sizeKb,
  }));

  return NextResponse.json(meta);
}

