interface MonthNavigatorProps {
  mes: number;
  ano: number;
  onPrev: () => void;
  onNext: () => void;
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MonthNavigator({ mes, ano, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onPrev}
        className="text-gray-500 hover:text-white transition-colors duration-150 text-2xl font-light w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="text-white font-bold text-lg tracking-widest uppercase min-w-[160px] text-center">
        {MESES_PT[mes - 1]} {ano}
      </span>
      <button
        onClick={onNext}
        className="text-gray-500 hover:text-white transition-colors duration-150 text-2xl font-light w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
