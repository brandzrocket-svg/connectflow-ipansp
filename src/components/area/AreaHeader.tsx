import type { Area } from '../../types';

interface AreaHeaderProps {
  area: Area;
}

export default function AreaHeader({ area }: AreaHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          backgroundColor: `${area.cor}18`,
          border: `1px solid ${area.cor}40`,
        }}
      >
        {area.icone}
      </div>
      <div>
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: area.cor }}
        >
          {area.nome}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Co-líder: <span className="text-gray-400">{area.colider}</span>
        </p>
      </div>
    </div>
  );
}
