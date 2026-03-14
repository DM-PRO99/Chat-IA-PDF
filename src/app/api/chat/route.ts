import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { buildSystemPrompt } from "@/lib/pdf-utils";
import { ChatSessionModel } from "@/models/ChatSession";
import { DocumentModel } from "@/models/Document";
import type { PDFDocument } from "@/types";

export const runtime = "nodejs";

const ChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().trim().min(1),
  documentIds: z.array(z.string().trim().min(1)).min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(20),
});

export async function POST(req: NextRequest): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return new Response(JSON.stringify({ error: "No autenticado." }), { status: 401 });

  const json: unknown = await req.json().catch(() => null);
  const parsed = ChatSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Payload inválido." }), { status: 400 });
  }

  const { message, sessionId, documentIds, history } = parsed.data;

  await connectDB();

  const docs = await DocumentModel.find({ _id: { $in: documentIds } }).lean<
    (PDFDocument & { _id: unknown })[]
  >();

  const foundDocs: PDFDocument[] = docs.map((d) => ({
    _id: String(d._id),
    name: d.name,
    content: d.content,
    uploadedAt: new Date(d.uploadedAt),
    pageCount: d.pageCount,
    sizeKb: d.sizeKb,
  }));

  const systemPrompt = buildSystemPrompt(foundDocs);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Falta ANTHROPIC_API_KEY." }), { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const userMsg = {
    id: uuidv4(),
    role: "user" as const,
    content: message,
    timestamp: new Date(),
  };

  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      const encoder = new TextEncoder();

      try {
        const response = await anthropic.messages.stream({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            ...history.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
            {
              role: "user" as const,
              content: message,
            },
          ],
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            assistantText += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error del modelo.";
        controller.enqueue(new TextEncoder().encode(`\n\n[Error] ${msg}`));
        controller.close();
      } finally {
        const assistantMsg = {
          id: uuidv4(),
          role: "assistant" as const,
          content: assistantText.trim() ? assistantText : "(sin respuesta)",
          timestamp: new Date(),
        };

        await ChatSessionModel.findByIdAndUpdate(sessionId, {
          $push: { messages: { $each: [userMsg, assistantMsg] } },
          lastActivity: new Date(),
        }).catch(() => null);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

