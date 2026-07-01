"use client";

/**
 * Seção Notificações (F-40). Matriz evento × canal (app/e-mail) com checkboxes
 * por célula (CA01/CA02). Eventos restritos a aprovadores já chegam filtrados do
 * servidor pelo papel (CA04). "Salvar" persiste todas as células (CA03);
 * desmarcar grava false, suprimindo o canal no envio (CA05).
 *
 * A11y: <table> semântica com <caption>, <th scope>; cada checkbox tem
 * aria-label próprio (evento + canal). Botão de salvar com feedback role=status.
 */
import { useState, useTransition } from "react";
import { saveNotificationPrefsAction } from "./actions";

interface Row {
  key: string;
  label: string;
  app: boolean;
  email: boolean;
}

interface Props {
  rows: Row[];
}

export function NotificationMatrix({ rows }: Props) {
  const [isPending, startTransition] = useTransition();
  const [matrix, setMatrix] = useState<Row[]>(rows);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = matrix.some(
    (r, i) => r.app !== rows[i].app || r.email !== rows[i].email,
  );

  const toggle = (key: string, channel: "app" | "email") => {
    setSaved(false);
    setMatrix((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [channel]: !r[channel] } : r)),
    );
  };

  const handleSave = () => {
    setSaved(false);
    setError(null);
    const prefs: Record<string, { app: boolean; email: boolean }> = {};
    for (const r of matrix) prefs[r.key] = { app: r.app, email: r.email };

    startTransition(async () => {
      const res = await saveNotificationPrefsAction({ prefs });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  };

  return (
    <section
      id="notif"
      aria-labelledby="notif-h"
      className="bg-surface-container-lowest border-outline-variant p-md md:p-lg scroll-mt-24 rounded-xl border shadow-sm"
    >
      <h2 id="notif-h" className="text-headline-sm text-on-surface mb-sm">
        Notificações
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-md">
        Defina como você quer ser avisado sobre cada tipo de evento.
      </p>

      <div className="overflow-x-auto">
        <table className="text-body-sm w-full">
          <caption className="sr-only">
            Matriz de preferências de notificação por evento e canal
          </caption>
          <thead className="text-label-sm text-on-surface-variant tracking-wider uppercase">
            <tr className="border-outline-variant border-b">
              <th scope="col" className="py-sm text-left font-medium">
                Evento
              </th>
              <th scope="col" className="py-sm text-center font-medium">
                No app
              </th>
              <th scope="col" className="py-sm text-center font-medium">
                Por e-mail
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant divide-y">
            {matrix.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="py-md text-on-surface text-left font-normal"
                >
                  {row.label}
                </th>
                <td className="py-md text-center">
                  <Cell
                    checked={row.app}
                    label={`${row.label} — no app`}
                    onChange={() => toggle(row.key, "app")}
                  />
                </td>
                <td className="py-md text-center">
                  <Cell
                    checked={row.email}
                    label={`${row.label} — por e-mail`}
                    onChange={() => toggle(row.key, "email")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-md gap-sm flex items-center justify-end">
        {error && (
          <span role="alert" className="text-label-sm text-error mr-auto">
            {error}
          </span>
        )}
        {saved && (
          <span
            role="status"
            className="text-label-sm text-on-secondary-container gap-xs mr-auto flex items-center"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
              aria-hidden="true"
            >
              check_circle
            </span>
            Preferências salvas.
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !dirty}
          className="px-lg bg-primary text-on-primary hover:bg-surface-tint text-label-md rounded-lg py-2 disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Salvar preferências"}
        </button>
      </div>
    </section>
  );
}

/** Checkbox com alvo de toque ≥44px (envolve o input numa label clicável). */
function Cell({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="touch-target mx-auto cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="accent-primary h-5 w-5 rounded"
      />
    </label>
  );
}
