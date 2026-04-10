import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";

/* ---------------- TYPES ---------------- */
interface SemesterActivity {
  id: number;
  title: string;
  datetime: string;
  venue: string;
  description: string;
  imageUrl?: string;
}

const SemesterAdmin: React.FC = () => {
  const { user } = useAuth();

  const [activities, setActivities] = useState<SemesterActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');

  /* 🔥 NEW STATE */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    venue: '',
    description: ''
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  /* ---------------- FETCH ---------------- */
  const fetchActivities = async () => {
    setListLoading(true);
    try {
      const res = await axiosInstance.get('/api/semester');
      setActivities(res.data);
    } catch (err: any) {
      setError('Failed to fetch activities');
    } finally {
      setListLoading(false);
    }
  };

  /* ---------------- IMAGE HANDLER ---------------- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("datetime", formData.datetime);
      data.append("venue", formData.venue);
      data.append("description", formData.description);

      if (imageFile) {
        data.append("image", imageFile); // 🔥 IMPORTANT
      }

      await axiosInstance.post('/api/semester', data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setFormData({ title: '', datetime: '', venue: '', description: '' });
      setImageFile(null);
      setPreview(null);

      fetchActivities();

    } catch (err: any) {
      setError('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return;

    try {
      await axiosInstance.delete(`/api/semester/${id}`);
      fetchActivities();
    } catch {
      setError('Failed to delete activity');
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8 text-center">
          Semester Activities Admin
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* ---------------- FORM ---------------- */}
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-12">
          <h2 className="text-2xl font-bold mb-6">Add Activity</h2>

          <form onSubmit={handleSubmit} className="grid gap-6">

            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="p-4 border rounded-xl"
              required
            />

            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) => setFormData({...formData, datetime: e.target.value})}
              className="p-4 border rounded-xl"
              required
            />

            <input
              type="text"
              placeholder="Venue"
              value={formData.venue}
              onChange={(e) => setFormData({...formData, venue: e.target.value})}
              className="p-4 border rounded-xl"
              required
            />

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="p-4 border rounded-xl"
              required
            />

            {/* 🔥 IMAGE INPUT */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="p-2"
            />

            {/* 🔥 PREVIEW */}
            {preview && (
              <img
                src={preview}
                className="h-40 object-cover rounded-xl"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Uploading..." : "Add Activity"}
            </button>

          </form>
        </div>

        {/* ---------------- LIST ---------------- */}
        <div className="bg-white rounded-2xl shadow-xl p-6">

          <h2 className="text-2xl font-bold mb-4">
            Activities ({activities.length})
          </h2>

          {listLoading && <p>Loading...</p>}

          <div className="grid md:grid-cols-2 gap-6">
            {activities.map(a => (
              <div key={a.id} className="border p-4 rounded-xl">

                {a.imageUrl && (
                  <img
                    src={a.imageUrl}
                    className="h-32 w-full object-cover rounded mb-3"
                  />
                )}

                <h3 className="font-bold">{a.title}</h3>
                <p>{new Date(a.datetime).toLocaleString()}</p>
                <p>{a.venue}</p>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SemesterAdmin;