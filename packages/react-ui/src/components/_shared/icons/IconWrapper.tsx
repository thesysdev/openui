import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getFallbackIconName } from "./categoryFallbacks";
import { getIconImport } from "./dynamicIconImports";

const cachedIcons = new Map<string, LucideIcon>();

export type IconWrapperProps = {
  name: string;
  category?: string;
  size?: number;
  className?: string;
};

export const IconWrapper = ({ name, category, ...props }: IconWrapperProps) => {
  const [IconComponent, setIconComponent] = useState<LucideIcon | null>(
    () => cachedIcons.get(name) || null,
  );

  useEffect(() => {
    // Cancellation guard: streamed openui-lang can change `name` mid-load;
    // without it a slower stale load (e.g. the previous name's fallback) can
    // settle last and clobber the correct icon.
    let cancelled = false;

    const loadIcon = async (iconName: string) => {
      const iconImport = getIconImport(iconName);
      if (!iconImport) {
        return false;
      }

      try {
        const module = await iconImport();
        if (module?.default) {
          cachedIcons.set(iconName, module.default);
          if (!cancelled) {
            setIconComponent(() => module.default);
          }
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    const loadIconWithFallback = async () => {
      if (cachedIcons.has(name)) {
        setIconComponent(cachedIcons.get(name) as LucideIcon);
        return;
      }

      const loaded = await loadIcon(name);
      if (!loaded && !cancelled) {
        const fallbackName = getFallbackIconName(category);
        if (cachedIcons.has(fallbackName)) {
          setIconComponent(cachedIcons.get(fallbackName) as LucideIcon);
        } else {
          await loadIcon(fallbackName);
        }
      }
    };

    loadIconWithFallback();
    return () => {
      cancelled = true;
    };
  }, [name, category]);

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={14} {...props} />;
};
