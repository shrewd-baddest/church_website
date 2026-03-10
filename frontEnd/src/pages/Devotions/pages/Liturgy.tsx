export default function Liturgy() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Order of the Mass</h2>
      <div className="card">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Introductory Rites</h3>
            <p className="text-sm text-gray-600 mt-2">P: In the name of the Father, and of the Son</p>
          </div>
          <div>
            <h3 className="font-semibold">Mapokezi (Kiswahili)</h3>
            <p className="text-sm text-gray-600 mt-2">P: Kwa jina la Baba, na la Mwana...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
