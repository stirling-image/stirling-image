// apps/web/src/components/editor/common/font-loader.ts

const SYSTEM_FONTS = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Courier New",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
] as const;

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Playfair Display",
  "Merriweather",
  "Raleway",
  "Oswald",
  "Nunito",
  "Ubuntu",
  "PT Sans",
  "Fira Sans",
  "Work Sans",
  "Barlow",
  "DM Sans",
  "Space Grotesk",
  "Bebas Neue",
  "Caveat",
  "Pacifico",
  "Dancing Script",
  "Permanent Marker",
  "Press Start 2P",
] as const;

const loadedFonts = new Set<string>();

export function isSystemFont(name: string): boolean {
  return (SYSTEM_FONTS as readonly string[]).includes(name);
}

export function getAllFonts(): { system: string[]; google: string[] } {
  return {
    system: [...SYSTEM_FONTS],
    google: [...GOOGLE_FONTS],
  };
}

export async function loadGoogleFont(name: string): Promise<void> {
  if (isSystemFont(name) || loadedFonts.has(name)) return;

  const slug = name.replace(/ /g, "+");
  const url = `https://fonts.googleapis.com/css2?family=${slug}:wght@400;700&display=swap`;

  // Add the stylesheet link so the browser fetches the font files
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);

  // Use the CSS Font Loading API to detect when the font is actually ready
  try {
    await document.fonts.load(`16px "${name}"`);
    loadedFonts.add(name);
  } catch {
    // Font may still load via the stylesheet even if the API rejects;
    // mark as loaded so we don't retry endlessly.
    loadedFonts.add(name);
  }
}

export function isFontLoaded(name: string): boolean {
  return isSystemFont(name) || loadedFonts.has(name);
}
