import paloImg from "@/assets/palo.jpg";
import abelardoImg from "@/assets/abelardo.jpg";
import sergioImg from "@/assets/sergio.jpg";
import ivanImg from "@/assets/ivan.jpg";
import luciaImg from "@/assets/lucia.jpg";

export type CandidateId = "palo" | "abelardo" | "sergio" | "ivan" | "lucia";

export interface Candidate {
  id: CandidateId;
  nombre: string;
  partido: string;
  siglas: string;
  descripcion: string;
  foto: string;
  colorVar: string; // CSS var name
}

export const candidates: Candidate[] = [
  {
    id: "palo",
    nombre: "Paloma Valencia",
    partido: "Centro Democrático",
    siglas: "CD",
    descripcion: "Senadora y abogada, propone seguridad, autonomía regional y disciplina fiscal.",
    foto: paloImg,
    colorVar: "--candidate-palo",
  },
  {
    id: "abelardo",
    nombre: "Abelardo de la Espriella",
    partido: "Defensores de la Patria",
    siglas: "DP",
    descripcion: "Abogado penalista, enfocado en mano dura contra el crimen y defensa institucional.",
    foto: abelardoImg,
    colorVar: "--candidate-abelardo",
  },
  {
    id: "sergio",
    nombre: "Sergio Fajardo",
    partido: "Dignidad y Compromiso",
    siglas: "DyC",
    descripcion: "Matemático y exgobernador, prioriza educación, transparencia y lucha anticorrupción.",
    foto: sergioImg,
    colorVar: "--candidate-sergio",
  },
  {
    id: "ivan",
    nombre: "Iván Cepeda Castro",
    partido: "Pacto Histórico",
    siglas: "PH",
    descripcion: "Senador y defensor de derechos humanos, impulsa paz total y justicia social.",
    foto: ivanImg,
    colorVar: "--candidate-ivan",
  },
  {
    id: "lucia",
    nombre: "Claudia López",
    partido: "Imparables",
    siglas: "IMP",
    descripcion: "Exalcaldesa de Bogotá, propone innovación, equidad de género y transición verde.",
    foto: luciaImg,
    colorVar: "--candidate-lucia",
  },
];

export const candidateById = (id: CandidateId) =>
  candidates.find((c) => c.id === id)!;
