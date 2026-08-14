import { NextResponse } from "next/server";
import { getVideoProvider } from "@/lib/video-provider";

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Paramètre jobId manquant." }, { status: 400 });
  }

  const provider = getVideoProvider();
  if (!provider.getStatus) {
    return NextResponse.json({ error: `Le fournisseur "${provider.id}" ne supporte pas le suivi de statut.` }, { status: 400 });
  }

  try {
    const result = await provider.getStatus(jobId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de la vérification du statut.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
