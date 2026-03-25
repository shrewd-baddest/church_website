import { useState, useEffect } from 'react'
import apiService from '../services/api'

interface AdminPanelProps {
  onClose: () => void;
}

function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('members')
  const [data, setData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })

  // Gallery upload state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'gallery',
    event_date: new Date().toISOString().split('T')[0]
  })
  const [uploading, setUploading] = useState(false)

  const tables = ['members', 'events', 'contributions', 'officials', 'projects', 'activities', 'gallery', 'jumuiya', 'users']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch each table independently so one failure doesn't break the entire panel
      const promises = tables.map(async (table) => {
        try {
          return await apiService.fetchTableData(table)
        } catch (err) {
          console.error(`Failed to load data for ${table}:`, err)
          return [] // Return empty array on failure
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

  const getRecordId = (record: any): string | number => {
    // Prioritize common ID fields
    if (record.id) return record.id;
    if (record.user_id) return record.user_id;
    if (record.member_id) return record.member_id;

    // Fallback for other potential conventions, e.g., gallery_id
    const idKey = Object.keys(record).find(key => key.endsWith('_id'));
    if (idKey && record[idKey]) {
      return record[idKey];
    }

    // Last resort, but fragile.
    console.warn("Could not determine a specific ID column, falling back to the first column.");
    return record[Object.keys(record)[0]];
  }

  const handleDelete = async (table: string, id: string | number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await apiService.deleteRecord(table, id)
        loadData()
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        alert('Failed to delete: ' + errorMessage)
      }
    }
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      await apiService.addGalleryItem(uploadData)
      alert('Image added successfully!')
      setShowUploadModal(false)
      setUploadData({
        title: '',
        description: '',
        image_url: '',
        category: 'gallery',
        event_date: new Date().toISOString().split('T')[0]
      })
      loadData()
    } catch (error) {
      alert('Failed to upload: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const renderTable = (tableName: string, records: any[]) => {
    if (!records || records.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No records found.</p>
          <p className="text-sm text-gray-400">Database connection may be unavailable.</p>
        </div>
      )
    }

    let columns = Object.keys(records[0])

    if (tableName === 'users') {
      columns = columns.filter(col => col !== 'password')
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th key={col} className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
                  {col.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
              <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2 border-b text-sm text-gray-900">
                    {col === 'image_url' && record[col] ? (
                      <img src={record[col]} alt="Preview" className="h-16 w-20 object-cover rounded" />
                    ) : (
                      record[col]
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleDelete(tableName, getRecordId(record))}
                    className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3001/authentication/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })
      const result = await response.json()
      if (response.ok) {
        alert('User added successfully!')
        setNewUser({ username: '', password: '', role: 'user' })
        setShowAddUser(false)
        loadData()
      } else {
        alert('Failed to add user: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Error adding user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <>
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Role
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                  type="submit"
                >
                  Add User
                </button>
                <button
                  className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
                  type="button"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Image Modal for Gallery */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-8 rounded-lg shadow-xl w-[500px]">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Add Image to Gallery</h2>
            <form onSubmit={handleImageUpload}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="title"
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="description"
                  rows={3}
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image_url">
                  Image URL
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={uploadData.image_url}
                  onChange={(e) => setUploadData({ ...uploadData, image_url: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Paste the URL of your image (from upload to cloud storage)</p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                  Category
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="category"
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                >
                  <option value="gallery">Gallery</option>
                  <option value="activities">Activities</option>
                  <option value="events">Events</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event_date">
                  Date
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="event_date"
                  type="date"
                  value={uploadData.event_date}
                  onChange={(e) => setUploadData({ ...uploadData, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 disabled:opacity-50"
                  type="submit"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Add Image'}
                </button>
                <button
                  className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-6xl h-5/6 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 bg-gray-100 p-4 border-r">
              <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="w-full text-left px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                  >
                    Add New User
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('gallery')
                      setShowUploadModal(true)
                    }}
                    className="w-full text-left px-3 py-2 rounded bg-purple-500 text-white hover:bg-purple-600"
                  >
                    Upload Image/Video
                  </button>
                </li>
                {tables.map(table => (
                  <li key={table}>
                    <button
                      onClick={() => setActiveTab(table)}
                      className={`w-full text-left px-3 py-2 rounded ${activeTab === table
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                      {table.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {activeTab.replace(/_/g, ' ').toUpperCase()}
                  </h2>
                  <p className="text-gray-600">
                    Total records: {data[activeTab]?.length || 0}
                  </p>
                </div>
                {activeTab === 'gallery' && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                  >
                    Add Image
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading data...</p>
                </div>
              ) : (
                renderTable(activeTab, data[activeTab])
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminPanel
