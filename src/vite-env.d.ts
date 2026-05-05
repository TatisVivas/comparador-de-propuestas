/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Si se define, las consultas van directo a esa URL. Si no, Vite reenvía `/api/*` al backend (ver vite.config). */
  readonly VITE_API_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_OPENAI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
