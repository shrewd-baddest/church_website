import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API_BASE = '/api/officials/list'
const UPLOAD_BASE = '' // Photos are served relatively from /api or static routes

const CATEGORY_ORDER = [
  'Executive','Jumuiya Coordinators','Bible Coordinators','Rosary','Pamphlet Managers','Project Managers','Liturgist','Instrument Managers','Choir Officials','Liturgical Dancers','Catechist'
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
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
}

export default function PublicView(){
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data,setData] = React.useState<any[]>([])
  const [loading,setLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState('')

  React.useEffect(()=>{ fetchOfficials() },[])

  async function fetchOfficials(){
    setLoading(true)
    setFetchError('')
    try{
      const res = await fetch(API_BASE)
      if(!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = await res.json()
      setData(json.data || [])
    }catch(e){
      console.error(e)
      setFetchError((e as Error).message || 'Failed to load officials')
    }finally{ setLoading(false) }
  }

  const grouped = React.useMemo(()=>{
    const map: Record<string, any[]> = {}
    data.forEach(d=>{ const c = d.category||'Other'; (map[c] ||= []).push(d) })
    return map
  },[data])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center relative">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/officials')}
              className="absolute top-0 right-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 text-sm sm:text-base"
            >
              Manage Officials
            </button>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Our CSA Officials</h1>
          <p className="text-gray-600">Meet our dedicated team members</p>
        </div>

        {fetchError ? (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center justify-center gap-4">
              <div className="text-sm text-red-700">Unable to load officials: {fetchError}</div>
              <button onClick={()=>fetchOfficials()} className="px-3 py-1 bg-red-600 text-white rounded">Retry</button>
            </div>
          </div>
        ) : loading? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          CATEGORY_ORDER.map(cat=> (
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
                    {(grouped[cat]||[]).length} member{(grouped[cat]||[]).length!==1?'s':''}
                  </span>
                </div>
              </div>

              {/* Cards Grid - Responsive Flex Centered */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {(grouped[cat]||[]).length===0 ? (
                  <div className="w-full flex justify-center py-8">
                    <p className="text-gray-500 text-lg">No members in this category</p>
                  </div>
                ) : (grouped[cat]||[]).map(off=> (
                  <article key={off.id} className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1.125rem)] max-w-[280px]">
                    {/* Photo Container */}
                    <div className="relative h-36 sm:h-44 md:h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      <img
                        src={off.photo ? `${UPLOAD_BASE}${off.photo}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E'}
                        alt={off.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 text-center">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-purple-600 transition-colors truncate">{off.name}</h3>
                      <p className={`text-xs sm:text-sm font-semibold bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} bg-clip-text text-transparent mt-2`}>
                        {off.position || off.category}
                      </p>

                      {/* Contact Button */}
                      {off.contact && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                          <a
                            href={`tel:${off.contact.replace(/[^+0-9]/g,'')}`}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} text-white font-medium text-xs sm:text-sm hover:shadow-lg transition-shadow`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.738 1.707 3.027 3.445 3.445l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5S7.82 2 12.5 2h2a1 1 0 011 1v2.153z"></path>
                            </svg>
                            Call
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
      </div>
    </div>
  )
}
