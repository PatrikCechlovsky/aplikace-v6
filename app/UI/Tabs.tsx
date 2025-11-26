// FILE: app/UI/Tabs.tsx

const tabs = [
  "Pronajímatel",
  "Nemovitosti",
  "Jednotky",
  "Nájemníci",
  "Smlouvy",
  "Služby",
  "Platby",
  "Finance",
  "Měřidla",
  "Dokumenty"
]

export default function Tabs() {
  return (
    <div className="flex gap-3 overflow-x-auto whitespace-nowrap text-sm">
      {tabs.map((t, i) => (
        <div
          key={i}
          className="px-4 py-2 border rounded bg-white cursor-pointer hover:bg-gray-100"
        >
          {t}
        </div>
      ))}
    </div>
  )
}
