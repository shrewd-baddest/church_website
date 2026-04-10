import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'

const API_BASE = `${import.meta.env.VITE_SERVER_URI}/api/officials/list`
const UPLOAD_BASE = import.meta.env.VITE_SERVER_URI || ''

const CATEGORY_ORDER = [
  'Executive','Jumuiya Coordinators','Bible Coordinators','Rosary',
  'Pamphlet Managers','Project Managers','Liturgist','Instrument Managers',
  'Choir Officials','Liturgical Dancers','Catechist'
]

const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgist': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-violet-600 to-violet-700',
  'Catechist': 'from-yellow-600 to-yellow-700',
}

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E'

export default function PublicView() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [data, setData]             = React.useState<any[]>([])
  const [loading, setLoading]       = React.useState(true)
  const [fetchError, setFetchError] = React.useState('')

  React.useEffect(() => { fetchOfficials() }, [])

  async function fetchOfficials() {
    setLoading(true); setFetchError('')
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = await res.json()
      setData(json.data || [])
    } catch (e) {
      setFetchError((e as Error).message || 'Failed to load officials')
    } finally { setLoading(false) }
  }

  const grouped = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    data.forEach(d => { const c = d.category || 'Other'; (map[c] ||= []).push(d) })
    return map
  }, [data])

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center relative">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/officials')}
              className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Officials
            </button>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our CSA Officials</h1>
          <p className="text-gray-500">Click any official card to view their full profile and responsibilities</p>
        </div>

        {fetchError ? (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-4">
            <div className="text-sm text-red-700">Unable to load officials: {fetchError}</div>
            <button onClick={fetchOfficials} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold">Retry</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          CATEGORY_ORDER.map(cat => (
            <section key={cat} className="mb-16">
              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className={`h-1 w-12 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded`}></div>
                  <h2 className="text-2xl font-bold text-gray-900">{cat}</h2>
                  <div className={`h-1 w-12 bg-gradient-to-l ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded`}></div>
                </div>
                <div className="flex justify-center">
                  <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'}`}>
                    {(grouped[cat] || []).length} member{(grouped[cat] || []).length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {(grouped[cat] || []).length === 0 ? (
                  <div className="w-full flex justify-center py-8">
                    <p className="text-gray-400 text-lg">No members in this category</p>
                  </div>
                ) : (grouped[cat] || []).map(off => (
                  <article
                    key={off.id}
                    onClick={() => navigate(`/officials/${off.id}`)}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                    style={{ width: 'calc(50% - 0.5rem)', maxWidth: '220px' }}
                    title={`View ${off.name}'s profile`}
                  >
                    {/* Photo */}
                    <div className="relative h-36 sm:h-44 md:h-52 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      <img
                        src={off.photo ? `${UPLOAD_BASE}${off.photo}` : DEFAULT_AVATAR}
                        alt={off.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover:opacity-25 transition-opacity duration-300`}></div>
                      {/* "View Profile" hint on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span style={{
                          background: 'rgba(15,23,42,0.75)', color: 'white',
                          padding: '6px 14px', borderRadius: '20px',
                          fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.05em',
                          backdropFilter: 'blur(4px)',
                        }}>
                          VIEW PROFILE
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 text-center">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                        {off.name}
                      </h3>
                      <p className={`text-xs sm:text-sm font-semibold bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} bg-clip-text text-transparent mt-2`}>
                        {off.position || off.category}
                      </p>

                      {/* Contact Actions */}
                      {off.contact && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex justify-center gap-3">
                          <a
                            href={`tel:${off.contact.replace(/[^+0-9]/g,'')}`}
                            onClick={e => e.stopPropagation()}
                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 hover:text-white relative overflow-hidden group flex items-center justify-center transition-all shadow-sm"
                            title="Call Official"
                          >
                            <div className={`absolute inset-0 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover:opacity-100 transition-opacity z-0`}></div>
                            <FaPhoneAlt size={14} className="z-10 relative" />
                          </a>
                          <a
                            href={`https://wa.me/${off.contact.replace(/[^+0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-10 h-10 rounded-xl bg-gray-50 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm z-10"
                            title="WhatsApp"
                          >
                            <FaWhatsapp size={18} />
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}

        {/* View Past Officials */}
        <div className="mt-20 mb-12 flex flex-col items-center">
          <div className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8"></div>
          <p className="text-gray-400 text-sm font-medium mb-6">Want to see our leadership history?</p>
          <button
            onClick={() => navigate('/officials/history')}
            className="group flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 text-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 font-bold"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>View Past Officials History</span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
