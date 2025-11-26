// FILE: app/UI/ListView.tsx

export default function ListView() {
  return (
    <div className="bg-white rounded p-4 shadow-sm text-sm">
      <h2 className="text-lg font-semibold mb-4">Přehled entit</h2>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Filtr…"
      />

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Název</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50 cursor-pointer">
            <td className="p-2 border">1</td>
            <td className="p-2 border">Test entity</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
