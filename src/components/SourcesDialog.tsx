import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpen, X } from "lucide-react";

export function SourcesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Fuentes
        </Button>
      </DialogTrigger>
      <DialogContent hideClose className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="relative border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="font-serif text-xl">Fuentes / Transparencia</DialogTitle>
            </div>
            <DialogDescription className="text-left text-sm leading-relaxed">
              Las respuestas se basan en los planes de gobierno oficiales publicados por cada candidatura. Cada cita
              incluye su referencia.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para trabajos académicos, contrasta siempre con el documento completo registrado ante la autoridad electoral y
            conserva el enlace o la cita de cada plan cuando cites al asistente.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            onClick={(e) => e.preventDefault()}
          >
            Ver metodología <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
