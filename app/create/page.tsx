"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type CharacterMode = "photos" | "description";

type GenerateResponse = {
  status?: "completed" | "failed";
  videoUrl?: string;
  message?: string;
  error?: string;
};

type Phase = "idle" | "uploading" | "generating";

export default function CreatePage() {
  const [songFile, setSongFile] = useState<File | null>(null);
  const [characterMode, setCharacterMode] = useState<CharacterMode | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [characterDescription, setCharacterDescription] = useState("");
  const [visualDirection, setVisualDirection] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!songFile) return;

    setResult(null);

    try {
      setPhase("uploading");
      const songBlob = await upload(songFile.name, songFile, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });

      let photoUrls: string[] = [];
      if (characterMode === "photos" && photos.length > 0) {
        photoUrls = await Promise.all(
          photos.map(async (photo) => {
            const blob = await upload(photo.name, photo, {
              access: "public",
              handleUploadUrl: "/api/blob-upload",
            });
            return blob.url;
          }),
        );
      }

      setPhase("generating");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songName: songFile.name,
          songType: songFile.type,
          songUrl: songBlob.url,
          characterMode: characterMode ?? "none",
          characterDescription,
          photoUrls,
          visualDirection,
        }),
      });

      const data: GenerateResponse = await response.json();
      setResult(response.ok ? data : { error: data.error ?? `Erreur serveur (HTTP ${response.status}).` });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Impossible de contacter le serveur. Réessayez." });
    } finally {
      setPhase("idle");
    }
  }

  const isSubmitting = phase !== "idle";

  return (
    <div className="flex flex-1 justify-center bg-black">
      <main className="w-full max-w-lg">
        <div className="flex items-center gap-4 px-5 pt-5 pb-3">
          <Link
            href="/"
            aria-label="Retour"
            className="flex h-8 w-8 items-center justify-center text-xl text-white/90 hover:text-fuchsia-400"
          >
            ←
          </Link>
          <h1 className="text-lg font-semibold text-white">Clip musical</h1>
        </div>

        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-fuchsia-700 via-purple-800 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-5 py-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <span aria-hidden className="text-fuchsia-500">
                ⭱
              </span>
              Votre chanson
            </h2>
            <label
              htmlFor="song"
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-4 text-left transition-colors hover:border-fuchsia-500"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-2xl">
                🎧
              </span>
              <span>
                <span className="block font-medium text-white">
                  {songFile ? songFile.name : "Téléverser votre chanson"}
                </span>
                <span className="block text-xs text-zinc-400">MP3, WAV, M4A • jusqu&apos;à 50 Mo</span>
              </span>
            </label>
            <input
              id="song"
              name="song"
              type="file"
              accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a"
              className="sr-only"
              required
              onChange={(event) => setSongFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-2 text-xs text-zinc-500">
              Le fichier est envoyé directement vers le stockage (Vercel Blob), sans passer par la limite de taille
              du serveur. La génération elle-même reste simulée pour l&apos;instant.
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="text-fuchsia-500">
                ☺
              </span>
              <h2 className="text-sm font-medium text-white">Qui est dans votre histoire ?</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Optionnel</span>
            </div>

            <div className="relative grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCharacterMode("photos")}
                className={`flex flex-col items-center gap-2 rounded-2xl border bg-zinc-900/60 px-3 py-6 text-center transition-colors ${
                  characterMode === "photos" ? "border-fuchsia-500" : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  🖼️
                </span>
                <span className="text-sm font-medium text-white">
                  {photos.length > 0 ? `${photos.length} photo(s)` : "Importer des photos"}
                </span>
              </button>

              <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                ou
              </span>

              <button
                type="button"
                onClick={() => setCharacterMode("description")}
                className={`flex flex-col items-center gap-2 rounded-2xl border bg-zinc-900/60 px-3 py-6 text-center transition-colors ${
                  characterMode === "description" ? "border-fuchsia-500" : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  💬
                </span>
                <span className="text-sm font-medium text-white">Décrire le personnage</span>
              </button>
            </div>

            {characterMode === "photos" && (
              <label
                htmlFor="photos"
                className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-5 text-center transition-colors hover:border-fuchsia-500"
              >
                <span className="text-sm font-medium text-white">
                  {photos.length > 0 ? `${photos.length} photo(s) sélectionnée(s)` : "Choisir des photos"}
                </span>
                <span className="text-xs text-zinc-400">JPG, PNG • plusieurs fichiers possibles</span>
                <input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
                />
              </label>
            )}
            {characterMode === "description" && (
              <textarea
                name="characterDescription"
                value={characterDescription}
                onChange={(event) => setCharacterDescription(event.target.value)}
                placeholder="Décrivez le personnage : apparence, style, ambiance..."
                rows={3}
                className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
              />
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="text-fuchsia-500">
                ✦
              </span>
              <h2 className="text-sm font-medium text-white">Direction visuelle</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Optionnel</span>
            </div>
            <div className="relative">
              <textarea
                name="visualDirection"
                value={visualDirection}
                onChange={(event) => setVisualDirection(event.target.value)}
                placeholder="Décrivez le style visuel. Décor, lumière, couleurs, ambiance..."
                rows={3}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 p-3 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
              />
              <span aria-hidden className="absolute bottom-3 right-3 text-zinc-500">
                ⊕
              </span>
            </div>
          </section>

          <button
            type="submit"
            disabled={!songFile || isSubmitting}
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-3.5 text-center font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === "uploading"
              ? "Téléversement..."
              : phase === "generating"
                ? "Génération en cours..."
                : "Générer mon clip musical →"}
          </button>
        </form>

        {result && (
          <div
            className={`mx-5 mb-8 rounded-2xl border p-4 text-sm ${
              result.error
                ? "border-red-900 bg-red-950 text-red-300"
                : "border-emerald-900 bg-emerald-950 text-emerald-300"
            }`}
          >
            {result.error ?? result.message}
            {result.videoUrl && <video src={result.videoUrl} controls className="mt-3 w-full rounded-lg" />}
          </div>
        )}
      </main>
    </div>
  );
}
