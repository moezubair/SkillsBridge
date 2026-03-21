import { X } from "lucide-react";

interface FilterPillProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export function FilterPill({ label, active, onRemove, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
      {onRemove && (
        <X
          className="w-3.5 h-3.5 cursor-pointer hover:text-gray-900"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}
