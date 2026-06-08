import UserGuide from "../models/userGuideModel";

export async function buildGuideUidLookup(): Promise<Map<string, string>> {
  const guides = await UserGuide.findAll();
  const lookup = new Map<string, string>();

  for (const guide of guides) {
    lookup.set(guide.name.toLowerCase().trim(), guide.uid);
    if (guide.number && guide.number !== "N/A") {
      lookup.set(guide.number.trim(), guide.uid);
    }
  }

  return lookup;
}

export function resolveGuideUid(
  lookup: Map<string, string>,
  guideName: string,
  guideNumber: string
): string | null {
  if (!guideName || guideName === "N/A") return null;

  return (
    lookup.get(guideName.toLowerCase().trim()) ||
    lookup.get(guideNumber?.trim() || "") ||
    null
  );
}
