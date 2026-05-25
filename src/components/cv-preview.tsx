import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import type { EditorCVData, Experience, Formation } from "@/lib/cv-types";
import type { Template } from "@/lib/pdf-generator";

const CV_WIDTH = 794;

interface CVPreviewProps {
  data: EditorCVData;
  template: Template;
}

export function CVPreview({ data, template }: CVPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setScale((w - 4) / CV_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scaledHeight = scale * 1000;

  return (
    <div ref={containerRef} className="w-full overflow-hidden bg-gray-100">
      <div style={{ width: "100%", height: scaledHeight, overflow: "hidden", position: "relative" }}>
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: CV_WIDTH }}>
          {template === "classique" && <ClassiqueTemplate data={data} />}
          {template === "marine" && <MarineTemplate data={data} />}
          {template === "moderne" && <ModerneTemplate data={data} />}
          {template === "professionnel" && <ProfessionnelTemplate data={data} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Shared base ─── */

const BASE: CSSProperties = {
  fontFamily: "Helvetica, Arial, sans-serif",
  backgroundColor: "white",
  width: CV_WIDTH,
  minHeight: 1122,
  boxSizing: "border-box",
};

/* ─────────────────────────── Dots helper ─── */

function Dots({ filled = 4, total = 5, color = "white" }: { filled?: number; total?: number; color?: string }) {
  return (
    <span style={{ letterSpacing: 2, fontSize: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? color : "rgba(255,255,255,0.3)", fontSize: 10 }}>●</span>
      ))}
    </span>
  );
}


/* ══════════════════════════════════════════════════════════
   Template 1 — Classique (sidebar bleue, photo CARRÉE)
   Inspiré de : Bastien Simonet
══════════════════════════════════════════════════════════ */

const BLUE = "#2B6CB0";

function ClassiqueTemplate({ data }: { data: EditorCVData }) {
  const SIDEBAR_W = 210;
  return (
    <div style={{ ...BASE, display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, backgroundColor: BLUE,
        padding: "32px 16px", color: "white", boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <img src={data.photo_url} alt=""
              style={{ width: 110, height: 110, objectFit: "cover", display: "block", margin: "0 auto", borderRadius: 0 }} />
          </div>
        )}
        <h1 style={{ textAlign: "center", fontSize: 13, fontWeight: "bold", margin: "0 0 4px", lineHeight: 1.3 }}>
          {[data.prenom, data.nom].filter(Boolean).join(" ") || "Votre Nom"}
        </h1>
        {data.titre && (
          <p style={{ textAlign: "center", fontSize: 9.5, margin: "0 0 20px", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
            {data.titre}
          </p>
        )}

        <ClassSideSection title="Informations personnelles">
          {[
            { label: "Adresse e-mail", value: data.email },
            { label: "Numéro de téléphone", value: data.telephone },
            data.ville || data.pays ? { label: "Adresse", value: [data.ville, data.pays].filter(Boolean).join(", ") } : null,
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{ marginBottom: 7 }}>
              <p style={{ fontSize: 7.5, textTransform: "uppercase", opacity: 0.65, margin: "0 0 1px", letterSpacing: "0.04em" }}>{item!.label}</p>
              <p style={{ fontSize: 9, wordBreak: "break-all", margin: 0 }}>{item!.value}</p>
            </div>
          ))}
        </ClassSideSection>

        {data.langues.length > 0 && (
          <ClassSideSection title="Langues">
            {data.langues.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 9 }}>{l}</span>
                <Dots filled={4} />
              </div>
            ))}
          </ClassSideSection>
        )}

        {data.competences.length > 0 && (
          <ClassSideSection title="Compétences">
            {data.competences.map((c, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 9, margin: 0 }}>■ {c}</p>
              </div>
            ))}
          </ClassSideSection>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: "32px 24px", boxSizing: "border-box", color: "#1e293b" }}>
        {data.resume && (
          <ClassSection title="Profil">
            <p style={{ fontSize: 10, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
          </ClassSection>
        )}

        {data.formations.length > 0 && (
          <ClassSection title="Formation">
            {data.formations.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 2px" }}>{f.diplome}</p>
                  <p style={{ fontSize: 9, color: BLUE, margin: 0 }}>{f.ecole}</p>
                </div>
                <p style={{ fontSize: 9, color: "#64748b", flexShrink: 0, fontStyle: "italic" }}>{f.annee}</p>
              </div>
            ))}
          </ClassSection>
        )}

        {data.experiences.length > 0 && (
          <ClassSection title="Expérience professionnelle">
            {data.experiences.map((e, i) => <ClassExpItem key={i} exp={e} />)}
          </ClassSection>
        )}
      </div>
    </div>
  );
}

function ClassSideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{title}</p>
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.4)", marginBottom: 8 }} />
      {children}
    </div>
  );
}

function ClassSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: "bold", color: BLUE, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{title}</p>
      <div style={{ height: 1.5, backgroundColor: BLUE, width: "100%", marginBottom: 10 }} />
      {children}
    </div>
  );
}

function ClassExpItem({ exp }: { exp: Experience }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <p style={{ fontWeight: "bold", fontSize: 10, margin: 0 }}>{exp.poste}</p>
        <p style={{ fontSize: 9, color: "#64748b", margin: 0, flexShrink: 0, marginLeft: 8, fontStyle: "italic" }}>{exp.periode}</p>
      </div>
      {exp.entreprise && <p style={{ fontSize: 9, color: BLUE, margin: "0 0 3px" }}>{exp.entreprise}</p>}
      {exp.description && (
        <p style={{ fontSize: 9.5, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.55, color: "#334155" }}>{exp.description}</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Template 2 — Marine (header sombre, photo CARRÉE)
   Inspiré de : Aurélien Leroy
══════════════════════════════════════════════════════════ */

const DARK_MARINE = "#1B2631";

function MarineTemplate({ data }: { data: EditorCVData }) {
  return (
    <div style={{ ...BASE, color: "#1e293b" }}>
      {/* Header */}
      <div style={{
        backgroundColor: DARK_MARINE, padding: "20px 28px",
        display: "flex", alignItems: "center", gap: 20, boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <img src={data.photo_url} alt=""
            style={{ width: 80, height: 80, objectFit: "cover", flexShrink: 0, borderRadius: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: "bold", color: "white", margin: "0 0 5px" }}>
            {data.nom?.toUpperCase() || "NOM"}{" "}
            <span style={{ fontWeight: "normal" }}>{data.prenom || "Prénom"}</span>
          </h1>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {[data.email, data.telephone, [data.ville, data.pays].filter(Boolean).join(", ")].filter(Boolean).join("  •  ")}
          </p>
        </div>
      </div>

      {/* Body: 2 columns */}
      <div style={{ display: "flex", padding: "20px 28px", gap: 28, boxSizing: "border-box" }}>
        {/* Left: experiences + formations */}
        <div style={{ flex: 2 }}>
          {data.resume && (
            <MarineSection title="Profil">
              <p style={{ fontSize: 10, lineHeight: 1.65, color: "#334155", whiteSpace: "pre-wrap" }}>{data.resume}</p>
            </MarineSection>
          )}
          {data.experiences.length > 0 && (
            <MarineSection title="Expérience professionnelle">
              {data.experiences.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 9, color: "#64748b", flexShrink: 0, width: 80, fontStyle: "italic", paddingTop: 1 }}>{e.periode}</p>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 1px" }}>{e.poste}</p>
                    {e.entreprise && <p style={{ fontSize: 9, color: "#475569", margin: "0 0 3px", fontStyle: "italic" }}>{e.entreprise}</p>}
                    {e.description && (
                      <p style={{ fontSize: 9.5, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.55, color: "#334155" }}>{e.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </MarineSection>
          )}
          {data.formations.length > 0 && (
            <MarineSection title="Formation">
              {data.formations.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  <p style={{ fontSize: 9, color: "#64748b", flexShrink: 0, width: 80, fontStyle: "italic" }}>{f.annee}</p>
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 1px" }}>{f.diplome}</p>
                    <p style={{ fontSize: 9, color: "#475569", margin: 0 }}>{f.ecole}</p>
                  </div>
                </div>
              ))}
            </MarineSection>
          )}
        </div>

        {/* Right: personal + languages + skills */}
        <div style={{ flex: 1 }}>
          <MarineSection title="Informations">
            {[
              { label: "E-mail", value: data.email },
              { label: "Téléphone", value: data.telephone },
              data.ville ? { label: "Ville", value: data.ville } : null,
              data.pays ? { label: "Pays", value: data.pays } : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <p style={{ fontSize: 8, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 1px", letterSpacing: "0.04em" }}>{item!.label}</p>
                <p style={{ fontSize: 9, color: "#334155", wordBreak: "break-all", margin: 0 }}>{item!.value}</p>
              </div>
            ))}
          </MarineSection>

          {data.langues.length > 0 && (
            <MarineSection title="Langues">
              {data.langues.map((l, i) => (
                <p key={i} style={{ fontSize: 9, margin: "0 0 4px", color: "#334155" }}>• {l}</p>
              ))}
            </MarineSection>
          )}

          {data.competences.length > 0 && (
            <MarineSection title="Compétences">
              {data.competences.map((c, i) => (
                <p key={i} style={{ fontSize: 9, margin: "0 0 4px", color: "#334155" }}>• {c}</p>
              ))}
            </MarineSection>
          )}
        </div>
      </div>
    </div>
  );
}

function MarineSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: "bold", color: DARK_MARINE, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>{title}</p>
      <div style={{ height: 1.5, backgroundColor: DARK_MARINE, width: "100%", marginBottom: 8 }} />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Template 3 — Moderne (header teal, photo CIRCULAIRE)
   Inspiré de : Adeline Petit
══════════════════════════════════════════════════════════ */

const TEAL = "#17A589";
const DARK_SIDEBAR = "#1B2631";

function ModerneTemplate({ data }: { data: EditorCVData }) {
  const SIDEBAR_W = 210;
  return (
    <div style={{ ...BASE }}>
      {/* Teal header */}
      <div style={{
        backgroundColor: TEAL, padding: "22px 28px",
        display: "flex", alignItems: "center", gap: 20, boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <img src={data.photo_url} alt=""
            style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "3px solid rgba(255,255,255,0.5)" }} />
        )}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: "bold", color: "white", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {data.prenom} <strong>{data.nom}</strong>
          </h1>
          {data.titre && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", margin: "0 0 5px" }}>{data.titre}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
            {data.email && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.9)" }}>✉ {data.email}</span>}
            {data.telephone && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.9)" }}>✆ {data.telephone}</span>}
            {(data.ville || data.pays) && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.9)" }}>
                ⌂ {[data.ville, data.pays].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body: dark sidebar + right content */}
      <div style={{ display: "flex" }}>
        {/* Dark sidebar */}
        <div style={{
          width: SIDEBAR_W, flexShrink: 0, backgroundColor: DARK_SIDEBAR,
          padding: "24px 16px", color: "white", boxSizing: "border-box",
        }}>
          {data.competences.length > 0 && (
            <ModernSideSection title="Compétences">
              {data.competences.map((c, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9, margin: "0 0 3px" }}>{c}</p>
                  <div style={{ height: 5, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "75%", backgroundColor: TEAL, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </ModernSideSection>
          )}

          {data.langues.length > 0 && (
            <ModernSideSection title="Langues">
              {data.langues.map((l, i) => (
                <p key={i} style={{ fontSize: 9, margin: "0 0 4px" }}>• {l}</p>
              ))}
            </ModernSideSection>
          )}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, padding: "24px 22px", boxSizing: "border-box" }}>
          {data.resume && (
            <ModernBodySection title="Profil">
              <p style={{ fontSize: 10, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
            </ModernBodySection>
          )}
          {data.formations.length > 0 && (
            <ModernBodySection title="Formation">
              {data.formations.map((f, i) => <FmtItem key={i} f={f} />)}
            </ModernBodySection>
          )}
          {data.experiences.length > 0 && (
            <ModernBodySection title="Expérience professionnelle">
              {data.experiences.map((e, i) => <ExpItem key={i} exp={e} />)}
            </ModernBodySection>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernSideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 9.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", color: "white", margin: "0 0 4px" }}>{title}</p>
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 10 }} />
      {children}
    </div>
  );
}

function ModernBodySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ backgroundColor: TEAL, padding: "3px 10px", marginBottom: 10, display: "inline-block", borderRadius: 2 }}>
        <p style={{ fontSize: 10, fontWeight: "bold", color: "white", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Template 4 — Professionnel (sidebar sombre, photo CIRCULAIRE)
   Inspiré de : Rémi Vautrin
══════════════════════════════════════════════════════════ */

const DARK2 = "#212F3D";

function ProfessionnelTemplate({ data }: { data: EditorCVData }) {
  const SIDEBAR_W = 200;
  return (
    <div style={{ ...BASE, display: "flex" }}>
      {/* Dark sidebar */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, backgroundColor: DARK2,
        padding: "32px 16px", color: "white", boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <img src={data.photo_url} alt=""
              style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.2)" }} />
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Curriculum vitae</p>
        <h1 style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", margin: "0 0 22px", lineHeight: 1.3 }}>
          {data.prenom} {data.nom}
        </h1>

        {data.competences.length > 0 && (
          <ProfSideSection title="Compétences">
            {data.competences.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 9 }}>{c}</span>
                <Dots filled={4} />
              </div>
            ))}
          </ProfSideSection>
        )}

        {data.langues.length > 0 && (
          <ProfSideSection title="Langues">
            {data.langues.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 9 }}>{l}</span>
                <Dots filled={5} />
              </div>
            ))}
          </ProfSideSection>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: "32px 24px", boxSizing: "border-box", color: "#1e293b" }}>
        {data.titre && (
          <p style={{ fontSize: 14, fontWeight: "bold", color: DARK2, margin: "0 0 16px" }}>{data.titre}</p>
        )}

        {data.resume && (
          <ProfBodySection title="Profil">
            <p style={{ fontSize: 10, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
          </ProfBodySection>
        )}

        {data.experiences.length > 0 && (
          <ProfBodySection title="Expérience professionnelle">
            {data.experiences.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 9, color: "#64748b", flexShrink: 0, width: 80, fontStyle: "italic", paddingTop: 1 }}>{e.periode}</p>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 1px" }}>{e.poste}</p>
                  {e.entreprise && <p style={{ fontSize: 9, color: "#475569", margin: "0 0 3px", fontStyle: "italic" }}>{e.entreprise}</p>}
                  {e.description && (
                    <p style={{ fontSize: 9.5, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.55, color: "#334155" }}>{e.description}</p>
                  )}
                </div>
              </div>
            ))}
          </ProfBodySection>
        )}

        {data.formations.length > 0 && (
          <ProfBodySection title="Formation">
            {data.formations.map((f, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 1px" }}>{f.diplome}</p>
                <p style={{ fontSize: 9, color: "#64748b", margin: 0 }}>
                  {[f.ecole, f.annee].filter(Boolean).join(" — ")}
                </p>
              </div>
            ))}
          </ProfBodySection>
        )}
      </div>
    </div>
  );
}

function ProfSideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{title}</p>
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 8 }} />
      {children}
    </div>
  );
}

function ProfBodySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: "bold", color: DARK2, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>{title}</p>
      <div style={{ height: 1.5, backgroundColor: DARK2, width: "100%", marginBottom: 10 }} />
      {children}
    </div>
  );
}

/* ─────────────────────────── Shared item renderers ─── */

function ExpItem({ exp }: { exp: Experience }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 2px", color: "#1e293b" }}>
        {exp.poste}{exp.entreprise ? ` — ${exp.entreprise}` : ""}
      </p>
      {exp.periode && (
        <p style={{ fontSize: 9, color: "#64748b", fontStyle: "italic", margin: "0 0 3px" }}>{exp.periode}</p>
      )}
      {exp.description && (
        <p style={{ fontSize: 9.5, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.55, color: "#334155" }}>
          {exp.description}
        </p>
      )}
    </div>
  );
}

function FmtItem({ f }: { f: Formation }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontWeight: "bold", fontSize: 10, margin: "0 0 2px", color: "#1e293b" }}>{f.diplome}</p>
      <p style={{ fontSize: 9, color: "#64748b", margin: 0 }}>
        {[f.ecole, f.annee].filter(Boolean).join(" — ")}
      </p>
    </div>
  );
}

