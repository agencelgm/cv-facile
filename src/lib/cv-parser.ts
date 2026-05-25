// Client-side CV file parser. Extracts plain text from PDF or DOCX.
import mammoth from "mammoth";

export type ParsedCv = { text: string };

export async function parseCvFile(file: File): Promise<ParsedCv> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return parsePdf(file);
  }
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(file);
  }
  throw new Error("Format non supporté. Utilisez un fichier PDF ou Word (.docx)");
}

async function parsePdf(file: File): Promise<ParsedCv> {
  // Dynamic import: pdfjs-dist is heavy.
  const pdfjs = await import("pdfjs-dist");
  // Use worker bundled by Vite as a URL
  const workerMod = (await import(
    /* @vite-ignore */ "pdfjs-dist/build/pdf.worker.min.mjs?url"
  )) as { default: string };
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out +=
      content.items
        .map((it) => {
          const item = it as { str?: string };
          return item.str ?? "";
        })
        .join(" ") + "\n";
  }
  return { text: out.trim() };
}

async function parseDocx(file: File): Promise<ParsedCv> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return { text: value.trim() };
}