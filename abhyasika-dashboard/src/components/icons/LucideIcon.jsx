import React from "react";
import * as LucideIcons from "lucide-react";

const FALLBACK_ICON = "Circle";

const toPascalCase = (value = "") =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_\s]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

const getIconComponent = (rawName = "") => {
  const trimmed = rawName.trim();
  const pascal = toPascalCase(trimmed);
  const candidates = [
    trimmed,
    pascal,
    pascal ? pascal.charAt(0).toLowerCase() + pascal.slice(1) : "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && candidate in LucideIcons) {
      return LucideIcons[candidate];
    }
  }

  return LucideIcons[FALLBACK_ICON];
};

function LucideIcon({ name = FALLBACK_ICON, className = "", strokeWidth = 2, ...rest }) {
  const IconComponent = getIconComponent(name);
  return (
    <IconComponent
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default LucideIcon;
