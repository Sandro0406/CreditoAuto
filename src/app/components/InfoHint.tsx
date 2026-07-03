import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface InfoHintProps {
  text: string;
  className?: string;
}

/**
 * Ícono de ayuda (ⓘ) que muestra la definición de un concepto financiero
 * al pasar el mouse o al enfocarlo con teclado. Accesible y no intrusivo.
 */
export default function InfoHint({ text, className = '' }: InfoHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Más información"
          className={`inline-flex items-center align-middle text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded ${className}`}
        >
          <Info className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px] text-left leading-snug">{text}</TooltipContent>
    </Tooltip>
  );
}
