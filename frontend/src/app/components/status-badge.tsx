interface StatusBadgeProps {
  variant: "eligible" | "almost" | "unlikely" | "reach" | "bachelor" | "master" | "phd";
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const styles = {
    eligible: "bg-green-50 text-green-600 border-green-100",
    almost: "bg-amber-50 text-amber-600 border-amber-100",
    unlikely: "bg-red-50 text-red-600 border-red-100",
    reach: "bg-gray-50 text-gray-500 border-gray-100",
    bachelor: "bg-primary/5 text-primary border-primary/10",
    master: "bg-purple-50 text-purple-500 border-purple-100",
    phd: "bg-indigo-50 text-indigo-500 border-indigo-100",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
