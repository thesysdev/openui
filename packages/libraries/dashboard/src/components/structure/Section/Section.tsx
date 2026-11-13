import type { ReactNode } from "react";
export interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}
export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="openui-dashboard-section">
      {title ? (
        <div className="openui-dashboard-section-head">
          <h2 className="openui-dashboard-section-title">{title}</h2>
          {description ? (
            <p className="openui-dashboard-section-description">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
