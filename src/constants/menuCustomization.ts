export interface FontOption {
  id: string;
  label: string;
  family: string;
  googleFont?: string;
  style: "serif" | "sans-serif";
}

export const FONT_OPTIONS: FontOption[] = [
  { id: "default",    label: "Default (Inter)",       family: "Inter, sans-serif",                  style: "sans-serif" },
  { id: "playfair",   label: "Playfair Display",      family: "'Playfair Display', serif",          googleFont: "Playfair+Display:wght@400;600;700",         style: "serif"      },
  { id: "cormorant",  label: "Cormorant Garamond",    family: "'Cormorant Garamond', serif",        googleFont: "Cormorant+Garamond:wght@400;500;600;700",   style: "serif"      },
  { id: "montserrat", label: "Montserrat",            family: "'Montserrat', sans-serif",           googleFont: "Montserrat:wght@400;500;600;700",           style: "sans-serif" },
  { id: "poppins",    label: "Poppins",               family: "'Poppins', sans-serif",              googleFont: "Poppins:wght@400;500;600;700",              style: "sans-serif" },
  { id: "lora",       label: "Lora",                  family: "'Lora', serif",                      googleFont: "Lora:wght@400;600;700",                    style: "serif"      },
  { id: "raleway",    label: "Raleway",               family: "'Raleway', sans-serif",              googleFont: "Raleway:wght@400;500;600;700",              style: "sans-serif" },
  { id: "oswald",     label: "Oswald",                family: "'Oswald', sans-serif",               googleFont: "Oswald:wght@400;500;600;700",              style: "sans-serif" },
];

export const ACCENT_PRESETS = [
  "#E63946", "#F4A261", "#2A9D8F", "#264653", "#6A4C93",
  "#FF6B6B", "#48CAE4", "#06D6A0", "#FFB347", "#8338EC",
  "#3A86FF", "#FB5607", "#FFBE0B", "#FF006E", "#8AC926",
];

export const ALL_GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Raleway:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap";
