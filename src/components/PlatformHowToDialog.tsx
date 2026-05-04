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
import { CircleHelp, X } from "lucide-react";

export function PlatformHowToDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <CircleHelp className="h-4 w-4" />
          Cómo usar
        </Button>
      </DialogTrigger>
      <DialogContent hideClose className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden p-0">
        <div className="flex max-h-[85vh] flex-col">
          <div className="relative shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
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
              <DialogTitle className="font-serif text-xl pr-2">¿Cómo usar la plataforma?</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">
                Guía breve para estudiantes de ciencia política: consultar planes de gobierno, leer las respuestas del
                asistente y usar la evaluación estructurada en tus trabajos.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-foreground">
          <section>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-foreground">1. Guía paso a paso</h3>
            <ol className="ml-4 list-decimal space-y-3 text-muted-foreground marker:font-medium marker:text-foreground">
              <li>
                <span className="text-foreground">Cómo hacer una pregunta.</span> Escribe tu consulta en el cuadro de
                texto del chat (abajo) y envíala. Puedes pedir comparaciones, resúmenes por tema o citas de propuestas
                concretas. También puedes pulsar las sugerencias que aparecen como atajos.
              </li>
              <li>
                <span className="text-foreground">Cómo elegir candidatos.</span> En el panel izquierdo, marca o desmarca
                a cada candidato. Solo se tendrán en cuenta los que estén seleccionados (hasta cinco). Si comparas a
                varios, la respuesta se organiza por persona para que puedas contrastar.
              </li>
              <li>
                <span className="text-foreground">Cómo interpretar la respuesta del chatbot.</span> El asistente
                sintetiza información tomada de los documentos de planes de gobierno: verás bloques por candidato y,
                cuando aplique, una tabla comparativa. No sustituye leer el documento completo; sirve para orientarte y
                localizar ideas antes de profundizar en las fuentes.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-foreground">
              2. El sistema de evaluación (S·M·A·T)
            </h3>
            <p className="mb-3 text-muted-foreground">
              Cada propuesta recuperada puede incluir una evaluación automática con cuatro criterios inspirados en el
              marco SMART, sin el criterio de «relevancia» (demasiado dependiente del contexto). Las siglas ayudan a
              revisar la calidad del <em>texto</em> de la propuesta tal como aparece en el fragmento, no el valor
              ideológico del programa.
            </p>
            <ul className="space-y-2 border-l-2 border-border pl-4 text-muted-foreground">
              <li>
                <strong className="text-foreground">S — Específica:</strong> ¿Se dice con claridad qué acción o medida
                se propone? Una formulación vaga («mejorar la educación») puntúa más bajo que una que nombre
                instrumentos o líneas concretas («becas», «plan nacional», plazos numéricos junto a la acción).
              </li>
              <li>
                <strong className="text-foreground">M — Medible:</strong> ¿El texto permite observar resultados o usar
                números para hacer seguimiento? Por ejemplo porcentajes del PIB, metas de cobertura o indicadores
                mencionados explícitamente en el fragmento.
              </li>
              <li>
                <strong className="text-foreground">A — Alcanzable:</strong> ¿El extracto da elementos para discutir si
                la propuesta es viable en magnitud? Aquí la herramienta suele ser prudente: sin datos presupuestales en
                el texto, la puntuación refleja incertidumbre, no una garantía de éxito o fracaso.
              </li>
              <li>
                <strong className="text-foreground">T — Temporal:</strong> ¿Se mencionan plazos, años, etapas o
                horizontes de tiempo? Las referencias explícitas a duraciones o fechas puntúan mejor que promesas sin
                calendario.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-foreground">3. Cómo leer los resultados</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Qué significan las puntuaciones (0 a 1).</strong> Cada letra lleva
                un valor entre 0 y 1: 0 indica que el criterio casi no se cumple en el fragmento; 1, que se cumple de
                forma muy clara. Los valores intermedios expresan matices (por ejemplo, algo de medibilidad pero sin
                metas completas).
              </li>
              <li>
                <strong className="text-foreground">Propuestas «fuertes» frente a «débiles» en el texto.</strong> Una
                propuesta se verá más elaborada en la lectura automática si combina especificidad, indicadores o plazos
                en el mismo pasaje. Una más débil en el análisis suele ser breve, genérica o sin números ni fechas: eso
                no implica que el programa completo sea flojo, solo que <em>este recorte</em> no aporta tanto detalle.
              </li>
              <li>
                <strong className="text-foreground">Cómo comparar candidatos.</strong> Contrasta las tarjetas o filas
                por persona y por tema. Comprueba si las diferencias vienen del contenido real del plan o del tamaño del
                fragmento citado. Para un trabajo académico, cruza siempre con el documento oficial y con la misma
                pregunta formulada de varias maneras si hace falta.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-foreground">4. Consejos prácticos</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Formular mejores preguntas.</strong> Sé explícito en el tema
                (educación, seguridad, fiscalidad) y en lo que quieres comparar: «¿Qué dicen X e Y sobre financiación de
                la salud?» suele funcionar mejor que una petición muy abierta. Divide preguntas largas en varias si la
                respuesta queda confusa.
              </li>
              <li>
                <strong className="text-foreground">Evitar malentendidos.</strong> El asistente resume lo que aparece en
                los planes; no «adivina» compromisos no escritos. Si una evaluación S·M·A·T contradice tu lectura, revisa
                el fragmento original: la herramienta puede penalizar la vaguedad del recorte. No uses las puntuaciones
                como veredicto electoral; son ayudas metodológicas para analizar claridad y detalle del texto.
              </li>
            </ul>
          </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
