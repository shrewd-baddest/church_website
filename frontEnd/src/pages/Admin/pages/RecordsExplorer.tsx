import { useState, useEffect } from 'react'
import apiService from '../../Landing/services/api'
import { Database, Search, Plus, Trash2 } from 'lucide-react'

export default function RecordsExplorer() {
  const [activeTab, setActiveTab] = useState('members')
  const [data, setData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya', 'users', 'mpesa_request']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
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
      setData(dataObj)
    } finally {
      setLoading(false)
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
            <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all'>
                <Plus size={18} />
                Add Entry
            </button>
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
    </div>
  )
}
