// Client-side PDF generation for CV and Letter using jsPDF.
import { jsPDF } from "jspdf";

export type CvData = {
  titre_professionnel?: string;
  resume?: string;
  experiences?: Array<{ poste?: string; entreprise?: string; periode?: string; description?: string }>;
  formations?: Array<{ diplome?: string; ecole?: string; annee?: string }>;
  competences?: string[];
  langues?: string[];
};

export type CandidateInfo = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville?: string;
  pays?: string;
  photo_url?: string | null;
};

export type Template = "classique" | "moderne" | "professionnel";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;

async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function wrap(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || "", maxWidth);
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export async function generateCvPdf(
  candidate: CandidateInfo,
  cv: CvData,
  template: Template,
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const photo = candidate.photo_url ? await loadImage(candidate.photo_url) : null;

  if (template === "classique") drawClassique(doc, candidate, cv, photo);
  else if (template === "moderne") drawModerne(doc, candidate, cv, photo);
  else drawProfessionnel(doc, candidate, cv, photo);

  return doc.output("blob");
}

/* ---------- CLASSIQUE: single column, centered circular photo ---------- */
function drawClassique(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  let y = MARGIN;
  if (photo) {
    const size = 28;
    const x = (PAGE_W - size) / 2;
    try {
      doc.addImage(photo, "JPEG", x, y, size, size, undefined, "FAST");
    } catch { /* ignore */ }
    y += size + 4;
  }
  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(30, 41, 59);
  doc.text(`${c.prenom} ${c.nom}`.trim(), PAGE_W / 2, y, { align: "center" });
  y += 7;
  if (cv.titre_professionnel) {
    doc.setFont("helvetica", "normal").setFontSize(12).setTextColor(26, 115, 232);
    doc.text(cv.titre_professionnel, PAGE_W / 2, y, { align: "center" });
    y += 6;
  }
  doc.setFontSize(9).setTextColor(100, 116, 139);
  const contact = [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")]
    .filter(Boolean).join("  •  ");
  doc.text(contact, PAGE_W / 2, y, { align: "center" });
  y += 8;
  drawBody(doc, cv, MARGIN, y, PAGE_W - 2 * MARGIN);
}

/* ---------- MODERNE: left blue sidebar (photo + contact + skills) ---------- */
function drawModerne(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const sidebarW = 65;
  doc.setFillColor(26, 115, 232);
  doc.rect(0, 0, sidebarW, PAGE_H, "F");

  let sy = MARGIN;
  if (photo) {
    const size = 36;
    const x = (sidebarW - size) / 2;
    try { doc.addImage(photo, "JPEG", x, sy, size, size, undefined, "FAST"); } catch { /* */ }
    sy += size + 6;
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(13);
  wrap(doc, `${c.prenom} ${c.nom}`.trim(), sidebarW - 10).forEach((l) => {
    doc.text(l, sidebarW / 2, sy, { align: "center" }); sy += 5;
  });
  sy += 3;

  const sectionSidebar = (title: string) => {
    sy += 3;
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 6, sy); sy += 2;
    doc.setDrawColor(255, 255, 255); doc.line(6, sy, sidebarW - 6, sy); sy += 4;
    doc.setFont("helvetica", "normal").setFontSize(9);
  };

  sectionSidebar("Contact");
  [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")]
    .filter(Boolean).forEach((v) => {
      wrap(doc, v as string, sidebarW - 10).forEach((l) => { doc.text(l, 6, sy); sy += 4; });
    });

  if (cv.competences?.length) {
    sectionSidebar("Compétences");
    cv.competences.forEach((s) => { doc.text(`• ${s}`, 6, sy); sy += 4; });
  }
  if (cv.langues?.length) {
    sectionSidebar("Langues");
    cv.langues.forEach((s) => { doc.text(`• ${s}`, 6, sy); sy += 4; });
  }

  // Right content
  const cx = sidebarW + 8;
  const cw = PAGE_W - cx - MARGIN;
  let y = MARGIN;
  if (cv.titre_professionnel) {
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(30, 41, 59);
    wrap(doc, cv.titre_professionnel, cw).forEach((l) => { doc.text(l, cx, y); y += 7; });
    y += 2;
  }
  drawBodySections(doc, cv, cx, y, cw, { skipSkills: true, skipLangues: true });
}

/* ---------- PROFESSIONNEL: dark header, then 2 columns ---------- */
function drawProfessionnel(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const headerH = 45;
  doc.setFillColor(30, 41, 59); doc.rect(0, 0, PAGE_W, headerH, "F");
  if (photo) {
    const size = 28;
    try { doc.addImage(photo, "JPEG", MARGIN, (headerH - size) / 2, size, size, undefined, "FAST"); } catch { /* */ }
  }
  const tx = photo ? MARGIN + 34 : MARGIN;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(22);
  doc.text(`${c.prenom} ${c.nom}`.trim(), tx, headerH / 2 - 2);
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(245, 158, 11);
  if (cv.titre_professionnel) doc.text(cv.titre_professionnel, tx, headerH / 2 + 5);
  doc.setFontSize(9).setTextColor(226, 232, 240);
  const contact = [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")]
    .filter(Boolean).join("  •  ");
  doc.text(contact, tx, headerH / 2 + 11);

  let y = headerH + 8;
  const leftX = MARGIN, leftW = 60;
  const rightX = MARGIN + 70, rightW = PAGE_W - rightX - MARGIN;

  // Left column: competences + langues
  let ly = y;
  if (cv.competences?.length) {
    drawSectionTitle(doc, "Compétences", leftX, ly); ly += 6;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
    cv.competences.forEach((s) => { wrap(doc, `• ${s}`, leftW).forEach((l) => { doc.text(l, leftX, ly); ly += 5; }); });
    ly += 3;
  }
  if (cv.langues?.length) {
    drawSectionTitle(doc, "Langues", leftX, ly); ly += 6;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
    cv.langues.forEach((s) => { doc.text(`• ${s}`, leftX, ly); ly += 5; });
  }

  // Right column: profile + experiences + formations
  drawBodySections(doc, cv, rightX, y, rightW, { skipSkills: true, skipLangues: true });
}

/* ---------- Shared body renderers ---------- */
function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(26, 115, 232);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(26, 115, 232); doc.setLineWidth(0.4);
  doc.line(x, y + 1, x + 30, y + 1);
}

function drawBody(doc: jsPDF, cv: CvData, x: number, y: number, w: number) {
  drawBodySections(doc, cv, x, y, w, {});
}

function drawBodySections(
  doc: jsPDF,
  cv: CvData,
  x: number,
  yStart: number,
  w: number,
  opts: { skipSkills?: boolean; skipLangues?: boolean },
) {
  let y = yStart;

  if (cv.resume) {
    y = ensureSpace(doc, y, 16);
    drawSectionTitle(doc, "Profil", x, y); y += 6;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
    wrap(doc, cv.resume, w).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, x, y); y += 5; });
    y += 3;
  }

  if (cv.experiences?.length) {
    y = ensureSpace(doc, y, 12); drawSectionTitle(doc, "Expériences", x, y); y += 6;
    cv.experiences.forEach((e) => {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(30, 41, 59);
      doc.text(`${e.poste ?? ""}${e.entreprise ? " — " + e.entreprise : ""}`, x, y); y += 5;
      if (e.periode) {
        doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(100, 116, 139);
        doc.text(e.periode, x, y); y += 5;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
        wrap(doc, e.description, w).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, x, y); y += 5; });
      }
      y += 2;
    });
  }

  if (cv.formations?.length) {
    y = ensureSpace(doc, y, 12); drawSectionTitle(doc, "Formations", x, y); y += 6;
    cv.formations.forEach((f) => {
      y = ensureSpace(doc, y, 8);
      doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(30, 41, 59);
      doc.text(`${f.diplome ?? ""}`, x, y); y += 5;
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100, 116, 139);
      doc.text([f.ecole, f.annee].filter(Boolean).join(" — "), x, y); y += 6;
    });
  }

  if (!opts.skipSkills && cv.competences?.length) {
    y = ensureSpace(doc, y, 12); drawSectionTitle(doc, "Compétences", x, y); y += 6;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
    const line = cv.competences.join(" • ");
    wrap(doc, line, w).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, x, y); y += 5; });
  }

  if (!opts.skipLangues && cv.langues?.length) {
    y = ensureSpace(doc, y, 12); drawSectionTitle(doc, "Langues", x, y); y += 6;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 41, 59);
    doc.text(cv.langues.join(" • "), x, y);
  }
}

/* ---------- Letter PDF ---------- */
export function generateLetterPdf(
  candidate: CandidateInfo,
  letterText: string,
  companyName: string,
  jobTitle: string,
): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN + 5;
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(30, 41, 59);
  doc.text(`${candidate.prenom} ${candidate.nom}`.trim(), MARGIN, y); y += 6;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100, 116, 139);
  [candidate.email, candidate.telephone, [candidate.ville, candidate.pays].filter(Boolean).join(", ")]
    .filter(Boolean).forEach((v) => { doc.text(v as string, MARGIN, y); y += 5; });

  y += 10;
  doc.setTextColor(30, 41, 59).setFontSize(11);
  if (companyName) { doc.text(companyName, PAGE_W - MARGIN, y, { align: "right" }); y += 6; }
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.text(today, PAGE_W - MARGIN, y, { align: "right" }); y += 14;

  doc.setFont("helvetica", "bold");
  doc.text(`Objet : Candidature au poste de ${jobTitle}`, MARGIN, y); y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("Madame, Monsieur,", MARGIN, y); y += 8;

  const lines = doc.splitTextToSize(letterText, PAGE_W - 2 * MARGIN);
  lines.forEach((l: string) => { y = ensureSpace(doc, y, 6); doc.text(l, MARGIN, y); y += 6; });

  y += 6;
  y = ensureSpace(doc, y, 16);
  doc.text("Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", MARGIN, y, { maxWidth: PAGE_W - 2 * MARGIN }); y += 14;
  doc.setFont("helvetica", "bold");
  doc.text(`${candidate.prenom} ${candidate.nom}`.trim(), MARGIN, y);

  return doc.output("blob");
}