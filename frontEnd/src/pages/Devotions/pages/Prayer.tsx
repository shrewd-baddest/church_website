export default function Prayer() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Introductory Prayers</h2>
      <div className="flex gap-6">
        <aside className="w-64 card">
          <ol className="space-y-3 text-sm">
            <li className="font-semibold">Step 1: The Apostles' Creed</li>
            <li>Step 2: Our Father</li>
            <li>Step 3: Hail Mary (x3)</li>
          </ol>
        </aside>
        <div className="flex-1 card">
          <h3 className="text-xl font-semibold">The Apostles' Creed</h3>
          <p className="mt-3 text-gray-700">I believe in God, the Father almighty, Creator of heaven and earth...</p>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Next Step</button>
          </div>
        </div>
      </div>
    </div>
  )
}
