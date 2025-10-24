// src/components/layout/Section.tsx
import { PropsWithChildren } from "react";

type SectionProps = PropsWithChildren<{ title: string; className?: string }>;

export default function Section({ title, className = "", children }: SectionProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow ${className}`}>
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
