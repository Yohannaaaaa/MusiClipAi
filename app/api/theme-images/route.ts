import { NextResponse } from "next/server";
import { getThemeImageUrl } from "@/lib/pexels";
import { DANCE_STYLE_OPTIONS, LOCATION_OPTIONS } from "@/lib/theme-options";

export async function GET() {
  const allOptions = [...LOCATION_OPTIONS, ...DANCE_STYLE_OPTIONS];

  const entries = await Promise.all(
    allOptions.map(async (option) => [option.id, await getThemeImageUrl(option.query)] as const),
  );

  const images = Object.fromEntries(entries.filter(([, url]) => url !== null));
  return NextResponse.json({ images });
}
