interface StatusBadgeProps {
  totalAreas: number;
  escalasPreenchidas: number;
}

export default function StatusBadge({ totalAreas, escalasPreenchidas }: StatusBadgeProps) {
  const completa = escalasPreenchidas >= totalAreas;

  if (completa) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
        Completa ✓
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#EAB308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
      Pendente ⚠ {escalasPreenchidas}/{totalAreas}
    </span>
  );
}
