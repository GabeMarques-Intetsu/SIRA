"use client";

/**
 * Seção Preferências (F-38). Tema (CA01-04) INTEGRA com next-themes via
 * `useTheme` — o botão reflete o tema ativo e o altera (aplicação imediata sem
 * reload, CA03; "Sistema" segue o SO, CA02) — e também persiste em
 * `user_preferences` (por conta, CA04). Idioma (CA05-07), densidade (CA08) e
 * reduzir-animações (CA09/CA10) aplicam-se ao <html> imediatamente e persistem.
 *
 * A11y: radiogroup p/ tema; switch (role="switch"/aria-checked) p/ reduzir
 * animações; selects com label; feedback de salvo via role="status".
 */
import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  DENSITY_OPTIONS,
  type UserPreferences,
  type LanguagePref,
  type DensityPref,
} from "@/lib/preferences";
import { savePreferencesAction } from "./actions";

interface Props {
  preferences: UserPreferences;
}

/** Aplica densidade/redução de movimento ao <html> (efeito imediato). */
function applyDensity(density: DensityPref) {
  document.documentElement.dataset.density = density;
}
function applyReduceMotion(reduce: boolean) {
  document.documentElement.classList.toggle("reduce-motion", reduce);
}

export function PreferencesPanel({ preferences }: Props) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<LanguagePref>(preferences.language);
  const [density, setDensity] = useState<DensityPref>(preferences.density);
  const [reduceMotion, setReduceMotion] = useState(preferences.reduce_motion);

  // next-themes só conhece o tema no client; adiar leitura evita mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-gate (next-themes): roda uma vez no client p/ liberar a leitura do tema.
    setMounted(true);
  }, []);

  const currentTheme = mounted
    ? (theme ?? preferences.theme)
    : preferences.theme;

  /** Persiste o conjunto atual de preferências (UPSERT por conta). */
  const persist = (next: {
    theme: string;
    language: LanguagePref;
    density: DensityPref;
    reduceMotion: boolean;
  }) => {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const res = await savePreferencesAction({
        theme: next.theme as UserPreferences["theme"],
        language: next.language,
        density: next.density,
        reduceMotion: next.reduceMotion,
      });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  };

  const handleTheme = (value: string) => {
    setTheme(value); // CA03 — aplica imediato via next-themes
    persist({ theme: value, language, density, reduceMotion });
  };

  const handleLanguage = (value: LanguagePref) => {
    setLanguage(value);
    document.documentElement.lang = value === "pt-BR" ? "pt-BR" : value; // CA06
    persist({ theme: currentTheme, language: value, density, reduceMotion });
  };

  const handleDensity = (value: DensityPref) => {
    setDensity(value);
    applyDensity(value); // CA08 — efeito imediato
    persist({ theme: currentTheme, language, density: value, reduceMotion });
  };

  const handleReduceMotion = (value: boolean) => {
    setReduceMotion(value);
    applyReduceMotion(value); // CA09 — efeito imediato
    persist({ theme: currentTheme, language, density, reduceMotion: value });
  };

  return (
    <section
      id="preferencias"
      aria-labelledby="pref-h"
      className="bg-surface-container-lowest border-outline-variant p-md md:p-lg scroll-mt-24 rounded-xl border shadow-sm"
    >
      <div className="mb-md gap-md flex items-center justify-between">
        <h2 id="pref-h" className="text-headline-sm text-on-surface">
          Preferências
        </h2>
        <SavedHint pending={isPending} saved={saved} error={error} />
      </div>

      <div className="divide-outline-variant divide-y">
        {/* Tema (CA01-04) */}
        <div className="py-md gap-md flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <p className="text-body-md text-on-surface font-medium">
              Tema da interface
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Escolha entre claro, escuro ou usar a preferência do sistema.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Tema da interface"
            className="gap-xs flex flex-wrap"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleTheme(opt.value)}
                  className={`px-md gap-xs text-label-md flex items-center rounded-lg border py-2 transition-colors ${
                    active
                      ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idioma (CA05-07) */}
        <SelectRow
          id="pref-language"
          title="Idioma"
          description="Idioma da interface e formato de datas, horas e números."
          value={language}
          onChange={(v) => handleLanguage(v as LanguagePref)}
          options={LANGUAGE_OPTIONS}
        />

        {/* Densidade (CA08) */}
        <SelectRow
          id="pref-density"
          title="Densidade da interface"
          description="Espaçamento entre elementos."
          value={density}
          onChange={(v) => handleDensity(v as DensityPref)}
          options={DENSITY_OPTIONS}
        />

        {/* Reduzir animações (CA09/CA10) */}
        <div className="py-md gap-md flex items-center justify-between">
          <div>
            <p className="text-body-md text-on-surface font-medium">
              Reduzir animações
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Diminui o movimento da interface para conforto visual.
            </p>
          </div>
          <Switch
            label="Reduzir animações"
            checked={reduceMotion}
            onChange={handleReduceMotion}
            disabled={isPending}
          />
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────── Subcomponentes ───────────────────────────────

function SelectRow({
  id,
  title,
  description,
  value,
  onChange,
  options,
}: {
  id: string;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    title?: string;
  }[];
}) {
  return (
    <div className="py-md gap-md flex items-center justify-between">
      <div>
        <label
          htmlFor={id}
          className="text-body-md text-on-surface font-medium"
        >
          {title}
        </label>
        <p id={`${id}-desc`} className="text-body-sm text-on-surface-variant">
          {description}
        </p>
      </div>
      <select
        id={id}
        aria-describedby={`${id}-desc`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm rounded-lg border py-2 outline-none focus:ring-2"
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            title={o.title}
          >
            {o.label}
            {o.disabled ? " — indisponível" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Switch acessível (role="switch" + aria-checked), alvo de toque ≥44px. */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="touch-target relative inline-flex flex-shrink-0 items-center disabled:opacity-60"
    >
      <span
        className={`block h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-surface-container-high"
        }`}
      />
      <span
        className={`bg-surface-container-lowest absolute h-5 w-5 rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function SavedHint({
  pending,
  saved,
  error,
}: {
  pending: boolean;
  saved: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <span role="alert" className="text-label-sm text-error">
        {error}
      </span>
    );
  }
  if (pending) {
    return (
      <span role="status" className="text-label-sm text-on-surface-variant">
        Salvando…
      </span>
    );
  }
  if (saved) {
    return (
      <span
        role="status"
        className="text-label-sm text-on-secondary-container gap-xs flex items-center"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16 }}
          aria-hidden="true"
        >
          check_circle
        </span>
        Salvo
      </span>
    );
  }
  return null;
}
