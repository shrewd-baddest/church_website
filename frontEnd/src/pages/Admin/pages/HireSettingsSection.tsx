import React, { useEffect, useState } from 'react';
import { Phone, Save, Loader2, Smartphone, Headphones, Building2, RotateCcw } from 'lucide-react';
import { apiClient } from '../../../api/axiosInstance';
import { toast } from 'react-hot-toast';

export default function HireSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phones, setPhones] = useState({
    chairs_handler_phone: '',
    instruments_handler_phone: '',
    hire_admin_phone: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/settings');
      const data = response.data;
      setPhones({
        chairs_handler_phone: data.chairs_handler_phone || '',
        instruments_handler_phone: data.instruments_handler_phone || '',
        hire_admin_phone: data.hire_admin_phone || '',
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/settings', phones);
      localStorage.setItem('csa_chairs_handler_phone', phones.chairs_handler_phone);
      localStorage.setItem('csa_instruments_handler_phone', phones.instruments_handler_phone);
      localStorage.setItem('csa_hire_admin_phone', phones.hire_admin_phone);
      toast.success('Phone numbers saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'chairs_handler_phone', label: 'Chairs Handler Phone', desc: 'Receives WhatsApp messages for chair hire requests.', icon: Smartphone, placeholder: 'e.g. 254712345678' },
    { key: 'instruments_handler_phone', label: 'Instruments Handler Phone', desc: 'Receives WhatsApp messages for instrument hire requests.', icon: Headphones, placeholder: 'e.g. 254798765432' },
    { key: 'hire_admin_phone', label: 'Default Hire Admin Phone', desc: 'Fallback number if no category-specific handler is set.', icon: Building2, placeholder: 'e.g. 254112051739' },
  ] as const;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-8 py-7 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            Hire Request Admin Numbers
          </h2>
          <p className="text-blue-100 text-sm mt-2 ml-[52px]">
            Configure who receives WhatsApp messages when a hire request is submitted.
          </p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-3">
          {fields.map(({ key, label, desc, icon: Icon, placeholder }) => (
            <div key={key} className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">{label}</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <input
                type="text"
                value={(phones as any)[key]}
                onChange={(e) => setPhones((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all text-sm disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={16} /> Save Phone Numbers</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
