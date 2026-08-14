"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "login" | "register" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "magic") {
        const result = await signIn("resend", { email, redirect: false });
        if (result?.error) {
          setMessage({ text: "Impossible d'envoyer le lien de connexion. Réessayez.", isError: true });
        } else {
          setMessage({ text: "Lien de connexion envoyé ! Consultez votre boîte mail.", isError: false });
        }
        return;
      }

      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage({ text: data.error ?? "Impossible de créer le compte.", isError: true });
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/create" });
      if (result?.error) {
        setMessage({ text: "Email ou mot de passe incorrect.", isError: true });
      } else {
        router.push("/create");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-block text-xs font-medium text-zinc-500 hover:text-fuchsia-400">
          ← Retour
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-white">
          {mode === "register" ? "Créer un compte" : "Se connecter"}
        </h1>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/create" })}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-zinc-500"
        >
          Continuer avec Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-zinc-800" />
          ou
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nom (optionnel)"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
          />
          {mode !== "magic" && (
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none"
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-3 text-center text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "..."
              : mode === "register"
                ? "Créer mon compte"
                : mode === "magic"
                  ? "Envoyer le lien de connexion"
                  : "Se connecter"}
          </button>
        </form>

        {message && (
          <p className={`mt-3 text-sm ${message.isError ? "text-red-400" : "text-emerald-400"}`}>{message.text}</p>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-zinc-500">
          {mode !== "register" ? (
            <button type="button" onClick={() => setMode("register")} className="hover:text-fuchsia-400">
              Pas de compte ? Créez-en un
            </button>
          ) : (
            <button type="button" onClick={() => setMode("login")} className="hover:text-fuchsia-400">
              Déjà un compte ? Connectez-vous
            </button>
          )}
          {mode !== "magic" ? (
            <button type="button" onClick={() => setMode("magic")} className="hover:text-fuchsia-400">
              Se connecter par lien magique (sans mot de passe)
            </button>
          ) : (
            <button type="button" onClick={() => setMode("login")} className="hover:text-fuchsia-400">
              Utiliser un mot de passe à la place
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
