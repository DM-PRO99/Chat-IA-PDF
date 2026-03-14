import pdf from "pdf-parse";

import type { PDFDocument } from "@/types";

export async function parsePDFBuffer(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const data = await pdf(buffer);
  const text = typeof data.text === "string" ? data.text : "";
  const pageCount = typeof data.numpages === "number" && data.numpages > 0 ? data.numpages : 1;
  return { text, pageCount };
}

export function buildSystemPrompt(documents: PDFDocument[]): string {
  const docsBlock = documents
    .map((d, i) => {
      return [
        `### Documento ${i + 1}: ${d.name} (id=${d._id})`,
        "```",
        d.content,
        "```",
      ].join("\n");
    })
    .join("\n\n");

  return [
    "Eres un asistente especializado en analizar documentos PDF.",
    "",
    "DOCUMENTOS DISPONIBLES:",
    docsBlock || "(sin documentos)",
    "",
    "INSTRUCCIONES:",
    "- Responde ÚNICAMENTE basándote en el contenido de los documentos.",
    "- Si la info no está en los documentos, dilo claramente.",
    "- Cita el documento y sección relevante cuando sea posible.",
    "- Extrae datos específicos (números, fechas, nombres) exactamente como aparecen.",
    "- Responde en el mismo idioma de la pregunta.",
  ].join("\n");
}

