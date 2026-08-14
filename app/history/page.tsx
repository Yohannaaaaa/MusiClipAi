import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { generations } from "@/db/schema";

const STATUS_LABELS: Record<string, string> = {
  completed: "Terminé",
  failed: "Échoué",
  processing: "En cours",
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const items = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, session.user.id))
    .orderBy(desc(generations.createdAt));

  return (
    <div className="flex flex-1 justify-center bg-black">
      <main className="w-full max-w-lg px-5 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/create" aria-label="Retour" className="flex h-8 w-8 items-center justify-center text-xl text-white/90 hover:text-fuchsia-400">
            ←
          </Link>
          <h1 className="text-lg font-semibold text-white">Historique</h1>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun clip généré pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium text-white">{item.songName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      item.status === "completed"
                        ? "bg-emerald-950 text-emerald-400"
                        : item.status === "failed"
                          ? "bg-red-950 text-red-400"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(item.createdAt).toLocaleString("fr-FR")}
                  {item.quality ? ` • ${item.quality}` : ""}
                  {item.danceStyle ? ` • ${item.danceStyle}` : ""}
                </p>
                {item.locations && item.locations.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">Lieux : {item.locations.join(", ")}</p>
                )}
                {item.message && <p className="mt-2 text-sm text-zinc-300">{item.message}</p>}
                {item.videoUrl && <video src={item.videoUrl} controls className="mt-3 w-full rounded-lg" />}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
