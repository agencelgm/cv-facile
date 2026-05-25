export type Experience = {
  poste: string;
  entreprise: string;
  periode: string;
  description: string;
};

export type Formation = {
  diplome: string;
  ecole: string;
  annee: string;
};

export type EditorCVData = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  pays: string;
  photo_url: string | null;
  titre: string;
  resume: string;
  experiences: Experience[];
  formations: Formation[];
  competences: string[];
  langues: string[];
};

export const emptyCV: EditorCVData = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  ville: "",
  pays: "",
  photo_url: null,
  titre: "",
  resume: "",
  experiences: [],
  formations: [],
  competences: [],
  langues: [],
};
