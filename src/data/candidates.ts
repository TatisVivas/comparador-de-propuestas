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
    nombre: "Palo Mendoza",
    partido: "Movimiento Renovador",
    siglas: "MR",
    descripcion: "Economista, propone modernización institucional y disciplina fiscal.",
    foto: paloImg,
    colorVar: "--candidate-palo",
  },
  {
    id: "abelardo",
    nombre: "Abelardo Ríos",
    partido: "Frente Popular Unido",
    siglas: "FPU",
    descripcion: "Veterano legislador, enfocado en políticas sociales y empleo.",
    foto: abelardoImg,
    colorVar: "--candidate-abelardo",
  },
  {
    id: "sergio",
    nombre: "Sergio Calderón",
    partido: "Alianza Cívica",
    siglas: "AC",
    descripcion: "Ex alcalde, prioriza seguridad ciudadana y descentralización.",
    foto: sergioImg,
    colorVar: "--candidate-sergio",
  },
  {
    id: "ivan",
    nombre: "Iván Escobar",
    partido: "Partido Verde Progresista",
    siglas: "PVP",
    descripcion: "Académico, defiende transición ecológica y educación pública.",
    foto: ivanImg,
    colorVar: "--candidate-ivan",
  },
  {
    id: "lucia",
    nombre: "Lucía Ferrer",
    partido: "Convergencia Liberal",
    siglas: "CL",
    descripcion: "Empresaria, propone apertura económica e innovación tecnológica.",
    foto: luciaImg,
    colorVar: "--candidate-lucia",
  },
];

export const candidateById = (id: CandidateId) =>
  candidates.find((c) => c.id === id)!;
