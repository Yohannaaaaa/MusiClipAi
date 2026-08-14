export type ThemeOption = { id: string; label: string; icon: string; gradient: string; query: string };

export const LOCATION_OPTIONS: ThemeOption[] = [
  { id: "Plage", label: "Plage", icon: "🏖️", gradient: "from-amber-400 via-orange-500 to-sky-600", query: "tropical beach" },
  { id: "Ville la nuit", label: "Ville la nuit", icon: "🌃", gradient: "from-indigo-700 via-purple-700 to-black", query: "city night lights" },
  { id: "Rooftop", label: "Rooftop", icon: "🏙️", gradient: "from-sky-600 via-indigo-600 to-purple-800", query: "rooftop city skyline" },
  { id: "Studio", label: "Studio", icon: "🎙️", gradient: "from-zinc-600 via-zinc-800 to-black", query: "music recording studio" },
  { id: "Nature", label: "Nature", icon: "🌿", gradient: "from-emerald-500 via-green-700 to-zinc-900", query: "nature landscape" },
  { id: "Rue", label: "Rue", icon: "🚶", gradient: "from-stone-500 via-stone-700 to-zinc-900", query: "city street" },
  { id: "Club / fête", label: "Club / fête", icon: "🎉", gradient: "from-fuchsia-600 via-purple-700 to-black", query: "nightclub party lights" },
  { id: "Intérieur cosy", label: "Intérieur cosy", icon: "🛋️", gradient: "from-amber-600 via-orange-800 to-zinc-900", query: "cozy living room" },
  { id: "New York", label: "New York", icon: "🗽", gradient: "from-yellow-500 via-orange-600 to-zinc-900", query: "new york city" },
  { id: "Désert", label: "Désert", icon: "🏜️", gradient: "from-orange-400 via-amber-600 to-red-900", query: "desert dunes" },
  { id: "Piscine", label: "Piscine", icon: "🏊", gradient: "from-cyan-400 via-sky-600 to-blue-800", query: "swimming pool" },
  { id: "Concert", label: "Concert", icon: "🎤", gradient: "from-rose-600 via-fuchsia-700 to-black", query: "concert stage lights" },
  { id: "Forêt", label: "Forêt", icon: "🌲", gradient: "from-green-600 via-emerald-800 to-zinc-900", query: "forest trees" },
  { id: "Voitures de luxe", label: "Voitures de luxe", icon: "🏎️", gradient: "from-red-600 via-zinc-700 to-black", query: "luxury sports car" },
  { id: "Scène rétro", label: "Scène rétro", icon: "📼", gradient: "from-pink-500 via-purple-600 to-indigo-900", query: "retro neon stage" },
  { id: "Marché nocturne", label: "Marché nocturne", icon: "🏮", gradient: "from-red-500 via-orange-600 to-zinc-900", query: "night market lanterns" },
];

export const DANCE_STYLE_OPTIONS: ThemeOption[] = [
  { id: "Tango", label: "Tango", icon: "💃", gradient: "from-red-700 via-rose-800 to-black", query: "tango dance couple" },
  { id: "Danse K-Pop", label: "Danse K-Pop", icon: "✨", gradient: "from-fuchsia-500 via-purple-600 to-indigo-800", query: "kpop dance group" },
  { id: "Ballet", label: "Ballet", icon: "🩰", gradient: "from-pink-300 via-pink-500 to-purple-700", query: "ballet dancer" },
  { id: "Hip-Hop", label: "Hip-Hop", icon: "🕺", gradient: "from-zinc-600 via-zinc-800 to-black", query: "hip hop dancer street" },
  { id: "Pole Dance", label: "Pole Dance", icon: "💫", gradient: "from-purple-600 via-fuchsia-700 to-black", query: "pole dance performer" },
  { id: "Breakdance", label: "Breakdance", icon: "🌀", gradient: "from-orange-500 via-red-600 to-zinc-900", query: "breakdance bboy" },
  { id: "Salsa", label: "Salsa", icon: "💃", gradient: "from-red-500 via-orange-600 to-amber-700", query: "salsa dance couple" },
  { id: "House Dance", label: "House Dance", icon: "🔊", gradient: "from-sky-500 via-indigo-600 to-purple-800", query: "house dance club" },
  { id: "Danse afro", label: "Danse afro (Afrobeats)", icon: "🥁", gradient: "from-amber-500 via-orange-700 to-red-900", query: "afrobeats dance" },
  { id: "Bachata", label: "Bachata", icon: "❤️", gradient: "from-rose-500 via-red-700 to-zinc-900", query: "bachata dance couple" },
  { id: "Danse orientale", label: "Danse orientale", icon: "🪗", gradient: "from-amber-400 via-fuchsia-600 to-purple-800", query: "belly dance performer" },
  { id: "Heels Dance", label: "Heels Dance", icon: "👠", gradient: "from-pink-600 via-fuchsia-700 to-black", query: "heels dance performer" },
];
