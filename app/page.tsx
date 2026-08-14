import Link from "next/link";

const features = [
  { icon: "🎵", label: "Votre musique" },
  { icon: "🙂", label: "Votre personnage" },
  { icon: "✨", label: "Votre direction visuelle" },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 right-[-10%] h-[30rem] w-[30rem] rounded-full bg-purple-700/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px]"
      />

      <main className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
        <span className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide text-zinc-300">
          Clips musicaux générés par IA
        </span>

        <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">MusiClip AI</h1>

        <p className="mt-5 max-w-md text-balance text-lg leading-relaxed text-zinc-400">
          Transformez une chanson, un visage et une idée en un clip vidéo. Aucune caméra, aucun montage.
        </p>

        <Link
          href="/create"
          className="mt-10 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-8 py-3.5 text-sm font-medium text-white shadow-[0_0_40px_-10px_rgba(217,70,239,0.6)] transition-transform hover:scale-[1.03]"
        >
          Créer mon clip →
        </Link>

        <ul className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-2">
              <span aria-hidden>{feature.icon}</span>
              {feature.label}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
