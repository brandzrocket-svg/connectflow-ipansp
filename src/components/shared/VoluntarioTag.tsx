interface VoluntarioTagProps {
  nome: string;
  cor: string;
  onRemove?: () => void;
}

export default function VoluntarioTag({ nome, cor, onRemove }: VoluntarioTagProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: `${cor}18`,
        border: `1px solid ${cor}40`,
        color: '#ffffff',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cor }}
      />
      {nome}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-gray-400 hover:text-white transition-colors duration-150 text-xs leading-none"
          aria-label={`Remover ${nome}`}
        >
          ✕
        </button>
      )}
    </span>
  );
}
