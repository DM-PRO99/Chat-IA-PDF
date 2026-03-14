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
  if (documents.length === 0) {
    return "Eres un asistente de análisis de documentos. No hay documentos cargados.";
  }

  const MAX_CHARS_PER_DOC = 80000; // ~100K tokens por documento

  const docsContext = documents
    .map((doc, i) => {
      let content = doc.content;
      let truncated = false;

      if (content.length > MAX_CHARS_PER_DOC) {
        // Tomar primera mitad y última mitad para conservar inicio y final
        const half = MAX_CHARS_PER_DOC / 2;
        content =
          content.slice(0, half) +
          "\n\n[... contenido intermedio omitido por longitud ...]\n\n" +
          content.slice(-half);
        truncated = true;
      }

      return `--- DOCUMENTO ${i + 1}: "${doc.name}" (${doc.pageCount} páginas${truncated ? " — fragmentado por tamaño" : ""}) ---\n${content}`;
    })
    .join("\n\n");

  return `Eres un asistente especializado en analizar documentos PDF.

DOCUMENTOS DISPONIBLES:
${docsContext}

INSTRUCCIONES:
- Responde ÚNICAMENTE basándote en el contenido de los documentos
- Si la información no está en los documentos, dilo claramente
- Cita el documento y sección relevante cuando sea posible
- Extrae datos específicos (números, fechas, nombres) exactamente como aparecen
- Si un documento fue fragmentado por tamaño, avisa al usuario que algunas partes intermedias no están disponibles
- Responde en el mismo idioma de la pregunta`;
}


