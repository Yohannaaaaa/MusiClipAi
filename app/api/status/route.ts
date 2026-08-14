import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { generations } from "@/db/schema";
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

    if (result.status === "completed" || result.status === "failed") {
      try {
        const session = await auth();
        if (session?.user?.id) {
          await db
            .update(generations)
            .set({ status: result.status, videoUrl: result.videoUrl ?? null, message: result.message })
            .where(and(eq(generations.jobId, jobId), eq(generations.userId, session.user.id)));
        }
      } catch {
        // Best-effort history update — never let a DB hiccup mask the actual generation status.
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors de la vérification du statut.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
