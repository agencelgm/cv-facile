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

  const scaledHeight = scale * (template === "moderne" ? 900 : 1000);

  return (
    <div ref={containerRef} className="w-full overflow-hidden bg-gray-100">
      <div style={{ width: "100%", height: scaledHeight, overflow: "hidden", position: "relative" }}>
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: CV_WIDTH }}>
          {template === "classique" && <ClassiqueTemplate data={data} />}
          {template === "moderne" && <ModerneTemplate data={data} />}
          {template === "professionnel" && <ProfessionnelTemplate data={data} />}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── Shared helpers ── */

function SectionTitle({ title, color = "#1a73e8" }: { title: string; color?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{
        fontSize: 11, fontWeight: "bold", color,
        textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px",
      }}>
        {title}
      </p>
      <div style={{ height: 1.5, backgroundColor: color, width: 50, borderRadius: 1 }} />
    </div>
  );
}

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

function BodySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <SectionTitle title={title} />
      {children}
    </div>
  );
}

const BASE: CSSProperties = {
  fontFamily: "Helvetica, Arial, sans-serif",
  backgroundColor: "white",
  width: CV_WIDTH,
  minHeight: 1122,
  boxSizing: "border-box",
};

/* ────────────────────────────────────────── Classique ── */

function ClassiqueTemplate({ data }: { data: EditorCVData }) {
  const contact = [data.email, data.telephone, [data.ville, data.pays].filter(Boolean).join(", ")]
    .filter(Boolean).join("  •  ");
  return (
    <div style={{ ...BASE, padding: "44px 56px", color: "#1e293b" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        {data.photo_url && (
          <img
            src={data.photo_url} alt=""
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 12, display: "block", marginLeft: "auto", marginRight: "auto" }}
          />
        )}
        <h1 style={{ fontSize: 22, fontWeight: "bold", margin: "0 0 4px", color: "#1e293b" }}>
          {[data.prenom, data.nom].filter(Boolean).join(" ") || "Votre Nom"}
        </h1>
        {data.titre && (
          <p style={{ fontSize: 13, color: "#1a73e8", margin: "0 0 6px" }}>{data.titre}</p>
        )}
        {contact && (
          <p style={{ fontSize: 9, color: "#64748b", margin: 0 }}>{contact}</p>
        )}
      </div>

      {data.resume && (
        <BodySection title="Profil">
          <p style={{ fontSize: 10, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
        </BodySection>
      )}
      {data.experiences.length > 0 && (
        <BodySection title="Expériences">
          {data.experiences.map((e, i) => <ExpItem key={i} exp={e} />)}
        </BodySection>
      )}
      {data.formations.length > 0 && (
        <BodySection title="Formations">
          {data.formations.map((f, i) => <FmtItem key={i} f={f} />)}
        </BodySection>
      )}
      {data.competences.length > 0 && (
        <BodySection title="Compétences">
          <p style={{ fontSize: 10, color: "#334155" }}>{data.competences.join("  •  ")}</p>
        </BodySection>
      )}
      {data.langues.length > 0 && (
        <BodySection title="Langues">
          <p style={{ fontSize: 10, color: "#334155" }}>{data.langues.join("  •  ")}</p>
        </BodySection>
      )}
    </div>
  );
}

/* ────────────────────────────────────────── Moderne ── */

function ModerneTemplate({ data }: { data: EditorCVData }) {
  const sideW = 240;
  const contact = [data.email, data.telephone, [data.ville, data.pays].filter(Boolean).join(", ")].filter(Boolean);
  return (
    <div style={{ ...BASE, display: "flex" }}>
      {/* Sidebar */}
      <div style={{
        width: sideW, flexShrink: 0, backgroundColor: "#1a73e8",
        padding: "36px 16px", color: "white", boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <img src={data.photo_url} alt=""
              style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover" }} />
          </div>
        )}
        <h2 style={{ textAlign: "center", fontSize: 14, fontWeight: "bold", margin: "0 0 22px", lineHeight: 1.3 }}>
          {[data.prenom, data.nom].filter(Boolean).join(" ") || "Votre Nom"}
        </h2>

        <SidebarSect title="Contact">
          {contact.map((v, i) => (
            <p key={i} style={{ fontSize: 9, margin: "0 0 5px", wordBreak: "break-all", lineHeight: 1.4 }}>{v}</p>
          ))}
        </SidebarSect>

        {data.competences.length > 0 && (
          <SidebarSect title="Compétences">
            {data.competences.map((c, i) => (
              <p key={i} style={{ fontSize: 9, margin: "0 0 4px" }}>• {c}</p>
            ))}
          </SidebarSect>
        )}
        {data.langues.length > 0 && (
          <SidebarSect title="Langues">
            {data.langues.map((l, i) => (
              <p key={i} style={{ fontSize: 9, margin: "0 0 4px" }}>• {l}</p>
            ))}
          </SidebarSect>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "36px 24px", color: "#1e293b", boxSizing: "border-box" }}>
        {data.titre && (
          <h2 style={{ fontSize: 17, fontWeight: "bold", margin: "0 0 18px", color: "#1e293b" }}>{data.titre}</h2>
        )}
        {data.resume && (
          <BodySection title="Profil">
            <p style={{ fontSize: 10, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
          </BodySection>
        )}
        {data.experiences.length > 0 && (
          <BodySection title="Expériences">
            {data.experiences.map((e, i) => <ExpItem key={i} exp={e} />)}
          </BodySection>
        )}
        {data.formations.length > 0 && (
          <BodySection title="Formations">
            {data.formations.map((f, i) => <FmtItem key={i} f={f} />)}
          </BodySection>
        )}
      </div>
    </div>
  );
}

function SidebarSect({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{
        fontSize: 9.5, fontWeight: "bold", textTransform: "uppercase",
        color: "white", margin: "0 0 5px", letterSpacing: "0.07em",
      }}>{title}</p>
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.35)", marginBottom: 8 }} />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────── Professionnel ── */

function ProfessionnelTemplate({ data }: { data: EditorCVData }) {
  const contact = [data.email, data.telephone, [data.ville, data.pays].filter(Boolean).join(", ")]
    .filter(Boolean).join("  •  ");
  return (
    <div style={{ ...BASE, color: "#1e293b" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#1e293b", padding: "24px 32px",
        display: "flex", alignItems: "center", gap: 20, boxSizing: "border-box",
      }}>
        {data.photo_url && (
          <img src={data.photo_url} alt=""
            style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: "bold", color: "white", margin: "0 0 4px" }}>
            {[data.prenom, data.nom].filter(Boolean).join(" ") || "Votre Nom"}
          </h1>
          {data.titre && (
            <p style={{ fontSize: 12, color: "#f59e0b", margin: "0 0 4px" }}>{data.titre}</p>
          )}
          {contact && (
            <p style={{ fontSize: 9, color: "#e2e8f0", margin: 0 }}>{contact}</p>
          )}
        </div>
      </div>

      {/* Body: 2 columns */}
      <div style={{ display: "flex", padding: "24px 32px", gap: 24, boxSizing: "border-box" }}>
        {/* Left */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {data.competences.length > 0 && (
            <BodySection title="Compétences">
              {data.competences.map((c, i) => (
                <p key={i} style={{ fontSize: 9.5, margin: "0 0 4px", color: "#334155" }}>• {c}</p>
              ))}
            </BodySection>
          )}
          {data.langues.length > 0 && (
            <BodySection title="Langues">
              {data.langues.map((l, i) => (
                <p key={i} style={{ fontSize: 9.5, margin: "0 0 4px", color: "#334155" }}>• {l}</p>
              ))}
            </BodySection>
          )}
        </div>
        {/* Right */}
        <div style={{ flex: 1 }}>
          {data.resume && (
            <BodySection title="Profil">
              <p style={{ fontSize: 10, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "#334155" }}>{data.resume}</p>
            </BodySection>
          )}
          {data.experiences.length > 0 && (
            <BodySection title="Expériences">
              {data.experiences.map((e, i) => <ExpItem key={i} exp={e} />)}
            </BodySection>
          )}
          {data.formations.length > 0 && (
            <BodySection title="Formations">
              {data.formations.map((f, i) => <FmtItem key={i} f={f} />)}
            </BodySection>
          )}
        </div>
      </div>
    </div>
  );
}
