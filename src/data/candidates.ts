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
    foto: "https://pbs.twimg.com/profile_images/2017644585724362752/F143aop9.jpg",
    colorVar: "--candidate-palo",
  },
  {
    id: "abelardo",
    nombre: "Abelardo de la Espriella",
    partido: "Defensores de la Patria",
    siglas: "DP",
    descripcion: "Abogado penalista, enfocado en mano dura contra el crimen y defensa institucional.",
    foto: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNunCUWgAiWpigFJzxJFhCNJyKnSBkQA9Uq3lmARCH0BUYvApZ8HnFZ1mGlwGezOLDBDpJHSZB5Z9oe-tb_kipVxKAQQwdInULxl8y0xzbnw&s=10",
    colorVar: "--candidate-abelardo",
  },
  {
    id: "sergio",
    nombre: "Sergio Fajardo",
    partido: "Dignidad y Compromiso",
    siglas: "DyC",
    descripcion: "Matemático y exgobernador, prioriza educación, transparencia y lucha anticorrupción.",
    foto: "https://imagenes.elpais.com/resizer/v2/PWR6U3QVGJH5HFBMNGDK7LVSYQ.jpg?auth=bb72a7ee1dd61d222914842441d43cf78fd5b1f6b2b21a94440d90d84aaf81a8&width=1200",
    colorVar: "--candidate-sergio",
  },
  {
    id: "ivan",
    nombre: "Iván Cepeda Castro",
    partido: "Pacto Histórico",
    siglas: "PH",
    descripcion: "Senador y defensor de derechos humanos, impulsa paz total y justicia social.",
    foto: "https://imagenes.elpais.com/resizer/v2/KIISVFBIOZHOHJTXNUDMQ3KIZU.jpg?auth=156a0ad24ec4c1d7b7ed44d8bda132e62cb2673c93a8d6f17cc1651e88cdb697&width=1960&height=1470&smart=true",
    colorVar: "--candidate-ivan",
  },
  {
    id: "lucia",
    nombre: "Claudia López",
    partido: "Imparables",
    siglas: "IMP",
    descripcion: "Exalcaldesa de Bogotá, propone innovación, equidad de género y transición verde.",
    foto: "https://www.lasillavacia.com/wp-content/uploads/2021/02/Claudia-Lopez-1.jpg",
    colorVar: "--candidate-lucia",
  },
];

export const candidateById = (id: CandidateId) =>
  candidates.find((c) => c.id === id)!;
