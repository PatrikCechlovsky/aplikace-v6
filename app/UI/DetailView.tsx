// FILE: app/UI/DetailView.tsx

export default function DetailView() {
  return (
    <div className="bg-white rounded p-4 shadow-sm text-sm">
      <h2 className="text-lg font-semibold mb-4">Detail entity (hlavní karta)</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Základní údaje</h3>
          <input
            className="border p-2 w-full mt-2"
            placeholder="Název / jméno"
          />
        </div>

        <div>
          <h3 className="font-medium">Přílohy</h3>
          <button className="px-3 py-1 border rounded">📎 Přidat přílohu</button>
        </div>

        <div>
          <h3 className="font-medium">Systémové informace</h3>
          <p className="text-gray-500">ID: 123 | Vytvořeno: dnes</p>
        </div>
      </div>
    </div>
  )
}
