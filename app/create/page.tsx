"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type CharacterMode = "photos" | "description";
type VideoQuality = "normal" | "4k" | "8k";

const QUALITY_OPTIONS: { value: VideoQuality; label: string; hint: string }[] = [
  { value: "normal", label: "Normale", hint: "1080p" },
  { value: "4k", label: "4K", hint: "2160p" },
  { value: "8k", label: "8K", hint: "4320p" },
];

type VisualOption = { id: string; label: string; icon: string; gradient: string };

const LOCATION_OPTIONS: VisualOption[] = [
  { id: "Plage", label: "Plage", icon: "🏖️", gradient: "from-amber-400 via-orange-500 to-sky-600" },
  { id: "Ville la nuit", label: "Ville la nuit", icon: "🌃", gradient: "from-indigo-700 via-purple-700 to-black" },
  { id: "Rooftop", label: "Rooftop", icon: "🏙️", gradient: "from-sky-600 via-indigo-600 to-purple-800" },
  { id: "Studio", label: "Studio", icon: "🎙️", gradient: "from-zinc-600 via-zinc-800 to-black" },
  { id: "Nature", label: "Nature", icon: "🌿", gradient: "from-emerald-500 via-green-700 to-zinc-900" },
  { id: "Rue", label: "Rue", icon: "🚶", gradient: "from-stone-500 via-stone-700 to-zinc-900" },
  { id: "Club / fête", label: "Club / fête", icon: "🎉", gradient: "from-fuchsia-600 via-purple-700 to-black" },
  { id: "Intérieur cosy", label: "Intérieur cosy", icon: "🛋️", gradient: "from-amber-600 via-orange-800 to-zinc-900" },
  { id: "New York", label: "New York", icon: "🗽", gradient: "from-yellow-500 via-orange-600 to-zinc-900" },
  { id: "Désert", label: "Désert", icon: "🏜️", gradient: "from-orange-400 via-amber-600 to-red-900" },
  { id: "Piscine", label: "Piscine", icon: "🏊", gradient: "from-cyan-400 via-sky-600 to-blue-800" },
  { id: "Concert", label: "Concert", icon: "🎤", gradient: "from-rose-600 via-fuchsia-700 to-black" },
  { id: "Forêt", label: "Forêt", icon: "🌲", gradient: "from-green-600 via-emerald-800 to-zinc-900" },
  { id: "Voitures de luxe", label: "Voitures de luxe", icon: "🏎️", gradient: "from-red-600 via-zinc-700 to-black" },
  { id: "Scène rétro", label: "Scène rétro", icon: "📼", gradient: "from-pink-500 via-purple-600 to-indigo-900" },
  { id: "Marché nocturne", label: "Marché nocturne", icon: "🏮", gradient: "from-red-500 via-orange-600 to-zinc-900" },
];

const DANCE_STYLE_OPTIONS: VisualOption[] = [
  { id: "Tango", label: "Tango", icon: "💃", gradient: "from-red-700 via-rose-800 to-black" },
  { id: "Danse K-Pop", label: "Danse K-Pop", icon: "✨", gradient: "from-fuchsia-500 via-purple-600 to-indigo-800" },
  { id: "Ballet", label: "Ballet", icon: "🩰", gradient: "from-pink-300 via-pink-500 to-purple-700" },
  { id: "Hip-Hop", label: "Hip-Hop", icon: "🕺", gradient: "from-zinc-600 via-zinc-800 to-black" },
  { id: "Pole Dance", label: "Pole Dance", icon: "💫", gradient: "from-purple-600 via-fuchsia-700 to-black" },
  { id: "Breakdance", label: "Breakdance", icon: "🌀", gradient: "from-orange-500 via-red-600 to-zinc-900" },
  { id: "Salsa", label: "Salsa", icon: "💃", gradient: "from-red-500 via-orange-600 to-amber-700" },
  { id: "House Dance", label: "House Dance", icon: "🔊", gradient: "from-sky-500 via-indigo-600 to-purple-800" },
  { id: "Danse afro", label: "Danse afro (Afrobeats)", icon: "🥁", gradient: "from-amber-500 via-orange-700 to-red-900" },
  { id: "Bachata", label: "Bachata", icon: "❤️", gradient: "from-rose-500 via-red-700 to-zinc-900" },
  { id: "Danse orientale", label: "Danse orientale", icon: "🪗", gradient: "from-amber-400 via-fuchsia-600 to-purple-800" },
  { id: "Heels Dance", label: "Heels Dance", icon: "👠", gradient: "from-pink-600 via-fuchsia-700 to-black" },
];

type GenerateResponse = {
  status?: "completed" | "failed" | "processing";
  videoUrl?: string;
  jobId?: string;
  message?: string;
  error?: string;
};

type Phase = "idle" | "uploading" | "generating";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

export default function CreatePage() {
  const [songFile, setSongFile] = useState<File | null>(null);
  const [characterMode, setCharacterMode] = useState<CharacterMode | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [characterDescription, setCharacterDescription] = useState("");
  const [visualDirection, setVisualDirection] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [customLocation, setCustomLocation] = useState("");
  const [danceStyle, setDanceStyle] = useState<string | null>(null);
  const [quality, setQuality] = useState<VideoQuality>("normal");
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

      const customLocations = customLocation
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const allLocations = [...new Set([...locations, ...customLocations])];

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
          locations: allLocations,
          danceStyle,
          quality,
        }),
      });

      const data: GenerateResponse = await response.json();
      if (!response.ok) {
        setResult({ error: data.error ?? `Erreur serveur (HTTP ${response.status}).` });
        return;
      }

      if (data.status === "processing" && data.jobId) {
        setResult({ message: data.message });
        await pollStatus(data.jobId);
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Impossible de contacter le serveur. Réessayez." });
    } finally {
      setPhase("idle");
    }
  }

  async function pollStatus(jobId: string) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const response = await fetch(`/api/status?jobId=${encodeURIComponent(jobId)}`);
      const data: GenerateResponse = await response.json();

      if (!response.ok) {
        setResult({ error: data.error ?? `Erreur serveur (HTTP ${response.status}).` });
        return;
      }
      if (data.status === "completed" || data.status === "failed") {
        setResult(data);
        return;
      }
      setResult({ message: data.message });
    }
    setResult({ error: "La génération prend trop de temps. Réessayez plus tard." });
  }

  const isSubmitting = phase !== "idle";

  function toggleLocation(location: string) {
    setLocations((current) =>
      current.includes(location) ? current.filter((entry) => entry !== location) : [...current, location],
    );
  }

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

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="text-fuchsia-500">
                📍
              </span>
              <h2 className="text-sm font-medium text-white">Lieux du clip</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Optionnel</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LOCATION_OPTIONS.map((location) => {
                const selected = locations.includes(location.id);
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => toggleLocation(location.id)}
                    className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br text-left ring-2 transition-all ${location.gradient} ${
                      selected ? "ring-fuchsia-500" : "ring-transparent hover:ring-zinc-600"
                    }`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <span className="absolute right-1.5 top-1.5 text-base drop-shadow" aria-hidden>
                      {location.icon}
                    </span>
                    {selected && (
                      <span className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[10px] text-white">
                        ✓
                      </span>
                    )}
                    <span className="absolute inset-x-1.5 bottom-1.5 text-xs font-medium leading-tight text-white drop-shadow">
                      {location.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customLocation}
              onChange={(event) => setCustomLocation(event.target.value)}
              placeholder="Autre lieu (séparez par des virgules)..."
              className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
            />
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="text-fuchsia-500">
                💃
              </span>
              <h2 className="text-sm font-medium text-white">Style de danse</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Optionnel</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DANCE_STYLE_OPTIONS.map((style) => {
                const selected = danceStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setDanceStyle(selected ? null : style.id)}
                    className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br text-left ring-2 transition-all ${style.gradient} ${
                      selected ? "ring-fuchsia-500" : "ring-transparent hover:ring-zinc-600"
                    }`}
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <span className="absolute right-1.5 top-1.5 text-base drop-shadow" aria-hidden>
                      {style.icon}
                    </span>
                    {selected && (
                      <span className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[10px] text-white">
                        ✓
                      </span>
                    )}
                    <span className="absolute inset-x-1.5 bottom-1.5 text-xs font-medium leading-tight text-white drop-shadow">
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden className="text-fuchsia-500">
                🎬
              </span>
              <h2 className="text-sm font-medium text-white">Qualité vidéo</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setQuality(option.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl border bg-zinc-900/60 px-3 py-3 text-center transition-colors ${
                    quality === option.value ? "border-fuchsia-500" : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  <span className="text-xs text-zinc-500">{option.hint}</span>
                </button>
              ))}
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
