import { useState, useEffect } from 'react'
import { useCachedData } from '../../../hooks/useCachedData'
import apiService from '../../Landing/services/api'
import { Database, Search, Plus, Trash2, X, AlertCircle, Check } from 'lucide-react'
import { apiClient } from '../../../api/axiosInstance'

export default function RecordsExplorer() {
  const [activeTab, setActiveTab] = useState('members')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  // Static fallback — sourced directly from sub_groups table (run get_jumuiyas.js to refresh)
  const FALLBACK_JUMUIYAS: { id: string; name: string }[] = [
    { id: '727990e6-6bb2-44b6-9a9d-4acee5fe3d7e', name: 'St. Anthony' },
    { id: '7ff48c24-2213-4268-9cbe-20c450c45910', name: 'St. Augustine' },
    { id: '5e6570d6-0793-46f6-8400-815e1490b7bc', name: 'St. Catherine' },
    { id: 'eae305b2-700d-4680-ae02-753bf0221563', name: 'St. Dominic' },
    { id: 'eac314b5-5f0e-4d9b-a9ef-25e48a1ca0e0', name: 'St. Elizabeth' },
    { id: '193d6461-78de-465e-acf6-1683df45fce1', name: 'St. Maria Goretti' },
    { id: 'a7d71d66-094d-4ffb-aadd-e443c253d244', name: 'St. Monica' },
    { id: '5c643e86-0e29-4faf-a395-bd0e95eb7396', name: 'St. Thomas Aquinas' },
  ]
  const [jumuiyas, setJumuiyas] = useState<{ id: string; name: string }[]>(FALLBACK_JUMUIYAS)
  
  const [memberForm, setMemberForm] = useState({
    registration_number: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    email: '',
    phone: '',
    year_of_study: '1st',
    course: '',
    jumuiya_name: FALLBACK_JUMUIYAS[0].name,
    password: 'Password123!',
    role_names: ['Member']
  })
  
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya', 'users', 'mpesa_request']

  const { data = {}, loading, refetch: loadData } = useCachedData<Record<string, any[]>>(
    'csa_cache_records_explorer',
    async () => {
      const promises = tables.map(async (table) => {
        try {
          return await apiService.fetchTableData(table)
        } catch (err) {
          console.error(`Failed to load data for ${table}:`, err)
          return []
        }
      })

      const results = await Promise.all(promises)
      const dataObj: Record<string, any[]> = {}
      tables.forEach((table, index) => {
        dataObj[table] = results[index]
      })
      return dataObj
    },
    {}
  );

  useEffect(() => {
    const fetchJumuiyas = async () => {
      try {
        const res = await apiClient.get('/jumuiya-members/lookup')
        if (res.data && res.data.success) {
          const lookupMap = res.data.data
          const list = Object.entries(lookupMap).map(([id, val]: any) => ({
            id,
            name: val.name
          }))
          if (list.length > 0) {
            setJumuiyas(list)
            setMemberForm(prev => ({ ...prev, jumuiya_name: list[0].name }))
          }
          // else: keep the static fallback already set in state
        }
      } catch (err: any) {
        console.warn('Could not load jumuiya list from API (using static fallback):', err?.message || err)
        // State already has FALLBACK_JUMUIYAS — no action needed
      }
    }
    fetchJumuiyas()
  }, [])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    
    // Validate Registration Number
    const regPattern = /^[A-Z]{2,3}[0-9]{2,3}\/[A-Za-z]{1,2}\/[0-9]{4,5}\/[0-9]{2}$/
    const normalizedReg = memberForm.registration_number.toUpperCase().trim()
    if (!regPattern.test(normalizedReg)) {
      setFormError('Invalid registration number format. Must be like: PA106/G/20667/23')
      return
    }
    
    if (memberForm.phone.length < 10) {
      setFormError('Phone number must be at least 10 digits.')
      return
    }

    if (!memberForm.jumuiya_name) {
      setFormError('Please select a Jumuiya (sub-group).')
      return
    }

    if (!memberForm.password || memberForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...memberForm,
        registration_number: normalizedReg
      }
      
      const response = await apiClient.post('/authentication/register', payload)
      
      if (response.data && response.status === 201) {
        setFormSuccess('Member added successfully!')
        setMemberForm({
          registration_number: '',
          first_name: '',
          last_name: '',
          gender: 'male',
          email: '',
          phone: '',
          year_of_study: '1st',
          course: '',
          jumuiya_name: jumuiyas[0]?.name || FALLBACK_JUMUIYAS[0].name,
          password: 'Password123!',
          role_names: ['Member']
        })
        loadData()
        setTimeout(() => {
          setIsAddModalOpen(false)
          setFormSuccess('')
        }, 1500)
      }
    } catch (err: any) {
      console.error(err)
      setFormError(err.response?.data?.error || err.message || 'An error occurred during registration')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (table: string, id: string | number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await apiService.deleteRecord(table, id)
        loadData()
      } catch (err: any) {
        alert('Failed to delete: ' + err.message)
      }
    }
  }

  const renderTable = (tableName: string, records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Database size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No records found for {tableName}</p>
        </div>
      )
    }

    let columns = Object.keys(records[0])
    if (tableName === 'users') columns = columns.filter(col => col !== 'password')

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map(col => (
                  <th key={col} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 uppercase ">
              {records.map((record, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {col === 'image_url' && record[col] ? (
                        <img src={record[col]} alt="Preview" className="h-10 w-14 object-cover rounded shadow-sm" />
                      ) : (
                        String(record[col] ?? '')
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(tableName, record.id || record.member_id || record.user_id || record[Object.keys(record)[0]])}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Records Explorer</h2>
          <p className="text-xs text-slate-500 mt-1">Direct database access for system tables.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className='relative'>
                 <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
                 <input 
                    type="text" 
                    placeholder='Quick search...' 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64'
                 />
            </div>
            {activeTab === 'members' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all'
              >
                  <Plus size={18} />
                  Add Member
              </button>
            )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Table Selector Sidebar */}
        <aside className="xl:w-64 shrink-0 overflow-x-auto xl:overflow-visible">
            <div className='flex xl:flex-col gap-2 p-1 bg-slate-200/50 rounded-2xl xl:bg-transparent xl:p-0'>
                {tables.map(table => (
                    <button
                        key={table}
                        onClick={() => setActiveTab(table)}
                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap text-left flex items-center justify-between group ${
                            activeTab === table 
                            ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                            : 'text-slate-500 hover:bg-slate-200/70'
                        }`}
                    >
                        <span>{table.replace(/_/g, ' ').toUpperCase()}</span>
                        {activeTab === table && <div className='w-1.5 h-1.5 bg-blue-600 rounded-full' />}
                    </button>
                ))}
            </div>
        </aside>

        {/* Table Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Fetching table data...</p>
            </div>
          ) : (
            renderTable(activeTab, data[activeTab] || [])
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New System Member</h3>
                <p className="text-xs text-slate-500">Insert record directly into the database members table.</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false)
                  setFormError('')
                  setFormSuccess('')
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMember} className="flex-1 flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                {formError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm flex items-start gap-2">
                    <Check size={18} className="shrink-0 mt-0.5" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reg No */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PA106/G/20667/23"
                      value={memberForm.registration_number}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, registration_number: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                      required
                    />
                  </div>

                  {/* Course */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Course</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={memberForm.course}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, course: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      placeholder="First name"
                      value={memberForm.first_name}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={memberForm.last_name}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="07XXXXXXXX"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Gender</label>
                    <select
                      value={memberForm.gender}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Ladies</option>
                    </select>
                  </div>

                  {/* Year of Study */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Year of Study</label>
                    <select
                      value={memberForm.year_of_study}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, year_of_study: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      required
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>

                  {/* Jumuiya */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Jumuiya (Sub Group)</label>
                    <select
                      value={memberForm.jumuiya_name}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, jumuiya_name: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>— Select Jumuiya —</option>
                      {jumuiyas.map(j => (
                        <option key={j.id} value={j.name}>{j.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Login Password</label>
                    <input
                      type="password"
                      value={memberForm.password}
                      onChange={(e) => setMemberForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Roles Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Assign Roles</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Member', 'Chairperson', 'Secretary', 'Treasurer', 'Organizing_Secretary', 'Liturgist'].map(role => {
                      const checked = memberForm.role_names.includes(role);
                      return (
                        <label 
                          key={role} 
                          className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer text-xs font-medium transition-all ${
                            checked 
                            ? 'bg-blue-50/50 border-blue-200 text-blue-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setMemberForm(prev => {
                                const exists = prev.role_names.includes(role);
                                const updated = exists 
                                  ? prev.role_names.filter(r => r !== role)
                                  : [...prev.role_names, role];
                                return {
                                  ...prev,
                                  role_names: updated.length > 0 ? updated : ['Member']
                                };
                              });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span>{role.replace(/_/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setFormError('')
                    setFormSuccess('')
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

