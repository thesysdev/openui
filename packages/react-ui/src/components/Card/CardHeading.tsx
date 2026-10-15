/** A Card's own small title and subtitle, sized like our card items' labels. */
export const CardHeading = ({ title, subtitle }: { title?: string; subtitle?: string }) =>
  title || subtitle ? (
    <div className="openui-card__heading">
      {title && <div className="openui-card__title">{title}</div>}
      {subtitle && <div className="openui-card__subtitle">{subtitle}</div>}
    </div>
  ) : null;
