import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ChatSessionModel } from "@/models/ChatSession";
import { DocumentModel } from "@/models/Document";

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  await connectDB();

  await DocumentModel.findByIdAndDelete(id);
  await ChatSessionModel.updateMany({}, { $pull: { documentIds: id } });

  return NextResponse.json({ success: true });
}

