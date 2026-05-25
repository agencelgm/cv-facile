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

export type Template = "classique" | "marine" | "moderne" | "professionnel";

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
  else if (template === "marine") drawMarine(doc, candidate, cv, photo);
  else if (template === "moderne") drawModerne(doc, candidate, cv, photo);
  else drawProfessionnel(doc, candidate, cv, photo);

  return doc.output("blob");
}

/* ══════════════════════════ Template 1 — Classique ══════════════════════════
   Sidebar bleue gauche (65mm), photo CARRÉE, contenu à droite
*/
function drawClassique(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const BLUE: [number, number, number] = [43, 108, 176];
  const sideW = 65;

  // Draw sidebar background
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, sideW, PAGE_H, "F");

  let sy = MARGIN;

  // Square photo
  if (photo) {
    const size = 38;
    const x = (sideW - size) / 2;
    try { doc.addImage(photo, "JPEG", x, sy, size, size, undefined, "FAST"); } catch { /* */ }
    sy += size + 5;
  }

  // Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(11);
  wrap(doc, `${c.prenom} ${c.nom}`.trim(), sideW - 8).forEach((l) => {
    doc.text(l, sideW / 2, sy, { align: "center" }); sy += 5;
  });
  sy += 2;

  // Title
  if (cv.titre_professionnel) {
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(220, 230, 245);
    wrap(doc, cv.titre_professionnel, sideW - 8).forEach((l) => {
      doc.text(l, sideW / 2, sy, { align: "center" }); sy += 4;
    });
    sy += 2;
  }

  const sideSection = (title: string) => {
    sy += 3;
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 5, sy); sy += 2;
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3); doc.line(5, sy, sideW - 5, sy); sy += 4;
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
  };

  sideSection("Informations");
  [
    c.email,
    c.telephone,
    [c.ville, c.pays].filter(Boolean).join(", "),
  ].filter(Boolean).forEach((v) => {
    wrap(doc, v as string, sideW - 8).forEach((l) => { doc.text(l, 5, sy); sy += 4; });
  });

  if (cv.langues?.length) {
    sideSection("Langues");
    cv.langues.forEach((l) => {
      doc.text(`${l}  ●●●●○`, 5, sy); sy += 4;
    });
  }

  if (cv.competences?.length) {
    sideSection("Compétences");
    cv.competences.forEach((s) => { doc.text(`■ ${s}`, 5, sy); sy += 4; });
  }

  // Right content
  const cx = sideW + 7;
  const cw = PAGE_W - cx - 10;
  let y = MARGIN;

  if (cv.resume) {
    y = ensureSpace(doc, y, 16);
    drawClassiqueSection(doc, "Profil", cx, y, cw, BLUE); y += 7;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 65, 85);
    wrap(doc, cv.resume, cw).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, cx, y); y += 5; });
    y += 3;
  }

  if (cv.formations?.length) {
    y = ensureSpace(doc, y, 12);
    drawClassiqueSection(doc, "Formation", cx, y, cw, BLUE); y += 7;
    cv.formations.forEach((f) => {
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(f.diplome ?? "", cx, y);
      if (f.annee) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(f.annee, PAGE_W - 10, y, { align: "right" });
      }
      y += 4;
      if (f.ecole) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...BLUE);
        doc.text(f.ecole, cx, y); y += 5;
      }
    });
    y += 2;
  }

  if (cv.experiences?.length) {
    y = ensureSpace(doc, y, 12);
    drawClassiqueSection(doc, "Expérience professionnelle", cx, y, cw, BLUE); y += 7;
    cv.experiences.forEach((e) => {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(e.poste ?? "", cx, y);
      if (e.periode) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(e.periode, PAGE_W - 10, y, { align: "right" });
      }
      y += 4;
      if (e.entreprise) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...BLUE);
        doc.text(e.entreprise, cx, y); y += 4;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
        wrap(doc, e.description, cw).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, cx, y); y += 4.5; });
      }
      y += 2;
    });
  }
}

function drawClassiqueSection(doc: jsPDF, title: string, x: number, y: number, w: number, color: [number, number, number]) {
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...color);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...color); doc.setLineWidth(0.5);
  doc.line(x, y + 1, x + w, y + 1);
}

/* ══════════════════════════ Template 2 — Marine ══════════════════════════
   Header sombre pleine largeur, photo CARRÉE, body 2 colonnes
*/
function drawMarine(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const DARK: [number, number, number] = [27, 38, 49];
  const headerH = 44;

  // Header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, headerH, "F");

  let tx = MARGIN;
  if (photo) {
    const size = 30;
    const py = (headerH - size) / 2;
    try { doc.addImage(photo, "JPEG", MARGIN, py, size, size, undefined, "FAST"); } catch { /* */ }
    tx = MARGIN + size + 8;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(18);
  const fullName = `${c.nom?.toUpperCase() ?? ""} ${c.prenom ?? ""}`.trim();
  doc.text(fullName, tx, headerH / 2 - 1);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(200, 215, 225);
  const contact = [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")].filter(Boolean).join("  •  ");
  doc.text(contact, tx, headerH / 2 + 7);

  // Body: 2 columns
  const leftX = MARGIN;
  const leftW = 120;
  const rightX = leftX + leftW + 8;
  const rightW = PAGE_W - rightX - MARGIN;
  let ly = headerH + 10;
  let ry = headerH + 10;

  if (cv.resume) {
    ly = ensureSpace(doc, ly, 12);
    drawMarineSection(doc, "Profil", leftX, ly, leftW, DARK); ly += 7;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 65, 85);
    wrap(doc, cv.resume, leftW).forEach((l) => { ly = ensureSpace(doc, ly, 5); doc.text(l, leftX, ly); ly += 5; });
    ly += 3;
  }

  if (cv.experiences?.length) {
    ly = ensureSpace(doc, ly, 12);
    drawMarineSection(doc, "Expérience professionnelle", leftX, ly, leftW, DARK); ly += 7;
    cv.experiences.forEach((e) => {
      ly = ensureSpace(doc, ly, 12);
      const periodX = leftX + leftW;
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(e.poste ?? "", leftX, ly);
      if (e.periode) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(e.periode, periodX, ly, { align: "right" });
      }
      ly += 5;
      if (e.entreprise) {
        doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(71, 85, 105);
        doc.text(e.entreprise, leftX, ly); ly += 4;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
        wrap(doc, e.description, leftW).forEach((l) => { ly = ensureSpace(doc, ly, 5); doc.text(l, leftX, ly); ly += 4.5; });
      }
      ly += 2;
    });
  }

  if (cv.formations?.length) {
    ly = ensureSpace(doc, ly, 12);
    drawMarineSection(doc, "Formation", leftX, ly, leftW, DARK); ly += 7;
    cv.formations.forEach((f) => {
      ly = ensureSpace(doc, ly, 8);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(f.diplome ?? "", leftX, ly);
      if (f.annee) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(f.annee, leftX + leftW, ly, { align: "right" });
      }
      ly += 5;
      if (f.ecole) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
        doc.text(f.ecole, leftX, ly); ly += 5;
      }
    });
  }

  // Right column
  drawMarineSection(doc, "Informations", rightX, ry, rightW, DARK); ry += 7;
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(51, 65, 85);
  [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")].filter(Boolean).forEach((v) => {
    wrap(doc, v as string, rightW).forEach((l) => { ry = ensureSpace(doc, ry, 5); doc.text(l, rightX, ry); ry += 4.5; });
  });
  ry += 4;

  if (cv.langues?.length) {
    drawMarineSection(doc, "Langues", rightX, ry, rightW, DARK); ry += 7;
    cv.langues.forEach((l) => { doc.setFontSize(9); doc.text(`• ${l}`, rightX, ry); ry += 5; });
    ry += 3;
  }

  if (cv.competences?.length) {
    drawMarineSection(doc, "Compétences", rightX, ry, rightW, DARK); ry += 7;
    cv.competences.forEach((s) => { doc.text(`• ${s}`, rightX, ry); ry += 5; });
  }
}

function drawMarineSection(doc: jsPDF, title: string, x: number, y: number, w: number, color: [number, number, number]) {
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...color);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...color); doc.setLineWidth(0.5);
  doc.line(x, y + 1, x + w, y + 1);
}

/* ══════════════════════════ Template 3 — Moderne ══════════════════════════
   Header teal, photo CIRCULAIRE, sidebar sombre + contenu droit
*/
function drawModerne(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const TEAL: [number, number, number] = [23, 165, 137];
  const DARK: [number, number, number] = [27, 38, 49];
  const headerH = 42;
  const sideW = 62;

  // Teal header
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, headerH, "F");

  let hx = MARGIN;
  if (photo) {
    const size = 30;
    const py = (headerH - size) / 2;
    try { doc.addImage(photo, "JPEG", MARGIN, py, size, size, undefined, "FAST"); } catch { /* */ }
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(1);
    doc.ellipse(MARGIN + size / 2, py + size / 2, size / 2, size / 2, "S");
    hx = MARGIN + size + 8;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.text(`${c.prenom?.toUpperCase() ?? ""} ${c.nom ?? ""}`.trim(), hx, headerH / 2 - 2);
  if (cv.titre_professionnel) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(210, 245, 235);
    doc.text(cv.titre_professionnel, hx, headerH / 2 + 5);
  }
  doc.setFontSize(8.5).setTextColor(210, 245, 235);
  const contacts = [c.email, c.telephone, [c.ville, c.pays].filter(Boolean).join(", ")].filter(Boolean).join("   ");
  doc.text(contacts, hx, headerH / 2 + 12);

  // Dark sidebar
  doc.setFillColor(...DARK);
  doc.rect(0, headerH, sideW, PAGE_H - headerH, "F");

  let sy = headerH + 10;

  if (cv.competences?.length) {
    sy = modSideSection(doc, "Compétences", sy, sideW, TEAL);
    cv.competences.forEach((s) => {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
      wrap(doc, s, sideW - 8).forEach((l) => { doc.text(l, 5, sy); sy += 4; });
      doc.setFillColor(...TEAL);
      doc.rect(5, sy, (sideW - 10) * 0.75, 3, "F");
      doc.setFillColor(60, 80, 90);
      doc.rect(5 + (sideW - 10) * 0.75, sy, (sideW - 10) * 0.25, 3, "F");
      sy += 6;
    });
    sy += 2;
  }

  if (cv.langues?.length) {
    sy = modSideSection(doc, "Langues", sy, sideW, TEAL);
    cv.langues.forEach((l) => {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
      doc.text(`• ${l}`, 5, sy); sy += 5;
    });
  }

  // Right content
  const cx = sideW + 6;
  const cw = PAGE_W - cx - MARGIN;
  let y = headerH + 8;

  if (cv.resume) {
    y = ensureSpace(doc, y, 12);
    modBodySection(doc, "Profil", cx, y, TEAL); y += 7;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 65, 85);
    wrap(doc, cv.resume, cw).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, cx, y); y += 5; });
    y += 3;
  }

  if (cv.formations?.length) {
    y = ensureSpace(doc, y, 12);
    modBodySection(doc, "Formation", cx, y, TEAL); y += 7;
    cv.formations.forEach((f) => {
      y = ensureSpace(doc, y, 8);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(f.diplome ?? "", cx, y);
      if (f.annee) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(f.annee, PAGE_W - MARGIN, y, { align: "right" });
      }
      y += 5;
      if (f.ecole) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
        doc.text(f.ecole, cx, y); y += 5;
      }
    });
  }

  if (cv.experiences?.length) {
    y = ensureSpace(doc, y, 12);
    modBodySection(doc, "Expérience professionnelle", cx, y, TEAL); y += 7;
    cv.experiences.forEach((e) => {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(`${e.poste ?? ""}${e.entreprise ? " — " + e.entreprise : ""}`, cx, y); y += 5;
      if (e.periode) {
        doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(100, 116, 139);
        doc.text(e.periode, cx, y); y += 5;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
        wrap(doc, e.description, cw).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, cx, y); y += 4.5; });
      }
      y += 2;
    });
  }
}

function modSideSection(doc: jsPDF, title: string, sy: number, sideW: number, teal: [number, number, number]): number {
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...teal);
  doc.text(title.toUpperCase(), 5, sy); sy += 2;
  doc.setDrawColor(255, 255, 255); doc.setDrawColor(...teal); doc.setLineWidth(0.3);
  doc.line(5, sy, sideW - 5, sy); sy += 5;
  return sy;
}

function modBodySection(doc: jsPDF, title: string, x: number, y: number, teal: [number, number, number]) {
  doc.setFillColor(...teal);
  doc.rect(x, y - 4, 55, 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), x + 2, y);
}

/* ══════════════════════════ Template 4 — Professionnel ══════════════════════════
   Sidebar sombre gauche, photo CIRCULAIRE, contenu droit
*/
function drawProfessionnel(doc: jsPDF, c: CandidateInfo, cv: CvData, photo: string | null) {
  const DARK: [number, number, number] = [33, 47, 61];
  const sideW = 62;

  // Sidebar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, sideW, PAGE_H, "F");

  let sy = MARGIN;

  if (photo) {
    const size = 36;
    const x = (sideW - size) / 2;
    try { doc.addImage(photo, "JPEG", x, sy, size, size, undefined, "FAST"); } catch { /* */ }
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(1);
    doc.ellipse(x + size / 2, sy + size / 2, size / 2, size / 2, "S");
    sy += size + 4;
  }

  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(120, 150, 170);
  doc.text("CURRICULUM VITAE", sideW / 2, sy, { align: "center" }); sy += 4;

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
  wrap(doc, `${c.prenom} ${c.nom}`.trim(), sideW - 8).forEach((l) => {
    doc.text(l, sideW / 2, sy, { align: "center" }); sy += 5;
  });
  sy += 3;

  if (cv.competences?.length) {
    profSideSection(doc, "Compétences", sy, sideW); sy += 7;
    cv.competences.forEach((s) => {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
      doc.text(s, 5, sy); sy += 4;
      doc.text("●●●●○", 5, sy); sy += 5;
    });
    sy += 2;
  }

  if (cv.langues?.length) {
    profSideSection(doc, "Langues", sy, sideW); sy += 7;
    cv.langues.forEach((l) => {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
      doc.text(l, 5, sy); sy += 4;
      doc.text("●●●●●", 5, sy); sy += 5;
    });
  }

  // Right content
  const cx = sideW + 7;
  const cw = PAGE_W - cx - MARGIN;
  let y = MARGIN;

  if (cv.titre_professionnel) {
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...DARK);
    wrap(doc, cv.titre_professionnel, cw).forEach((l) => { doc.text(l, cx, y); y += 6; });
    y += 4;
  }

  if (cv.resume) {
    y = ensureSpace(doc, y, 12);
    profBodySection(doc, "Profil", cx, y, cw, DARK); y += 7;
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 65, 85);
    wrap(doc, cv.resume, cw).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, cx, y); y += 5; });
    y += 3;
  }

  if (cv.experiences?.length) {
    y = ensureSpace(doc, y, 12);
    profBodySection(doc, "Expérience professionnelle", cx, y, cw, DARK); y += 7;
    cv.experiences.forEach((e) => {
      y = ensureSpace(doc, y, 12);
      const periodW = 50;
      if (e.periode) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(e.periode, cx, y);
      }
      const ex = cx + periodW;
      const ew = cw - periodW;
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(e.poste ?? "", ex, y); y += 5;
      if (e.entreprise) {
        doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(71, 85, 105);
        doc.text(e.entreprise, ex, y); y += 4;
      }
      if (e.description) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
        wrap(doc, e.description, ew).forEach((l) => { y = ensureSpace(doc, y, 5); doc.text(l, ex, y); y += 4.5; });
      }
      y += 2;
    });
  }

  if (cv.formations?.length) {
    y = ensureSpace(doc, y, 12);
    profBodySection(doc, "Formation", cx, y, cw, DARK); y += 7;
    cv.formations.forEach((f) => {
      y = ensureSpace(doc, y, 8);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
      doc.text(f.diplome ?? "", cx, y);
      if (f.annee) {
        doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(100, 116, 139);
        doc.text(f.annee, PAGE_W - MARGIN, y, { align: "right" });
      }
      y += 5;
      if (f.ecole) {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
        doc.text(f.ecole, cx, y); y += 5;
      }
    });
  }
}

function profSideSection(doc: jsPDF, title: string, sy: number, sideW: number) {
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(120, 150, 170);
  doc.text(title.toUpperCase(), 5, sy);
  doc.setDrawColor(80, 110, 130); doc.setLineWidth(0.3);
  doc.line(5, sy + 1, sideW - 5, sy + 1);
}

function profBodySection(doc: jsPDF, title: string, x: number, y: number, w: number, dark: [number, number, number]) {
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...dark);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...dark); doc.setLineWidth(0.5);
  doc.line(x, y + 1, x + w, y + 1);
}

/* ══════════════════════════ Letter PDF ══════════════════════════ */
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
