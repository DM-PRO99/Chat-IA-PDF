import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { parsePDFBuffer } from "@/lib/pdf-utils";
import { ChatSessionModel } from "@/models/ChatSession";
import { DocumentModel } from "@/models/Document";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = 50;
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UploadFormSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
});

function toKb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const rawSessionId = formData.get("sessionId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo PDF (file)." }, { status: 400 });
  }

  const filename = file.name || "documento.pdf";
  if (!filename.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permite subir archivos .pdf." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `El PDF excede ${MAX_FILE_SIZE_MB}MB.` }, { status: 400 });
  }

  const sessionId =
    typeof rawSessionId === "string"
      ? UploadFormSchema.shape.sessionId.safeParse(rawSessionId).data
      : undefined;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { text, pageCount } = await parsePDFBuffer(buffer);

  if (!text.trim()) {
    return NextResponse.json({ error: "No se pudo extraer texto del PDF." }, { status: 400 });
  }

  await connectDB();

  const doc = await new DocumentModel({
    name: filename,
    content: text,
    pageCount,
    sizeKb: toKb(file.size),
  }).save();

  let effectiveSessionId: string;
  if (!sessionId) {
    const session = await new ChatSessionModel({
      documentIds: [doc._id.toString()],
      messages: [],
    }).save();
    effectiveSessionId = session._id.toString();
  } else {
    const updated = await ChatSessionModel.findByIdAndUpdate(
      sessionId,
      {
        $push: { documentIds: doc._id.toString() },
        lastActivity: new Date(),
      },
      { new: true }
    );
    effectiveSessionId = updated?._id.toString() ?? sessionId;
  }

  return NextResponse.json({
    success: true,
    document: {
      _id: doc._id.toString(),
      name: doc.name,
      uploadedAt: doc.uploadedAt,
      pageCount: doc.pageCount,
      sizeKb: doc.sizeKb,
    },
    sessionId: effectiveSessionId,
  });
}

