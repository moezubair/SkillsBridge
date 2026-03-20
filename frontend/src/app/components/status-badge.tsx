interface StatusBadgeProps {
  variant: "eligible" | "almost" | "reach" | "bachelor" | "master" | "phd";
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const styles = {
    eligible: "bg-green-100 text-green-700 border-green-200",
    almost: "bg-amber-100 text-amber-700 border-amber-200",
    reach: "bg-gray-100 text-gray-700 border-gray-200",
    bachelor: "bg-blue-100 text-blue-700 border-blue-200",
    master: "bg-purple-100 text-purple-700 border-purple-200",
    phd: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
