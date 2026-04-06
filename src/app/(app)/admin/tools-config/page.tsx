const fields = [
  { key: "titulo_documento", desc: "Título principal del PDF" },
  { key: "contenido_principal", desc: "Contenido de valor" },
  { key: "cta1_texto", desc: "CTA principal" },
];

export default function ToolsConfigPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ajustes de campos</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--brand-1)]">
              <th className="py-2">Campo</th>
              <th className="py-2">Qué hace</th>
              <th className="py-2">Uso</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.key} className="border-t border-[var(--border)]">
                <td className="py-2 font-medium">{f.key}</td>
                <td className="py-2">{f.desc}</td>
                <td className="py-2">
                  <select className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1">
                    <option>obligatorio</option>
                    <option>opcional</option>
                    <option>oculto</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
