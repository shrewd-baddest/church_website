import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, createTableRecord, updateTableRecord, deleteTableRecord, uploadFile } from '../../../api/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import { normalizeRoles, getAllowedCommunityModules } from '../../../utils/adminAccess';
import { normalizeChannelUrl } from '../../../utils/channelUrl';
import { ArtDeco404 } from '../components/ArtDeco404';
import {
  ArrowLeft,
  Calendar,
  Megaphone,
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Info,
  Save,
  Image as ImageIcon,
  Upload,
  ShoppingBag,
  MessageSquare,
  FileText as FilePdf,
  Truck,
  Box,
  Eye,
  Check,
  X,
  Music,
  Shirt,
  PackageCheck,
  DollarSign,
  Copy,
  Printer,
  Sparkles,
  AlertCircle,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Contrast,
  Maximize2,
  Sliders,
  Menu,
  ChevronRight,
  GraduationCap,
  Globe,
  Lock,
  Share2
} from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import PageLoader from '../../../assets/Layouts/PageLoader';
import AssociatesTable from './AssociatesTable';

type TabType = 'about' | 'songs' | 'activities' | 'announcements' | 'schedules' | 'members' | 'approved-members' | 'music-class' | 'gallery' | 'tshirts' | 'suggestions' | 'channels';

interface GalleryItem {
  id: number;
  image_url: string;
  event_name: string;
  category?: string;
}

interface ProductItem {
  id: number;
  module_id?: string;
  name: string;
  price: number;
  sizes?: string[] | string;
  image_url?: string;
  description?: string;
  collection_date?: string;
  is_active?: boolean;
}

interface OrderItem {
  id: number;
  module_id?: string;
  product_id?: number;
  product_name?: string;
  member_id?: string;
  recipient_name: string;
  phone: string;
  size: string;
  quantity: number;
  total_amount: number;
  status: string;
  payment_ref?: string;
  mpesa_code?: string;
  rejection_reason?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  completed_at?: string;
  completed_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  created_at: string;
}

interface SuggestionItem {
  id: number;
  name?: string;
  email?: string;
  suggestion: string;
  category?: string;
  status: string;
  created_at?: string;
  member_jumuiya?: string;
}

export default function CommunityDetailEditor() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isCommunityNavOpen, setIsCommunityNavOpen] = useState(false);
  const [moduleMeta, setModuleMeta] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [choirVoiceFilter, setChoirVoiceFilter] = useState<'all' | 'soprano' | 'alto' | 'tenor' | 'bass'>('all');
  const [choirGenderFilter, setChoirGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutForm, setAboutForm] = useState({ biography: '', saint_image_url: '', history_pdf_url: '', uploadProgress: 0, uploading: false });
  const communityImageInputRef = useRef<HTMLInputElement>(null);
  const [imageDropActive, setImageDropActive] = useState(false);
  const [enrollmentStats, setEnrollmentStats] = useState<{ total: string; approved: string; pending: string; rejected: string } | null>(null);

  // Community-specific Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [galleryModal, setGalleryModal] = useState(false);
  const [newImageForm, setNewImageForm] = useState({ event_name: '', image_url: '', category: '' });
  const [galleryImageFile, setGalleryImageFile] = useState<File | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string>('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);

  // Community-specific Members state
  const [memberSubTab, setMemberSubTab] = useState<'members' | 'associates'>('members');
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [memberEditForm, setMemberEditForm] = useState<any>({});
  const [memberSaving, setMemberSaving] = useState(false);

  // Community-specific T-Shirts state
  const [tshirtTab, setTshirtTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, totalRevenue: 0 });
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState<{ id?: number; name: string; price: number | string; sizes: string; description: string; image_url: string; collection_date: string }>({
    name: '',
    price: 1200,
    sizes: 'S, M, L, XL, XXL',
    description: '',
    image_url: '',
    collection_date: ''
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>('');
  const [cancelOrderModal, setCancelOrderModal] = useState<OrderItem | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderItem | null>(null);
  const [orderRejectionReason, setOrderRejectionReason] = useState('');
  const [orderActionLoading, setOrderActionLoading] = useState<number | null>(null);

  // Community-specific Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  // Community-specific Channels state
  const [channels, setChannels] = useState<{ platform: string; url: string }[]>([]);
  const [channelForm, setChannelForm] = useState({ platform: 'whatsapp', url: '' });
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelEditing, setChannelEditing] = useState<string | null>(null);
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  // Choir music-class opt-ins (name + phone only)
  const [musicSignups, setMusicSignups] = useState<{ full_name: string; phone: string }[]>([]);

  // Choir Songs & Sheet Music state
  const [songsList, setSongsList] = useState<any[]>([]);
  const [songModal, setSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<any | null>(null);
  const [songForm, setSongForm] = useState({
    title: '',
    category: 'marian',
    composer: '',
    key_signature: '',
    time_signature: '4/4',
    tempo: 'Moderate',
    language: 'Swahili',
    solfa_notation: '',
    lyrics_text: '',
    raw_ocr_text: '',
    confidence_score: 0,
    audio_url: '',
    image_url: ''
  });
  const [songFile, setSongFile] = useState<File | null>(null);
  const [programmes, setProgrammes] = useState<Record<number, string[]>>({});
  const [pendingProgrammeToggles, setPendingProgrammeToggles] = useState<Set<string>>(new Set());
  const [songFilePreview, setSongFilePreview] = useState<string>('');
  const [continuationPages, setContinuationPages] = useState<{ file: File; preview: string }[]>([]);
  const [activeSheetPageIndex, setActiveSheetPageIndex] = useState<number>(0);
  const [sheetZoom, setSheetZoom] = useState<number>(1);
  const [invertSheetContrast, setInvertSheetContrast] = useState<boolean>(false);
  const [showSolfaEditor, setShowSolfaEditor] = useState<boolean>(false);
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [songCategoryFilter, setSongCategoryFilter] = useState('all');
  const [songLanguageFilter, setSongLanguageFilter] = useState('all');
  const [songSearch, setSongSearch] = useState('');
  const [songSaving, setSongSaving] = useState(false);
  const [viewingSongModal, setViewingSongModal] = useState<any | null>(null);
  const [detectedSongsList, setDetectedSongsList] = useState<any[]>([]);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'success' | 'warning'>('idle');
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string>('');
  const [duplicateModal, setDuplicateModal] = useState<{ existing: any; incomingForm: any; incomingFile: File | null } | null>(null);
  const [batchDuplicateReview, setBatchDuplicateReview] = useState<{
    conflicts: { incoming: any; existing: any }[];
    decisions: Record<string, 'keep' | 'overwrite'>;
    existingIds: Record<string, number>;
    songs: any[];
    savedTitles: string[];
  } | null>(null);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId, activeTab, songCategoryFilter, songLanguageFilter, songSearch]);

  // Sync moduleMeta into aboutForm whenever meta loads/changes
  useEffect(() => {
    if (moduleMeta) {
      setAboutForm({
        biography: moduleMeta.description || moduleMeta.story || moduleMeta.about || '',
        saint_image_url: moduleMeta.saint_image_url || moduleMeta.image_url || '',
        history_pdf_url: moduleMeta.history_pdf_url || moduleMeta.pdf_url || '',
      });
    }
  }, [moduleMeta]);

  const loadCategoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOurJumuiyasAdmin) {
        const settingsRes = await apiClient.get('/settings').catch(() => ({ data: {} }));
        const settings = settingsRes.data || {};
        const img = settings.community_jumuiya_image || settings.explore_jumuiya_image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800';
        setModuleMeta({
          id: 'our-jumuiyas',
          title: 'Our Jumuiyas',
          description: 'Small Christian Communities link card banner',
          theme_color: '#1d4ed8',
          icon_class: 'fas fa-users',
          saint_image_url: img,
        });
        setAboutForm({
          biography: 'Our Jumuiyas link card image displayed on the community hub page.',
          saint_image_url: img,
          history_pdf_url: '',
          uploadProgress: 0,
          uploading: false,
        });
        setLoading(false);
        return;
      }

      // 1. Fetch Module Meta if not already loaded or category changed
      if (!moduleMeta || moduleMeta.id !== categoryId) {
        const modulesResponse = await apiClient.get('/hub_modules');
        const modules = Array.isArray(modulesResponse.data) ? modulesResponse.data : (modulesResponse.data?.data || []);
        const meta = modules.find((m: any) => m.id === categoryId);
        setModuleMeta(meta);
      }

      // 2. Fetch specific tab data
      if (activeTab === 'about') {
        setLoading(false);
        return;
      }

      if (activeTab === 'songs') {
        try {
          const res = await apiClient.get('/choir-songs', {
            params: {
              module_id: categoryId || 'choir',
              category: songCategoryFilter !== 'all' ? songCategoryFilter : undefined,
              language: songLanguageFilter !== 'all' ? songLanguageFilter : undefined,
              search: songSearch?.trim() || undefined,
              limit: 200,
            },
          });
setSongsList(res.data?.data || []);

          // Fetch cloud-synced programmes (Sunday/Friday/Saturday/Special)
          const progRes = await apiClient.get('/choir-songs/programmes', {
            params: { module_id: categoryId || 'choir' },
          });
          const cloudProgrammes = progRes.data?.programmes || {};
          // Build map: song_id -> [progTypes the song belongs to]
          const programmeMap: Record<number, string[]> = {};
          Object.entries(cloudProgrammes).forEach(([type, songIds]) => {
            ;(songIds || []).forEach((song: any) => {
              if (song.id) {
                if (!programmeMap[song.id]) programmeMap[song.id] = [];
                if (!programmeMap[song.id].includes(type)) programmeMap[song.id].push(type);
              }
            });
          });
          setProgrammes(programmeMap);
        } catch (e) {
          console.error('Failed to load choir songs', e);
          setSongsList([]);
          setProgrammes({});
        }
        setLoading(false);
        return;
      }

      if (activeTab === 'gallery') {
        try {
          const res = await apiClient.get('/hub-gallery', { params: { module_id: categoryId } });
          setGalleryImages(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
          console.error('Failed to load gallery for community', e);
        }
        setLoading(false);
        return;
      }

      if (activeTab === 'tshirts') {
        try {
          const prodRes = await apiClient.get(`/community-tshirts/${categoryId}/products`);
          setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
          
          const params: Record<string, string> = {};
          if (orderStatusFilter && orderStatusFilter !== 'all') params.status = orderStatusFilter;
          if (orderSearch?.trim()) params.search = orderSearch.trim();

          const ordRes = await apiClient.get(`/community-tshirts/${categoryId}/admin/orders`, { params }).catch(() => {
            return apiClient.get(`/community-tshirts/${categoryId}/orders`);
          });

          if (ordRes.data?.data && Array.isArray(ordRes.data.data)) {
            setOrders(ordRes.data.data);
            if (ordRes.data.stats) setOrderStats(ordRes.data.stats);
          } else {
            const rawOrders = Array.isArray(ordRes.data) ? ordRes.data : [];
            setOrders(rawOrders);
            setOrderStats({
              total: rawOrders.length,
              pending: rawOrders.filter((o: any) => o.status === 'pending' || o.status === 'pending_confirmation').length,
              confirmed: rawOrders.filter((o: any) => o.status === 'confirmed').length,
              completed: rawOrders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length,
              cancelled: rawOrders.filter((o: any) => o.status === 'cancelled').length,
              totalRevenue: rawOrders.reduce((sum: number, o: any) => (['confirmed', 'completed', 'delivered'].includes(o.status) ? sum + (Number(o.total_amount) || 0) : sum), 0)
            });
          }
        } catch (e) {
          console.error('Failed to load tshirts for community', e);
        }
        setLoading(false);
        return;
      }

      if (activeTab === 'suggestions') {
        try {
          const res = await apiClient.get('/suggestions').catch(async () => {
            return await apiClient.get('/table/suggestions');
          });
          const allSuggestions = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const filtered = allSuggestions.filter((s: any) => 
            s.jumuiya_id === categoryId || 
            (s.category && s.category.toLowerCase().includes(categoryId?.toLowerCase() || ''))
          );
          setSuggestions(filtered);
        } catch (e) {
          console.error('Failed to load suggestions for community', e);
        }
        setLoading(false);
        return;
      }

      if (activeTab === 'channels') {
        try {
          const res = await apiClient.get(`/community-channels/${categoryId}/channels`);
          setChannels(res.data?.channels || []);
        } catch (e) {
          console.error('Failed to load channels for community', e);
          setChannels([]);
        }
        setLoading(false);
        return;
      }

      // Members use dedicated enrollment endpoint
      if (activeTab === 'members') {
        try {
          const res = await apiClient.get(`/community-enrollment/${categoryId}`, {
            params: { status: 'all' },
          });
          const all = res.data?.enrollments || [];
          setData(all.filter((m: any) => (m.status || '').toLowerCase() !== 'approved'));
          const rawStats = res.data?.stats || {};
          setEnrollmentStats({
            total: String(Number(rawStats.pending || 0) + Number(rawStats.rejected || 0)),
            approved: rawStats.approved || '0',
            pending: rawStats.pending || '0',
            rejected: rawStats.rejected || '0',
          });
        } catch {
          const response = await apiClient.get('/enrollments');
          const items = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          setData(items.filter((item: any) => ((item.module_id === categoryId) || (item.class_id === categoryId)) && (item.status || '').toLowerCase() !== 'approved'));
        }
        setLoading(false);
        return;
      }

      // Approved members only
      if (activeTab === 'approved-members') {
        try {
          const res = await apiClient.get(`/community-enrollment/${categoryId}`, {
            params: { status: 'Approved' },
          });
          setData(res.data?.enrollments || []);
        } catch {
          const response = await apiClient.get('/enrollments');
          const items = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          setData(items.filter((item: any) => ((item.module_id === categoryId) || (item.class_id === categoryId)) && item.status === 'Approved'));
        }
        setLoading(false);
        return;
      }

      // Choir music-class opt-ins (name + phone only)
      if (activeTab === 'music-class') {
        try {
          const res = await apiClient.get(`/community-enrollment/${categoryId}/music-class`);
          setMusicSignups(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (e) {
          console.error('Failed to load music class signups', e);
          setMusicSignups([]);
        }
        setLoading(false);
        return;
      }

      if (activeTab === 'schedules') {
        try {
          const res = await apiClient.get(`/practice-schedules/${categoryId}`);
          setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
          console.error('Failed to load practice schedules', e);
          setData([]);
        }
        setLoading(false);
        return;
      }

      let tableName = '';
      switch (activeTab) {
        case 'activities': tableName = 'hub_activities'; break;
        case 'announcements': tableName = 'hub_announcements'; break;
      }

      if (tableName) {
        const response = await apiClient.get(`/${tableName}`);
        const items = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const filtered = items.filter((item: any) =>
          (item.module_id === categoryId) || (item.class_id === categoryId)
        );
        setData(filtered);
      }
    } catch (err: any) {
      console.error(`[DetailEditor] Load error for ${activeTab}:`, err);
      setError(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormValues({});
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormValues({ ...item });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingItem(null); setFormValues({}); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      setFormValues(v => ({ ...v, _files: Array.from(files) }));
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'activities' || activeTab === 'announcements') {
        if (!formValues.title) return alert('Title required');
      }
      if (activeTab === 'members') {
        if (!formValues.full_name) return alert('Full name required');
      }

      if (formValues._files && formValues._files.length) {
        setUploading(true);
        const res = await uploadFile(formValues._files as File[]);
        const uploaded = res.data || [];
        if (uploaded[0]) {
          const uploadedUrl = uploaded[0].url || uploaded[0].secure_url || uploaded[0].path;
          const uploadedId = uploaded[0].public_id || uploaded[0].id;
          formValues.image_url = uploadedUrl;
          formValues.public_id = uploadedId;
        }
        setUploading(false);
      }

      if (activeTab === 'schedules') {
        if (!formValues.day || !formValues.start_time || !formValues.location) {
          return alert('Day, Start Time, and Location are required');
        }
        const payload = {
          module_id: categoryId,
          day: formValues.day || 'Saturday',
          start_time: formValues.start_time,
          end_time: formValues.end_time || formValues.start_time,
          location: formValues.location,
          sort_order: Number(formValues.sort_order || 0)
        };
        if (editingItem?.id) {
          await apiClient.put(`/practice-schedules/${editingItem.id}`, payload);
          showToast('Practice schedule updated');
        } else {
          await apiClient.post('/practice-schedules', payload);
          showToast('Practice schedule created');
        }
        closeModal();
        await loadCategoryData();
        return;
      }

      const tableName = activeTab === 'activities' ? 'hub_activities' : activeTab === 'announcements' ? 'hub_announcements' : 'enrollments';
      let payload: any = { module_id: categoryId };

      if (activeTab === 'activities') {
        payload = {
          module_id: categoryId,
          title: formValues.title,
          description: formValues.description,
          activity_date: formValues.activity_date || null,
          location: formValues.location || '',
          status: formValues.status || 'Upcoming'
        };
      } else if (activeTab === 'announcements') {
        payload = {
          module_id: categoryId,
          title: formValues.title,
          content: formValues.description || formValues.content,
          announcement_date: formValues.announcement_date || new Date().toISOString()
        };
      } else if (activeTab === 'members') {
        payload = {
          class_id: categoryId,
          module_id: categoryId,
          full_name: formValues.full_name || formValues.fullName,
          voice_type: ['charismatic', 'dancers', 'youth'].includes(categoryId || '') ? '' : (formValues.voice_type || ''),
          music_level: ['charismatic', 'dancers', 'youth'].includes(categoryId || '') ? '' : (formValues.music_level || 'Beginner'),
          phone: ['charismatic', 'dancers', 'youth'].includes(categoryId || '') ? (formValues.phone || formValues.phoneNumber || '') : '',
          email: formValues.email || '',
          status: formValues.status || 'Pending'
        };
      }

      if (editingItem?.id) {
        await updateTableRecord(tableName, editingItem.id, payload);
        showToast('Updated successfully');
      } else {
        await createTableRecord(tableName, payload);
        showToast('Created successfully');
      }

      try {
        localStorage.removeItem('csa_cache_hub_activities');
        localStorage.removeItem('csa_cache_hub_announcements');
        localStorage.removeItem('csa_cache_enrollments');
      } catch { }

      closeModal();
      await loadCategoryData();
    } catch (err: any) {
      console.error('Save failed', err);
      alert(err?.message || 'Save failed');
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    try {
      if (activeTab === 'schedules') {
        await apiClient.delete(`/practice-schedules/${id}`);
        showToast('Schedule deleted');
        await loadCategoryData();
        return;
      }
      const tableName = activeTab === 'activities' ? 'hub_activities' : activeTab === 'announcements' ? 'hub_announcements' : 'enrollments';
      await deleteTableRecord(tableName, id as any);
      showToast('Deleted');
      await loadCategoryData();
    } catch (err: any) {
      console.error('Delete failed', err);
      alert('Delete failed');
    }
  };

  const showToast = (msg: string) => {
    try { (window as any).toast && (window as any).toast(msg); } catch { }
  };

  const handleSaveAbout = async () => {
    if (!categoryId) return;
    if (aboutForm.uploading) {
      alert('Please wait a moment for the image to finish uploading before saving.');
      return;
    }
    if (aboutForm.saint_image_url && aboutForm.saint_image_url.startsWith('blob:')) {
      alert('The image is still being uploaded to the server. Please wait a few seconds and try again.');
      return;
    }
    setAboutSaving(true);
    try {
      if (isOurJumuiyasAdmin) {
        await apiClient.put('/settings', {
          community_jumuiya_image: aboutForm.saint_image_url,
          explore_jumuiya_image: aboutForm.saint_image_url,
        });
        showToast('Our Jumuiyas card image saved successfully!');
        try {
          localStorage.removeItem('community_modules_cache');
          localStorage.removeItem('csa_cache_hub_modules');
          sessionStorage.removeItem('cs_explore_settings');
        } catch { }
        setModuleMeta((prev: any) => ({ ...prev, saint_image_url: aboutForm.saint_image_url }));
        return;
      }

      const targetId = moduleMeta?.id || categoryId;
      await apiClient.patch(`/hub_modules/${targetId}`, {
        description: aboutForm.biography,
        story: aboutForm.biography,
        saint_image_url: aboutForm.saint_image_url,
        history_pdf_url: aboutForm.history_pdf_url,
      });
      showToast('About content saved successfully!');
      // Bust both caches so public pages and admin hub reflect the new image immediately
      try {
        localStorage.removeItem('community_modules_cache');
        localStorage.removeItem('csa_cache_hub_modules');
      } catch { }
      const modulesResponse = await apiClient.get('/hub_modules');
      const modules = Array.isArray(modulesResponse.data) ? modulesResponse.data : (modulesResponse.data?.data || []);
      const meta = modules.find((m: any) => m.id === categoryId) || (categoryId === 'mentorship' ? modules.find((m: any) => m.id === 'youth') : null);
      setModuleMeta(meta);
    } catch (err: any) {
      console.error('Save about failed', err);
      alert('Failed to save about content: ' + (err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Please try again.'));
    } finally {
      setAboutSaving(false);
    }
  };

  // ── Choir Songs & Sheet Music Handlers ──
  const [batchSaving, setBatchSaving] = useState(false);

  const applyDetectedSong = (song: any) => {
    // If the admin had made edits to the previous active song, save them into detectedSongsList
    if (songForm.title) {
      setDetectedSongsList((prev) =>
        prev.map((s) => (s.title === songForm.title ? { ...s, ...songForm } : s))
      );
    }

    setSongForm((prev) => ({
      ...prev,
      title: song.title || '',
      category: (song.category || prev.category || 'marian').toLowerCase(),
      composer: song.composer !== undefined ? song.composer : '',
      key_signature: song.key_signature !== undefined ? song.key_signature : '',
      time_signature: song.time_signature || '4/4',
      tempo: song.tempo || 'Moderate',
      language: song.language || 'Swahili',
      solfa_notation: song.solfa_notation !== undefined ? song.solfa_notation : '',
      lyrics_text: song.lyrics_text !== undefined ? song.lyrics_text : '',
      raw_ocr_text: song.raw_section || song.raw_ocr_text || prev.raw_ocr_text,
    }));
  };

  const handleBatchSaveAllSongs = async () => {
    if (detectedSongsList.length === 0) return;
    if (!songFile && !songForm.image_url) {
      return alert('Sheet music photo or song image is required to save songs.');
    }

    // Sync any edits currently in songForm into detectedSongsList
    const songsToSave = detectedSongsList.map((s, idx) => {
      if (s.title === songForm.title || (detectedSongsList.length === 1 && idx === 0)) {
        return { ...s, ...songForm };
      }
      return s;
    });

    setBatchSaving(true);
    try {
      const conflicts: { incoming: any; existing: any }[] = [];
      for (const song of songsToSave) {
        if (!song.title?.trim()) continue;
        try {
          const duplicateResponse = await apiClient.get('/choir-songs/check-duplicate', {
            params: { title: song.title.trim(), module_id: categoryId || 'choir' },
          });
          if (duplicateResponse.data?.isDuplicate && duplicateResponse.data?.duplicate) {
            conflicts.push({ incoming: song, existing: duplicateResponse.data.duplicate });
          }
        } catch (duplicateError) {
          console.warn(`Could not check duplicate for "${song.title}":`, duplicateError);
        }
      }

      if (conflicts.length > 0) {
        const conflictTitles = new Set(conflicts.map(({ incoming }) => incoming.title.trim().toLowerCase()));
        const uniqueSongs = songsToSave.filter((song) => !conflictTitles.has(song.title?.trim().toLowerCase()));
        if (uniqueSongs.length > 0) await saveBatchSongs(uniqueSongs, {}, [], false);
        setBatchDuplicateReview({
          conflicts,
          decisions: {},
          existingIds: Object.fromEntries(conflicts.map(({ incoming, existing }) => [incoming.title.trim().toLowerCase(), existing.id])),
          songs: songsToSave,
          savedTitles: uniqueSongs.map((song) => song.title.trim().toLowerCase()),
        });
        setBatchSaving(false);
        return;
      }

      await saveBatchSongs(songsToSave, {});
    } catch (err: any) {
      console.error('Batch save error:', err);
      alert(err?.response?.data?.error || 'Failed to save songs batch. Please try again.');
    } finally {
      setBatchSaving(false);
    }
  };

  const saveBatchSongs = async (songsToSave: any[], overwriteIds: Record<string, number>, skipTitles: string[] = [], finalize = true) => {
    setBatchSaving(true);
    try {
      const skipped = new Set(skipTitles);
      const newSongs = songsToSave.filter((song) => !overwriteIds[song.title?.trim().toLowerCase()] && !skipped.has(song.title?.trim().toLowerCase()));
      if (songFile) {
        const formData = new FormData();
        formData.append('sheet_image', songFile);
        continuationPages.forEach((page) => {
          formData.append('additional_sheets', page.file);
        });
        formData.append('module_id', categoryId || 'choir');
        formData.append('songs', JSON.stringify(newSongs));

        if (newSongs.length > 0) await apiClient.post('/choir-songs/batch-create', formData);
      } else if (newSongs.length > 0) {
        await apiClient.post('/choir-songs/batch-create', {
          module_id: categoryId || 'choir',
          image_url: songForm.image_url,
          songs: newSongs,
        });
      }

      for (const song of songsToSave.filter((item) => overwriteIds[item.title?.trim().toLowerCase()])) {
        const targetId = overwriteIds[song.title.trim().toLowerCase()];
        if (songFile) {
          const formData = new FormData();
          formData.append('sheet_image', songFile);
          continuationPages.forEach((page) => formData.append('additional_sheets', page.file));
          formData.append('module_id', categoryId || 'choir');
          formData.append('title', song.title.trim());
          formData.append('category', (song.category || 'marian').toLowerCase().trim());
          Object.entries(song).forEach(([key, value]) => {
            if (['title', 'category', 'image_url'].includes(key) || value === undefined || value === null || value === '') return;
            formData.append(key, String(value));
          });
          await apiClient.put(`/choir-songs/${targetId}`, formData);
        } else {
          await apiClient.put(`/choir-songs/${targetId}`, { module_id: categoryId || 'choir', ...song });
        }
      }

      if (finalize) {
        showToast(`🎉 Successfully saved all ${songsToSave.length} songs to the repertoire!`);
        setBatchDuplicateReview(null);
        setDuplicateModal(null);
        setSongModal(false);
        setEditingSong(null);
        setSongFile(null);
        setSongFilePreview('');
        setContinuationPages([]);
        setActiveSheetPageIndex(0);
        setDetectedSongsList([]);
        await loadCategoryData();
      }
    } catch (err: any) {
      console.error('Batch save error:', err);
      alert(err?.response?.data?.error || 'Failed to save songs batch. Please try again.');
    } finally {
      setBatchSaving(false);
    }
  };

  const finishBatchDuplicateReview = async (decision: 'keep' | 'overwrite') => {
    if (!batchDuplicateReview) return;
    const conflict = batchDuplicateReview.conflicts[0];
    const decisions = { ...batchDuplicateReview.decisions, [conflict.incoming.title.trim().toLowerCase()]: decision };
    const remaining = batchDuplicateReview.conflicts.slice(1);
    if (remaining.length > 0) {
      setBatchDuplicateReview({ ...batchDuplicateReview, conflicts: remaining, decisions });
      return;
    }
    const overwriteIds: Record<string, number> = {};
    Object.entries(decisions).forEach(([title, selected]) => {
      if (selected === 'overwrite') overwriteIds[title] = batchDuplicateReview.existingIds[title];
    });
    setBatchDuplicateReview(null);
    await saveBatchSongs(batchDuplicateReview.songs, overwriteIds, batchDuplicateReview.savedTitles);
  };

  const openAddSongModal = () => {
    setEditingSong(null);
    setSongFile(null);
    setSongFilePreview('');
    setContinuationPages([]);
    setActiveSheetPageIndex(0);
    setSheetZoom(1);
    setInvertSheetContrast(false);
    setShowSolfaEditor(false);
    setDetectedSongsList([]);
    setOcrStatus('idle');
    setOcrStatusMessage('');
    setSongForm({
      title: '',
      category: 'marian',
      composer: '',
      key_signature: '',
      time_signature: '4/4',
      tempo: 'Moderate',
      language: 'Swahili',
      solfa_notation: '',
      lyrics_text: '',
      raw_ocr_text: '',
      confidence_score: 0,
      audio_url: '',
      image_url: '',
    });
    setSongModal(true);
  };

  const openEditSongModal = (song: any) => {
    setEditingSong(song);
    setSongFile(null);
    setSongFilePreview(song.image_url || '');
    setContinuationPages([]);
    setActiveSheetPageIndex(0);
    setSheetZoom(1);
    setInvertSheetContrast(false);
    setShowSolfaEditor(Boolean(song.solfa_notation));
    setDetectedSongsList([]);
    setOcrStatus('idle');
    setOcrStatusMessage('');
    setSongForm({
      title: song.title || '',
      category: (song.category || 'marian').toLowerCase(),
      composer: song.composer || '',
      key_signature: song.key_signature || '',
      time_signature: song.time_signature || '4/4',
      tempo: song.tempo || 'Moderate',
      language: song.language || 'Swahili',
      solfa_notation: song.solfa_notation || '',
      lyrics_text: song.lyrics_text || '',
      raw_ocr_text: song.raw_ocr_text || '',
      confidence_score: Number(song.confidence_score || 0),
      audio_url: song.audio_url || '',
      image_url: song.image_url || '',
    });
    setSongModal(true);
  };

  const handleSongFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSongFile(file);
      const url = URL.createObjectURL(file);
      setSongFilePreview(url);
      setActiveSheetPageIndex(0);
      setOcrStatus('idle');
      setOcrStatusMessage('');
    }
  };

  const handleAddContinuationFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPages = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setContinuationPages((prev) => {
        const next = [...prev, ...newPages];
        setActiveSheetPageIndex(next.length); // switch to newly added page
        return next;
      });
      setOcrStatus('idle');
      setOcrStatusMessage('');
      showToast(`Added ${files.length} continuation page(s)! Click "Extract with Vision AI" to merge lyrics.`);
    }
  };

  const handleRemoveContinuationPage = (index: number) => {
    setContinuationPages((prev) => prev.filter((_, i) => i !== index));
    setActiveSheetPageIndex(0);
  };

  const handleOcrExtract = async () => {
    if (!songFile && continuationPages.length === 0) {
      return alert('Please choose or drag-and-drop at least one sheet music photo first before extracting.');
    }
    setOcrExtracting(true);
    setOcrStatus('scanning');
    const totalPages = (songFile ? 1 : 0) + continuationPages.length;
    setOcrStatusMessage(totalPages > 1 ? `Reading and merging ${totalPages} continuous sheet pages with Vision AI...` : 'Reading sheet and extracting multilingual text with Vision AI...');
    
    try {
      const formData = new FormData();
      if (songFile) {
        formData.append('images', songFile);
      }
      continuationPages.forEach((page) => {
        formData.append('images', page.file);
      });

      const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
      const savedKey = localStorage.getItem('csa_gemini_api_key');
      if (savedKey) {
        headers['x-gemini-api-key'] = savedKey;
      }

      const res = await apiClient.post('/choir-songs/ocr-extract', formData, { headers });

      const songs = res.data?.songs || [];
      const extractedLyrics = res.data?.extractedLyrics || res.data?.rawText || '';
      const confidence = Number(res.data?.confidence || 0);
      const detectedLang = res.data?.language || 'Swahili';
      const rawText = res.data?.rawText || '';
      const engineUsed = res.data?.engine || 'tesseract';
      const engineBadge = engineUsed.includes('gemini') ? '✨ Gemini Vision AI' : (engineUsed.includes('vision') ? '☁️ Cloud Vision' : '⚙️ Local OCR');

      setDetectedSongsList(songs);

      if (songs.length > 0) {
        const first = songs[0];
        applyDetectedSong(first);
        setSongForm((prev) => ({
          ...prev,
          confidence_score: confidence,
          raw_ocr_text: rawText,
        }));
        setOcrStatus('success');
        if (songs.length > 1) {
          setOcrStatusMessage(`Found ${songs.length} songs across ${totalPages} page(s) (${detectedLang}, ${confidence}% accuracy via ${engineBadge}). Auto-filled "${first.title}".`);
          showToast(`🎵 Found ${songs.length} songs! Auto-filled "${first.title}" via ${engineBadge}`);
        } else {
          setOcrStatusMessage(`Auto-filled: "${first.title}" [${detectedLang}] (${first.category}) ${totalPages > 1 ? `• ${totalPages} Pages Merged` : ''} • Accuracy: ${confidence}% via ${engineBadge}`);
          showToast(`✨ Auto-filled: "${first.title}" (${detectedLang}) via ${engineBadge}`);
        }
      } else if (extractedLyrics.trim()) {
        setSongForm((prev) => ({
          ...prev,
          lyrics_text: extractedLyrics.trim(),
          title: !prev.title && res.data?.guessedTitle ? res.data.guessedTitle : prev.title,
          language: detectedLang,
          raw_ocr_text: rawText,
          confidence_score: confidence,
        }));
        setOcrStatus('success');
        setOcrStatusMessage(`Lyrics extracted in ${detectedLang} (${confidence}% confidence via ${engineBadge})! Review in editor below.`);
        showToast(`✨ Lyrics extracted via ${engineBadge}!`);
      } else {
        setOcrStatus('warning');
        setOcrStatusMessage('Image text is faint or handwritten. The lyrics editor is open for you to type or paste manually.');
        showToast(res.data?.message || 'Text is faint or handwritten. You can type or paste the lyrics in the editor.');
      }
    } catch (err: any) {
      console.error('OCR Extraction error:', err);
      setOcrStatus('warning');
      setOcrStatusMessage(err?.response?.data?.error || 'OCR could not read handwriting clearly. You can type or paste lyrics manually.');
      showToast(err?.response?.data?.error || 'OCR could not read handwriting clearly. You can type or paste lyrics manually.');
    } finally {
      setOcrExtracting(false);
    }
  };

  const handleSaveSong = async (forceSave = false, overwriteExistingId: number | null = null) => {
    if (!songForm.title?.trim() || !songForm.category) {
      return alert('Song title and liturgical category are required.');
    }
    if (!songFile && !songForm.image_url) {
      return alert('Sheet music photo or song image is required.');
    }

    // Realtime Database Duplicate Detection if creating a new song and not explicitly forced/overwritten
    if (!editingSong && !forceSave && !overwriteExistingId) {
      try {
        const dupRes = await apiClient.get('/choir-songs/check-duplicate', {
          params: {
            title: songForm.title.trim(),
            module_id: categoryId || 'choir',
            exclude_id: editingSong?.id || undefined,
          },
        });
        if (dupRes.data?.isDuplicate && dupRes.data?.duplicate) {
          setDuplicateModal({
            existing: dupRes.data.duplicate,
            incomingForm: { ...songForm },
            incomingFile: songFile,
          });
          return;
        }
      } catch (dupErr) {
        console.warn('Realtime duplicate check notice:', dupErr);
      }
    }

    const targetId = overwriteExistingId || editingSong?.id;
    setSongSaving(true);
    try {
      if (songFile) {
        const formData = new FormData();
        formData.append('sheet_image', songFile);
        continuationPages.forEach((page) => {
          formData.append('additional_sheets', page.file);
        });
        formData.append('module_id', categoryId || 'choir');
        formData.append('title', songForm.title.trim());
        formData.append('category', songForm.category.toLowerCase().trim());
        if (songForm.composer) formData.append('composer', songForm.composer.trim());
        if (songForm.key_signature) formData.append('key_signature', songForm.key_signature.trim());
        if (songForm.time_signature) formData.append('time_signature', songForm.time_signature.trim());
        if (songForm.tempo) formData.append('tempo', songForm.tempo.trim());
        if (songForm.language) formData.append('language', songForm.language.trim());
        if (songForm.solfa_notation) formData.append('solfa_notation', songForm.solfa_notation.trim());
        if (songForm.lyrics_text) formData.append('lyrics_text', songForm.lyrics_text.trim());
        if (songForm.raw_ocr_text) formData.append('raw_ocr_text', songForm.raw_ocr_text.trim());
        if (songForm.confidence_score) formData.append('confidence_score', String(songForm.confidence_score));
        if (songForm.audio_url) formData.append('audio_url', songForm.audio_url.trim());

        if (targetId) {
          await apiClient.put(`/choir-songs/${targetId}`, formData);
          showToast(overwriteExistingId ? `"${duplicateModal?.existing?.title || songForm.title}" updated with new sheet & lyrics!` : 'Song sheet & lyrics updated successfully!');
        } else {
          await apiClient.post('/choir-songs', formData);
          showToast('Song sheet uploaded & added to repertoire!');
        }
      } else {
        const payload = {
          module_id: categoryId || 'choir',
          ...songForm,
        };
        if (targetId) {
          await apiClient.put(`/choir-songs/${targetId}`, payload);
          showToast(overwriteExistingId ? `"${duplicateModal?.existing?.title || songForm.title}" updated!` : 'Song updated successfully!');
        } else {
          await apiClient.post('/choir-songs', payload);
          showToast('Song added to repertoire!');
        }
      }

      setDuplicateModal(null);
      setSongModal(false);
      setEditingSong(null);
      setSongFile(null);
      setSongFilePreview('');
      setContinuationPages([]);
      setActiveSheetPageIndex(0);
      await loadCategoryData();
    } catch (err: any) {
      console.error('Save song error:', err);
      alert(err?.response?.data?.error || 'Failed to save song. Please try again.');
    } finally {
      setSongSaving(false);
    }
  };

  const handleDeleteSong = async (id: number) => {
    if (!confirm('Are you sure you want to delete this song from the repertoire? This will also remove the sheet photo.')) return;
    try {
      await apiClient.delete(`/choir-songs/${id}`);
      showToast('Song removed from repertoire');
      await loadCategoryData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete song');
    }
  };

  // Admin: toggle song into programme (Sunday/Friday/Tuesday/Saturday)
  const toggleProgramAdmin = async (progType: string, songId: number) => {
    const toggleKey = `${songId}:${progType}`;
    if (pendingProgrammeToggles.has(toggleKey)) return;

    const wasInProgramme = programmes[songId]?.includes(progType) || false;
    setPendingProgrammeToggles((pending) => new Set(pending).add(toggleKey));
    setProgrammes((current) => {
      const songProgrammes = current[songId] || [];
      const nextProgrammes = wasInProgramme
        ? songProgrammes.filter((program) => program !== progType)
        : [...songProgrammes, progType];
      return { ...current, [songId]: nextProgrammes };
    });

    try {
      const response = await apiClient.post('/choir-songs/programmes/toggle', {
        module_id: categoryId || 'choir',
        program_type: progType,
        song_id: songId,
      });
      showToast(response.data?.action === 'removed'
        ? `Song removed from ${progType} programme`
        : `Song added to ${progType} programme`);
    } catch (err: any) {
      setProgrammes((current) => {
        const songProgrammes = current[songId] || [];
        const restoredProgrammes = wasInProgramme
          ? [...new Set([...songProgrammes, progType])]
          : songProgrammes.filter((program) => program !== progType);
        return { ...current, [songId]: restoredProgrammes };
      });
      alert(err?.response?.data?.error || 'Failed to toggle programme');
    } finally {
      setPendingProgrammeToggles((pending) => {
        const next = new Set(pending);
        next.delete(toggleKey);
        return next;
      });
      loadCategoryData();
    }
  };

  // Gallery Handlers
  const handleAddGalleryImage = async () => {
    if (!newImageForm.event_name) {
      return alert('Event name is required');
    }
    if (!galleryImageFile && !newImageForm.image_url) {
      return alert('Please select an image file or enter an image URL');
    }
    try {
      let imageUrl = newImageForm.image_url;
      if (galleryImageFile) {
        setGalleryUploading(true);
        const { resizeImage } = await import('../../../utils/imageOptimization');
        const blob = await resizeImage(galleryImageFile, 1200, 1200);
        const fd = new FormData();
        fd.append('file', blob, 'gallery.jpg');
        const res = await apiClient.post('/hub-gallery/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = res.data?.image_url || res.data?.url || res.data?.path;
        setGalleryUploading(false);
      }
      await apiClient.post('/hub-gallery', {
        image_url: imageUrl,
        event_name: newImageForm.event_name,
        category: newImageForm.category || moduleMeta?.title || 'Community',
        module_id: categoryId,
      });
      showToast('Photo added to community gallery!');
      setGalleryModal(false);
      setNewImageForm({ event_name: '', image_url: '', category: '' });
      setGalleryImageFile(null);
      setGalleryImagePreview('');
      await loadCategoryData();
    } catch (err: any) {
      setGalleryUploading(false);
      alert('Failed to add gallery photo');
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    if (!confirm('Remove this photo from the community gallery?')) return;
    try {
      await apiClient.delete(`/hub-gallery/${id}`);
      showToast('Photo removed');
      await loadCategoryData();
    } catch (e) {
      alert('Failed to delete photo');
    }
  };

  // T-Shirt Product Handlers
  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return alert('Name and Price required');
    try {
      const sizesArray = typeof productForm.sizes === 'string'
        ? productForm.sizes.split(',').map(s => s.trim()).filter(Boolean)
        : productForm.sizes;

      if (productImageFile) {
        // File upload via multipart/form-data → Cloudinary
        const formData = new FormData();
        formData.append('tshirt_image', productImageFile);
        formData.append('name', productForm.name);
        formData.append('price', String(Number(productForm.price)));
        formData.append('sizes', JSON.stringify(sizesArray));
        formData.append('description', productForm.description);
        if (productForm.collection_date) formData.append('collection_date', productForm.collection_date);

        if (productForm.id) {
          await apiClient.put(`/community-tshirts/${categoryId}/products/${productForm.id}`, formData);
          showToast('Product updated successfully!');
        } else {
          await apiClient.post(`/community-tshirts/${categoryId}/products`, formData);
          showToast('Product created successfully!');
        }
      } else {
        // No new file — send JSON (keeps existing image_url)
        const payload = {
          name: productForm.name,
          price: Number(productForm.price),
          sizes: sizesArray,
          description: productForm.description,
          image_url: productForm.image_url,
          collection_date: productForm.collection_date || null
        };

        if (productForm.id) {
          await apiClient.put(`/community-tshirts/${categoryId}/products/${productForm.id}`, payload);
          showToast('Product updated successfully!');
        } else {
          await apiClient.post(`/community-tshirts/${categoryId}/products`, payload);
          showToast('Product created successfully!');
        }
      }

      setProductModal(false);
      setProductForm({ name: '', price: 1200, sizes: 'S, M, L, XL, XXL', description: '', image_url: '', collection_date: '' });
      setProductImageFile(null);
      setProductImagePreview('');
      await loadCategoryData();
    } catch (e) {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to remove this product from the catalog?')) return;
    try {
      await apiClient.delete(`/community-tshirts/${categoryId}/products/${id}`);
      showToast('Product removed');
      await loadCategoryData();
    } catch (e) {
      alert('Failed to delete product');
    }
  };

  const handleConfirmCommunityOrder = async (orderId: number) => {
    setOrderActionLoading(orderId);
    try {
      await apiClient.patch(`/community-tshirts/orders/${orderId}/confirm`);
      showToast(`Order #${orderId} confirmed!`);
      await loadCategoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm order');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleCompleteCommunityOrder = async (orderId: number) => {
    setOrderActionLoading(orderId);
    try {
      await apiClient.patch(`/community-tshirts/orders/${orderId}/complete`);
      showToast(`Order #${orderId} marked as delivered!`);
      await loadCategoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete order');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleCancelCommunityOrder = async () => {
    if (!cancelOrderModal) return;
    setOrderActionLoading(cancelOrderModal.id);
    try {
      await apiClient.patch(`/community-tshirts/orders/${cancelOrderModal.id}/cancel`, {
        reason: orderRejectionReason
      });
      showToast(`Order #${cancelOrderModal.id} cancelled`);
      setCancelOrderModal(null);
      setOrderRejectionReason('');
      await loadCategoryData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiClient.patch(`/community-tshirts/orders/${orderId}`, { status });
      showToast(`Order status updated to ${status}`);
      await loadCategoryData();
    } catch (e) {
      alert('Failed to update order status');
    }
  };

  const isStFrancisAdmin = categoryId === 'st-francis';
  const isDancersAdmin = categoryId === 'dancers';
  const isChoirAdmin = categoryId === 'choir';
  const isCharismaticAdmin = categoryId === 'charismatic';
  const isMentorshipAdmin = categoryId === 'youth' || categoryId === 'mentorship';
  const isOurJumuiyasAdmin = categoryId === 'our-jumuiyas' || categoryId === 'jumuiya';

  const tabs: { id: TabType; label: string; icon: any }[] = isOurJumuiyasAdmin
    ? [{ id: 'about', label: 'Jumuiyas Card Image', icon: ImageIcon }]
    : [
        { id: 'about', label: 'About Content', icon: Info },
        {
          id: 'activities',
          label: isStFrancisAdmin
            ? 'Feast Days & Outreaches'
            : isDancersAdmin
            ? 'Ministrations & Masses'
            : isCharismaticAdmin
            ? 'Prayer Vigils & Gatherings'
            : isMentorshipAdmin
            ? 'Workshops & Seminars'
            : 'Activities & Masses',
          icon: Calendar
        },
        {
          id: 'announcements',
          label: isStFrancisAdmin
            ? 'Welfare & Eco Notices'
            : isDancersAdmin
            ? 'Costume & Stage Notices'
            : isCharismaticAdmin
            ? 'Intercession Bulletins'
            : isMentorshipAdmin
            ? 'Cohort & Resource Bulletins'
            : 'Announcements & Costumes',
          icon: Megaphone
        },
        {
          id: 'schedules',
          label: isStFrancisAdmin
            ? 'Fellowship & SCC Schedule'
            : isDancersAdmin
            ? 'Rehearsal & Staging Schedule'
            : isCharismaticAdmin
            ? 'Prayer & Vigil Schedule'
            : isMentorshipAdmin
            ? 'Cohort & Coaching Sessions'
            : 'Practice & Rehearsals',
          icon: Clock
        },
        ...(isChoirAdmin ? [{ id: 'songs' as TabType, label: 'Songs Lyrics & Sheets', icon: Music }] : []),
        { id: 'members', label: isMentorshipAdmin ? 'Enrolled Mentees & Mentors' : 'Join Requests', icon: Users },
        { id: 'approved-members', label: 'Members', icon: Users },
        ...(isChoirAdmin ? [{ id: 'music-class' as TabType, label: 'Music Class', icon: Music }] : []),
        { id: 'gallery', label: 'Gallery & Media', icon: ImageIcon },
        {
          id: 'tshirts',
          label: isStFrancisAdmin ? 'Polo Shirts & Uniform Orders' : 'T-Shirts & Orders',
          icon: ShoppingBag
        },
        { id: 'suggestions', label: 'Suggestion Box', icon: MessageSquare },
        { id: 'channels', label: 'Social Channels', icon: MessageSquare },
      ];

  if (loading && !moduleMeta) {
    return <PageLoader message={`Connecting to ${categoryId} dashboard`} fullScreen />;
  }

  // ── Role-based module guard: group officials may only open their own community ──
  const allowedModules = getAllowedCommunityModules(normalizeRoles(user?.role));
  if (allowedModules !== null && !allowedModules.includes(categoryId || '')) {
    return <ArtDeco404 />;
  }

  // Community accent color (guaranteeing dark vibrant contrast, ignoring white/light overrides)
  const rawThemeColor = moduleMeta?.theme_color;
  const isInvalidWhite = !rawThemeColor || rawThemeColor === '#ffffff' || rawThemeColor === '#fff' || rawThemeColor.toLowerCase() === 'white' || rawThemeColor === '#f8fafc' || rawThemeColor === '#f1f5f9';
  
  const accentColor = isOurJumuiyasAdmin
    ? '#1d4ed8'
    : (!isInvalidWhite
    ? rawThemeColor
    : (isChoirAdmin ? '#1e40af' : isDancersAdmin ? '#db2777' : isCharismaticAdmin ? '#7c3aed' : isStFrancisAdmin ? '#047857' : isMentorshipAdmin ? '#8e44ad' : '#2563eb'));

  const accentGradient = isOurJumuiyasAdmin
    ? 'from-[#1d4ed8] via-[#2563eb] to-[#1e40af]'
    : isChoirAdmin
    ? 'from-[#1e40af] via-[#1d4ed8] to-[#1e3a8a]'
    : isDancersAdmin
    ? 'from-[#db2777] via-[#be185d] to-[#9d174d]'
    : isCharismaticAdmin
    ? 'from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]'
    : isStFrancisAdmin
    ? 'from-[#047857] via-[#065f46] to-[#064e3b]'
    : isMentorshipAdmin
    ? 'from-[#8e44ad] via-[#7d3c98] to-[#6c3483]'
    : 'from-[#2563eb] via-[#1d4ed8] to-[#1e40af]';

  const adminDesc = isOurJumuiyasAdmin
    ? 'Small Christian Communities link card banner & image update'
    : isStFrancisAdmin
    ? 'Charity outreach • Eco stewardship • SCC fellowship • Member welfare'
    : isDancersAdmin
    ? 'Ministrations • Costume notices • Choreography schedules • Gallery'
    : isCharismaticAdmin
    ? 'Vigils & gatherings • Intercession bulletins • Prayer schedules • Members'
    : isMentorshipAdmin
    ? 'Cohort sessions • Workshops • Mentor pairings • Resource toolkits'
    : isChoirAdmin
    ? 'Rehearsals • SATB section management • Anthem schedules • Gallery'
    : `Resources • Gallery • Attire orders • Member roster`;

  return (
    <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ══════════════════════════════════════════════════════
          HERO HEADER BANNER
      ══════════════════════════════════════════════════════ */}
      <div className={`relative bg-gradient-to-br ${accentGradient} overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-5 bg-white" />
        <div className="absolute top-4 right-32 w-20 h-20 rounded-full opacity-10 bg-white" />

        <div className="relative px-4 sm:px-6 py-4 sm:py-6">
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/admin/community-management')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold text-xs sm:text-sm mb-3 sm:mb-5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
              <ArrowLeft size={14} />
            </div>
            <span className="hidden sm:inline">Back to Community Hub</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-5">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Community Avatar */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/25 flex items-center justify-center text-white shadow-xl shrink-0">
                {moduleMeta?.icon_class
                  ? <i className={`${moduleMeta.icon_class} text-lg sm:text-2xl`}></i>
                  : <Users size={20} />}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50 bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-md">Admin Panel</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-md">Active</span>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                  {moduleMeta?.title || categoryId}
                </h1>
                <p className="text-white/55 text-[11px] sm:text-xs mt-1 font-medium hidden sm:block">{adminDesc}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <a
                href={isOurJumuiyasAdmin ? '/jumuiya' : `/community/${categoryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-xs sm:text-sm font-bold text-white transition-all"
              >
                <Eye size={14} /> <span className="hidden sm:inline">Preview Live Page</span><span className="sm:hidden">Preview</span>
              </a>
              {!isOurJumuiyasAdmin && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white text-slate-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-white/90 transition-all shadow-lg"
                  style={{ color: accentColor }}
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Add New Record</span><span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          {!isOurJumuiyasAdmin && (
            <div className="mt-3 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
              {[
                { label: 'Records', value: data.length, show: activeTab !== 'about' && activeTab !== 'songs' && activeTab !== 'gallery' && activeTab !== 'tshirts' && activeTab !== 'suggestions' && activeTab !== 'approved-members' },
                { label: 'Members', value: data.length, show: activeTab === 'approved-members' },
                { label: 'Songs', value: songsList.length, show: activeTab === 'songs' },
                { label: 'Gallery Photos', value: galleryImages.length, show: activeTab === 'gallery' },
                { label: 'Products', value: products.length, show: activeTab === 'tshirts' },
                { label: 'Suggestions', value: suggestions.length, show: activeTab === 'suggestions' },
              ].filter(s => s.show).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/15">
                  <span className="text-white font-black text-sm sm:text-base leading-none">{s.value}</span>
                  <span className="text-white/60 text-[10px] sm:text-[11px] font-semibold">{s.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/15">
                <span className="text-white font-black text-sm sm:text-base leading-none">
                  {tabs.findIndex(t => t.id === activeTab) + 1}/{tabs.length}
                </span>
                <span className="text-white/60 text-[10px] sm:text-[11px] font-semibold">Tab</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom fade border */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}88, ${accentColor}22, ${accentColor}88)` }} />
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT: RESPONSIVE TABS + CONTENT PANEL (LIGHT THEME)
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-0 min-h-[500px] lg:min-h-[600px] bg-white border border-slate-200/90 rounded-b-3xl overflow-hidden shadow-xl">

        {/* Mobile community navigation trigger and drawer */}
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setIsCommunityNavOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black shadow-sm cursor-pointer"
          >
            <Menu size={16} style={{ color: accentColor }} />
            <span>Community menu</span>
          </button>
          <span className="text-[11px] font-bold text-slate-500 truncate">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {isCommunityNavOpen && (
          <>
            <button
              type="button"
              aria-label="Close community menu"
              onClick={() => setIsCommunityNavOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm cursor-pointer"
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Community menu</p>
                  <p className="text-sm text-slate-800 font-black mt-0.5">{moduleMeta?.title || categoryId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCommunityNavOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                  title="Close community menu"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setActiveTab(tab.id); setIsCommunityNavOpen(false); }}
                      className={`w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-3 py-3 mb-1 rounded-xl text-left text-xs font-black transition-colors cursor-pointer ${
                        isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                      style={isActive ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : undefined}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
                        <tab.icon size={14} />
                      </span>
                      <span className="leading-tight">{tab.label}</span>
                      {tab.id === 'members' && Number(enrollmentStats?.pending || 0) > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center">
                          {enrollmentStats.pending}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* ── Desktop Sidebar Tab Navigation ── */}
        <div className="hidden lg:flex w-56 shrink-0 bg-slate-50 border-r border-slate-200 flex-col py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2.5 px-4 py-3 mx-2 my-0.5 rounded-xl text-left text-xs font-black transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white shadow-md ring-1 ring-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                style={isActive ? {
                  background: isChoirAdmin
                    ? 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)'
                    : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
                  boxShadow: `0 4px 14px ${accentColor}44`
                } : {}}
              >
                {isActive && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-300/80'
                }`}>
                  <tab.icon size={13} className="text-current" />
                </div>
                <span className="leading-tight tracking-wide">{tab.label}</span>
                {tab.id === 'members' && Number(enrollmentStats?.pending || 0) > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                    {enrollmentStats.pending}
                  </span>
                )}
              </button>
            );
          })}

          {/* Sidebar footer */}
          <div className="mt-auto px-4 py-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Admin Panel</p>
            <p className="text-[10px] text-slate-600 font-bold mt-0.5">{moduleMeta?.title || categoryId}</p>
          </div>
        </div>

        {/* ── Tab Content Area ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-white">

          {/* ── Content Inner Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-xs"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {(() => { const tab = tabs.find(t => t.id === activeTab); return tab ? <tab.icon size={14} /> : null; })()}
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold">{moduleMeta?.title || categoryId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(activeTab === 'activities' || activeTab === 'announcements' || activeTab === 'members' || activeTab === 'approved-members') && (
                <div className="relative flex-1 sm:flex-none">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50 w-full sm:w-48"
                  />
                </div>
              )}
              {activeTab === 'songs' ? (
                <button
                  onClick={openAddSongModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> Upload Song Sheet
                </button>
              ) : activeTab === 'activities' || activeTab === 'announcements' ? (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer shrink-0"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Add {activeTab === 'activities' ? 'Activity' : 'Announcement'}</span><span className="sm:hidden">Add</span>
                </button>
              ) : activeTab === 'members' ? (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer shrink-0"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Add Member</span><span className="sm:hidden">Add</span>
                </button>
              ) : activeTab === 'schedules' ? (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer shrink-0"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Add Session</span><span className="sm:hidden">Add</span>
                </button>
              ) : activeTab === 'gallery' ? (
                <button
                  onClick={() => setGalleryModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> Add Photo
                </button>
              ) : activeTab === 'tshirts' ? (
                <button
                  onClick={() => setProductModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                  style={{ background: accentColor }}
                >
                  <Plus size={14} /> Manage Product
                </button>
              ) : null}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-slate-800 pb-20 lg:pb-6">


          {/* ABOUT TAB / JUMUIYAS CARD IMAGE TAB */}
          {activeTab === 'about' && (
            <div className="space-y-5 max-w-2xl">
              <div
                className="rounded-2xl px-5 py-4 flex items-center gap-3 border"
                style={{ background: `${accentColor}10`, borderColor: `${accentColor}30` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}20`, color: accentColor }}>
                  {isOurJumuiyasAdmin ? <ImageIcon size={16} /> : <FilePdf size={16} />}
                </div>
                <p className="text-xs font-bold leading-relaxed" style={{ color: accentColor }}>
                  {isOurJumuiyasAdmin
                    ? "Manage the background image displayed on the 'Our Jumuiyas' card in the public community hub."
                    : "Manage the biography, image, and PDF history document displayed on the public About tab."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 space-y-6 shadow-sm">
                {!isOurJumuiyasAdmin && (
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">Biography / Description</label>
                    <textarea
                      rows={8}
                      className="w-full border border-slate-200 bg-white px-4 py-3 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-y shadow-xs"
                      style={{ '--tw-ring-color': `${accentColor}55` } as React.CSSProperties}
                      placeholder="Enter a biography or description for this community..."
                      value={aboutForm.biography}
                      onChange={(e) => setAboutForm(v => ({ ...v, biography: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                    {isOurJumuiyasAdmin ? 'Our Jumuiyas Card Image' : 'Saint / Community Image'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {/* URL input section */}
                    <div className="flex-1">
                      <input
                        type="url"
                        className="w-full border border-slate-200 bg-white px-3 py-2 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs"
                        style={{ '--tw-ring-color': `${accentColor}55` } as React.CSSProperties}
                        placeholder="https://... (direct image link)"
                        value={aboutForm.saint_image_url}
                        onChange={(e) => setAboutForm(v => ({ ...v, saint_image_url: e.target.value }))}
                      />
                    </div>
                    {/* Compact upload button */}
                    <div className="shrink-0">
                      {/* Hidden file input - always triggered via ref */}
                      <input
                        ref={communityImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Show instant local preview immediately
                          const localUrl = URL.createObjectURL(file);
                          setAboutForm(v => ({ ...v, saint_image_url: localUrl, uploading: true }));
                          // Upload in the background
                          uploadFile(file, { compress: false }).then(res => {
                            const url = res?.data?.data?.url || res?.data?.url || res?.data?.data?.[0]?.url || res?.data?.[0]?.url || '';
                            if (url) {
                              setAboutForm(v => ({ ...v, saint_image_url: url, uploading: false }));
                              showToast(isOurJumuiyasAdmin ? 'Image uploaded! Click "Save Jumuiyas Card Image" to save.' : 'Image uploaded! Click "Save About Content" to save.');
                            } else {
                              setAboutForm(v => ({ ...v, uploading: false }));
                            }
                          }).catch((err) => {
                            // Keep the local preview so user can still see it; upload can be retried
                            setAboutForm(v => ({ ...v, uploading: false }));
                            console.error('Image upload failed:', err);
                            alert('Image upload failed. Please try again.');
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => communityImageInputRef.current?.click()}
                        disabled={aboutForm.uploading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all text-xs font-semibold shadow-xs disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                      >
                        {aboutForm.uploading
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Upload size={13} />}
                        {aboutForm.uploading ? 'Saving…' : 'Upload'}
                      </button>
                    </div>
                  </div>
                  {aboutForm.saint_image_url && (
                    <div className="mt-3 relative">
                      <img
                        src={aboutForm.saint_image_url}
                        alt="Preview"
                        className="w-full max-h-56 object-cover rounded-xl border border-slate-200"
                      />
                      {aboutForm.uploading && (
                        <div className="absolute inset-0 rounded-xl bg-white/50 flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-slate-600" />
                          <span className="text-xs font-semibold text-slate-600">Saving to cloud…</span>
                        </div>
                      )}
                      {aboutForm.saint_image_url && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setAboutForm(v => ({ ...v, saint_image_url: '' }))}
                            className="flex-1 text-xs text-red-600 hover:underline cursor-pointer text-left"
                          >
                            Remove
                          </button>
                          <a
                            href={aboutForm.saint_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Open full size
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isOurJumuiyasAdmin && (
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase tracking-wide">History PDF URL</label>
                    <input
                      type="url"
                      className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs"
                      style={{ '--tw-ring-color': `${accentColor}55` } as React.CSSProperties}
                      placeholder="https://... (link to PDF document)"
                      value={aboutForm.history_pdf_url}
                      onChange={(e) => setAboutForm(v => ({ ...v, history_pdf_url: e.target.value }))}
                    />
                    {aboutForm.history_pdf_url && (
                      <a href={aboutForm.history_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm text-red-600 font-bold hover:underline">
                        <FilePdf size={16} /> Preview PDF
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSaveAbout}
                  disabled={aboutSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-60 cursor-pointer"
                  style={{ background: accentColor }}
                >
                  {aboutSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {aboutSaving ? 'Saving...' : isOurJumuiyasAdmin ? 'Save Jumuiyas Card Image' : 'Save About Content'}
                </button>
              </div>
            </div>
          )}

          {/* SONGS & SHEET MUSIC TAB (CHOIR ADMIN) */}
          {activeTab === 'songs' && (
            <div className="space-y-6">
              {/* Header Info & Filter Controls */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Music size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Songs Lyrics & Sheets</h3>
                      <p className="text-xs text-slate-500 font-medium">Multilingual Sheet OCR (Swahili, English, Luo, Kamba, Kikuyu, Latin) & Mass Repertoire.</p>
</div>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="grid grid-cols-2 sm:grid-cols-[minmax(16rem,26rem)_11rem_9rem] items-center gap-2 pt-2 border-t border-slate-200/80">
                  <div className="relative min-w-0 col-span-2 sm:col-span-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search songs, composers, or lyrics..."
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                    {songSearch && (
                      <button
                        onClick={() => setSongSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <select
                    value={songCategoryFilter}
                    onChange={(e) => setSongCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
                  >
                    <option value="all">All Categories</option>
                    <option value="marian">Marian (Bikira Maria)</option>
                    <option value="mwanzo">Entrance (Mwanzo)</option>
                    <option value="utukufu">Kyrie / Gloria (Utukufu)</option>
                    <option value="sadaka">Offertory (Sadaka)</option>
                    <option value="komunyo">Communion (Komunyo)</option>
                    <option value="shukrani">Thanksgiving (Shukrani)</option>
                    <option value="kutoka">Recessional (Kutoka)</option>
                    <option value="kwaresma">Lent (Kwaresma)</option>
                    <option value="pasaka">Easter (Pasaka)</option>
                    <option value="noeli">Christmas (Noeli)</option>
                    <option value="pentecost">Pentecost (Roho Mtakatifu)</option>
                    <option value="patron">St. Thomas Aquinas (Patron)</option>
                    <option value="general">General / Other</option>
                  </select>

                  <select
                    value={songLanguageFilter}
                    onChange={(e) => setSongLanguageFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs"
                  >
                    <option value="all">All Languages</option>
                    <option value="Swahili">Swahili</option>
                    <option value="English">English</option>
                    <option value="Luo">Luo (Dholuo)</option>
                    <option value="Kikuyu">Kikuyu (Gikuyu)</option>
                    <option value="Kamba">Kamba (Kikamba)</option>
                    <option value="Latin">Latin</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Songs Table */}
              {songsList.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Music size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {songSearch || songCategoryFilter !== 'all' || songLanguageFilter !== 'all' ? 'No matching songs found' : 'No song sheets uploaded yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    {songSearch || songCategoryFilter !== 'all' || songLanguageFilter !== 'all'
                      ? 'Try clearing or changing your search filters.'
                      : 'Upload photos of sheet music or song lyrics. The built-in Smart OCR will extract the text automatically.'}
                  </p>
                  <button
                    onClick={openAddSongModal}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} /> Upload Song Sheet
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3.5 px-4">Sheet Preview</th>
                        <th className="py-3.5 px-4">Song Title & Details</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Language</th>
                        <th className="py-3.5 px-4">Programme</th>
                        <th className="py-3.5 px-4">Composer</th>
                        <th className="py-3.5 px-4">Lyrics / Solfa</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {songsList.map((song) => (
                        <tr key={song.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div
                              onClick={() => setViewingSongModal(song)}
                              className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:scale-105 transition-transform"
                              title="Click to view sheet"
                            >
                              <img src={song.image_url} alt={song.title} className="w-full h-full object-cover object-top" />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{song.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {song.key_signature && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                                  Key: {song.key_signature}
                                </span>
                              )}
                              {song.tempo && song.tempo !== 'Moderate' && (
                                <span className="text-[10px] font-medium text-slate-500">
                                  • {song.tempo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                              {song.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {song.language || 'Swahili'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="grid grid-cols-4 gap-1.5 min-w-[220px]">
                              {(['tuesday', 'friday', 'saturday', 'sunday'] as const).map((progType) => {
                                const isIn = programmes[song.id]?.includes(progType) || false;
                                const isPending = pendingProgrammeToggles.has(`${song.id}:${progType}`);
                                const label = progType.slice(0, 3).toUpperCase();
                                return (
                                  <button
                                    key={progType}
                                    type="button"
                                    aria-label={`${isIn ? 'Remove' : 'Add'} ${song.title} ${label} programme`}
                                    title={`${isIn ? 'Remove from' : 'Add to'} ${label} programme`}
                                    disabled={isPending}
                                    className={`flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-lg border text-[9px] font-black tracking-wide transition-all cursor-pointer disabled:cursor-wait ${
                                      isIn
                                        ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-600'
                                    }`}
                                    onClick={() => toggleProgramAdmin(progType, song.id)}
                                  >
                                    <FaStar size={12} className={`${isIn ? 'fill-current text-amber-500' : 'text-slate-300'} ${isPending ? 'animate-pulse' : ''}`} />
                                    <span>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {song.composer || <span className="text-slate-400 italic">Traditional</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              {song.lyrics_text ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                  <Check size={12} /> Lyrics
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400">Sheet image only</span>
                              )}
                              {song.solfa_notation && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-purple-700">
                                  + Tonic Sol-fa
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => setViewingSongModal(song)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View Sheet & Lyrics"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => openEditSongModal(song)}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Song / Re-extract"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSong(song.id)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Song"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div>
              {galleryImages.length === 0 ? (
                <div className="text-center py-16">
                  <ImageIcon size={40} className="mx-auto text-slate-600 mb-3" />
                  <p className="font-bold text-slate-300">No community gallery photos yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload pictures to showcase your events and activities.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map(img => (
                    <div key={img.id} className="relative rounded-2xl overflow-hidden border border-slate-800 group bg-slate-800/80">
                      <img src={img.image_url} alt={img.event_name} className="w-full h-44 object-cover" />
                      <div className="p-3">
                        <p className="text-xs font-bold text-white truncate">{img.event_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{img.category || 'General'}</p>
                      </div>
                        <button
                          onClick={() => handleDeleteGalleryImage(img.id)}
                          className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl sm:opacity-0 sm:group-hover:opacity-100 transition shadow-md"
                          title="Delete photo"
                        >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* T-SHIRTS & ORDERS TAB */}
          {activeTab === 'tshirts' && (
            <div className="space-y-6">
              {/* Sub-nav Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setTshirtTab('products')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                      tshirtTab === 'products'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Shirt size={14} /> Merchandise Catalog ({products.length})
                  </button>
                  <button
                    onClick={() => setTshirtTab('orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                      tshirtTab === 'orders'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingBag size={14} /> Member Orders ({orders.length})
                  </button>
                </div>

                {tshirtTab === 'products' && (
                  <button
                    onClick={() => {
                      setProductForm({
                        name: '',
                        price: 1200,
                        sizes: 'S, M, L, XL, XXL',
                        description: '',
                        image_url: '',
                        collection_date: ''
                      });
                      setProductModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer"
                    style={{ background: accentColor }}
                  >
                    <Plus size={14} /> Add Product
                  </button>
                )}
              </div>

              {tshirtTab === 'products' ? (
                /* ── Product Catalog ── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                      <div>
                        {prod.image_url ? (
                          <div className="relative rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50">
                            <img src={prod.image_url} alt={prod.name} className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-300" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-700 shadow-xs">
                              Sample
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-indigo-50/60 to-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 mb-4 border border-slate-100">
                            <Shirt size={36} className="text-slate-300 mb-2" />
                            <span className="text-[11px] font-bold text-slate-400">No Image Preview Set</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-slate-900 text-base">{prod.name}</h4>
                          <span className="text-sm font-black text-indigo-700 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 whitespace-nowrap">
                            KES {prod.price.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {prod.description || 'Official community uniform / ministry attire.'}
                        </p>

                        {/* Sizes */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Sizes:</span>
                          {(Array.isArray(prod.sizes) ? prod.sizes : (prod.sizes || 'S, M, L, XL, XXL').split(',')).map((s: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase border border-slate-200/60">
                              {s.trim()}
                            </span>
                          ))}
                        </div>

                        {/* Collection Date */}
                        {prod.collection_date && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-bold">
                            <Calendar size={13} className="text-amber-600 shrink-0" />
                            <span>Collection: {new Date(prod.collection_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setProductForm({
                              id: prod.id,
                              name: prod.name,
                              price: prod.price,
                              sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : (prod.sizes || 'S, M, L, XL, XXL'),
                              description: prod.description || '',
                              image_url: prod.image_url || '',
                              collection_date: prod.collection_date ? prod.collection_date.split('T')[0] : ''
                            });
                            setProductModal(true);
                          }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 size={13} /> Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-slate-50/70 rounded-3xl border border-slate-200">
                      <Shirt size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-700 font-bold text-sm">No merchandise products configured yet.</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">Add your community's official T-shirt or polo so members can order it from their dashboard.</p>
                      <button
                        onClick={() => {
                          setProductForm({
                            name: `${moduleMeta?.title || 'Community'} Official T-Shirt`,
                            price: 1200,
                            sizes: 'S, M, L, XL, XXL',
                            description: '',
                            image_url: '',
                            collection_date: ''
                          });
                          setProductModal(true);
                        }}
                        className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition shadow-md cursor-pointer"
                      >
                        Add First Product
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Orders Board ── */
                <div className="space-y-4">
                  {/* Order KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-400">Total Orders</span>
                      <p className="text-xl font-black text-slate-900 mt-1">{orderStats.total}</p>
                    </div>
                    <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-black uppercase text-amber-700">Pending Review</span>
                      <p className="text-xl font-black text-amber-700 mt-1">{orderStats.pending}</p>
                    </div>
                    <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-black uppercase text-blue-700">Confirmed</span>
                      <p className="text-xl font-black text-blue-700 mt-1">{orderStats.confirmed}</p>
                    </div>
                    <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
                      <span className="text-[10px] font-black uppercase text-emerald-700">Delivered</span>
                      <p className="text-xl font-black text-emerald-700 mt-1">{orderStats.completed}</p>
                    </div>
                  </div>

                  {/* Filter tabs & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'confirmed', label: 'Confirmed' },
                        { id: 'completed', label: 'Delivered' },
                        { id: 'cancelled', label: 'Cancelled' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setOrderStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                            orderStatusFilter === tab.id
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-56">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-blue-500"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr className="text-[10px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4">Ref / Date</th>
                          <th className="py-3 px-4">Recipient</th>
                          <th className="py-3 px-4">Phone / M-Pesa</th>
                          <th className="py-3 px-4">Size &amp; Qty</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {orders.map(order => {
                          const isPending = order.status === 'pending' || order.status === 'pending_confirmation';
                          const isConfirmed = order.status === 'confirmed';
                          const isDelivered = order.status === 'completed' || order.status === 'delivered';
                          const isCancelled = order.status === 'cancelled';

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70 transition-colors font-medium">
                              <td className="py-3 px-4">
                                <div className="font-mono font-bold text-slate-900">#{order.id}</div>
                                <div className="text-[10px] text-slate-400">
                                  {order.created_at ? new Date(order.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) : '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">{order.recipient_name}</td>
                              <td className="py-3 px-4">
                                <div className="font-mono text-slate-800">{order.phone}</div>
                                {order.mpesa_code && (
                                  <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                                    {order.mpesa_code}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-black px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px]">{order.size}</span>
                                <span className="ml-1 text-slate-500 font-semibold">&times; {order.quantity}</span>
                              </td>
                              <td className="py-3 px-4 font-black text-slate-900">
                                KES {Number(order.total_amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                {isPending && <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"><Clock size={10} /> Pending</span>}
                                {isConfirmed && <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1"><CheckCircle2 size={10} /> Confirmed</span>}
                                {isDelivered && <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"><PackageCheck size={10} /> Delivered</span>}
                                {isCancelled && <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"><XCircle size={10} /> Cancelled</span>}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <button
                                      onClick={() => handleConfirmCommunityOrder(order.id)}
                                      disabled={orderActionLoading === order.id}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Confirm Payment"
                                    >
                                      <Check size={11} /> Confirm
                                    </button>
                                  )}
                                  {isConfirmed && (
                                    <button
                                      onClick={() => handleCompleteCommunityOrder(order.id)}
                                      disabled={orderActionLoading === order.id}
                                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Mark as Delivered"
                                    >
                                      <PackageCheck size={11} /> Done
                                    </button>
                                  )}
                                  {(isPending || isConfirmed) && (
                                    <button
                                      onClick={() => setCancelOrderModal(order)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="Cancel Order"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedOrderDetail(order)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                    title="View Details / Receipt"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {orders.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-500">No orders recorded for this community.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUGGESTIONS TAB */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Review constructive ideas and feedback submitted by members for {moduleMeta?.title || categoryId}.
              </p>
              {suggestions.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare size={36} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-300 font-bold text-sm">No suggestions submitted yet</p>
                  <p className="text-slate-500 text-xs mt-0.5">Suggestions from the community page will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(s => (
                    <div key={s.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-800/70 hover:bg-slate-800 transition">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.name ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-700 text-slate-300'}`}>
                            {s.name ? s.name : 'Anonymous Member'}
                          </span>
                          {s.category && (
                            <span className="text-[11px] text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              #{s.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">{s.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MUSIC CLASS (choir only) — members who opted in on the join form */}
          {activeTab === 'music-class' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Members who asked to join music classes on the choir join form. Reach out directly to arrange sessions.
              </p>
              {loading ? (
                <PageLoader message="Loading sign-ups" />
              ) : musicSignups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <Music size={28} />
                  </div>
                  <h4 className="text-slate-300 font-bold italic">No music class sign-ups yet</h4>
                  <p className="text-slate-500 text-sm mt-1">Members who tick "Join Music Classes" on the form will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 font-bold">{musicSignups.length} member{musicSignups.length !== 1 ? 's' : ''} interested</p>
                  {musicSignups.map((s, i) => (
                    <div
                      key={`${s.phone}-${i}`}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-800/70 hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-2.5 text-sm font-bold text-slate-200 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 font-black">
                          {(s.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{s.full_name}</span>
                      </span>
                      <a
                        href={`tel:${String(s.phone).replace(/[^+0-9]/g, '')}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1.5 rounded-lg hover:bg-indigo-900 transition-colors shrink-0"
                        title={`Call ${s.full_name}`}
                      >
                        {s.phone}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHANNELS — Social Media & Video Links */}
          {activeTab === 'channels' && (() => {
            const isVideoPlatformCommunity = categoryId === 'choir' || categoryId === 'dancers';
            const availablePlatforms = isVideoPlatformCommunity
              ? [
                  { id: 'whatsapp', label: 'WhatsApp', isMemberOnly: true, placeholder: 'https://chat.whatsapp.com/...' },
                  { id: 'tiktok', label: 'TikTok', isMemberOnly: false, placeholder: 'https://www.tiktok.com/@...' },
                  { id: 'youtube', label: 'YouTube', isMemberOnly: false, placeholder: 'https://www.youtube.com/@...' },
                  { id: 'facebook', label: 'Facebook', isMemberOnly: false, placeholder: 'https://www.facebook.com/...' },
                ]
              : [
                  { id: 'whatsapp', label: 'WhatsApp', isMemberOnly: true, placeholder: 'https://chat.whatsapp.com/...' },
                  { id: 'facebook', label: 'Facebook', isMemberOnly: false, placeholder: 'https://www.facebook.com/...' },
                ];

            const selectedPlatformInfo = availablePlatforms.find(p => p.id === channelForm.platform) || availablePlatforms[0];

            const handleSaveChannel = async (platformToSave: string, urlToSave: string) => {
              const trimmed = (urlToSave || '').trim();
              if (!trimmed) {
                alert('Please provide a valid URL or handle');
                return;
              }
              const normalized = normalizeChannelUrl(platformToSave, trimmed);

              setChannelSaving(true);
              try {
                const updated = [...channels.filter(c => c.platform !== platformToSave), { platform: platformToSave, url: normalized }];
                await apiClient.patch(`/community-channels/${categoryId}/channels`, { channels: updated });
                setChannels(updated);
                setChannelEditing(null);
                setIsAddingChannel(false);
                setChannelForm({ platform: availablePlatforms[0].id, url: '' });
                showToast('Channel saved successfully');
              } catch (e: any) {
                alert(e?.response?.data?.error || 'Failed to save channel');
              } finally {
                setChannelSaving(false);
              }
            };

            const handleDeleteChannel = async (platformToDelete: string) => {
              if (!confirm(`Are you sure you want to remove the ${platformToDelete} channel?`)) return;
              setChannelSaving(true);
              try {
                const updated = channels.filter(c => c.platform !== platformToDelete);
                await apiClient.patch(`/community-channels/${categoryId}/channels`, { channels: updated });
                setChannels(updated);
                showToast('Channel removed');
              } catch (e) {
                alert('Failed to remove channel');
              } finally {
                setChannelSaving(false);
              }
            };

            return (
              <div className="space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Share2 size={18} className="text-amber-500" />
                      Social &amp; Video Channels
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage official online channels for {moduleMeta?.title || categoryId}.
                    </p>
                  </div>
                  {!isAddingChannel && (
                    <button
                      type="button"
                      onClick={() => {
                        setChannelEditing(null);
                        setChannelForm({ platform: availablePlatforms[0].id, url: '' });
                        setIsAddingChannel(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition shadow-sm cursor-pointer shrink-0"
                    >
                      <Plus size={15} /> Add Channel
                    </button>
                  )}
                </div>

                {/* Progress bar when saving */}
                {channelSaving && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full animate-pulse w-full" />
                  </div>
                )}

                {/* Add Channel Card */}
                {isAddingChannel && (
                  <div className="p-5 bg-amber-50/70 border-2 border-amber-200 rounded-2xl animate-fade space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Plus size={16} className="text-amber-600" /> Add New Channel
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingChannel(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition cursor-pointer"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                          Platform
                        </label>
                        <select
                          value={channelForm.platform}
                          onChange={(e) => setChannelForm({ ...channelForm, platform: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
                        >
                          {availablePlatforms.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label} ({p.isMemberOnly ? 'Members Only' : 'Public'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                          Channel URL
                        </label>
                        <input
                          type="url"
                          value={channelForm.url}
                          onChange={(e) => setChannelForm({ ...channelForm, url: e.target.value })}
                          placeholder={selectedPlatformInfo.placeholder}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Visibility explanation */}
                    <div className="p-3 bg-white/80 rounded-xl border border-amber-100 text-[11px] text-slate-600 flex items-start gap-2">
                      {selectedPlatformInfo.isMemberOnly ? (
                        <>
                          <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-emerald-700">Members-Only Access:</strong> WhatsApp group links are hidden from non-members on the public page to avoid unmoderated crowding. Only approved members can view and join.
                          </span>
                        </>
                      ) : (
                        <>
                          <Globe size={14} className="text-sky-600 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-sky-700">Public Access:</strong> This link is openly visible to all church members and visitors to watch and explore ministry content.
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingChannel(false)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveChannel(channelForm.platform, channelForm.url)}
                        disabled={channelSaving || !channelForm.url.trim()}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Save size={14} /> Save Channel
                      </button>
                    </div>
                  </div>
                )}

                {/* Channels List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Configured Channels ({channels.length})
                    </h4>
                  </div>

                  {channels.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Share2 size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-600">No social channels configured yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {isVideoPlatformCommunity
                          ? 'Add WhatsApp for member communications, or TikTok and YouTube to showcase choir/dance ministrations.'
                          : 'Add your community official WhatsApp group for enrolled member discussions.'}
                      </p>
                      {!isAddingChannel && (
                        <button
                          type="button"
                          onClick={() => {
                            setChannelForm({ platform: availablePlatforms[0].id, url: '' });
                            setIsAddingChannel(true);
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition cursor-pointer"
                        >
                          <Plus size={14} /> Add First Channel
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {channels.map((ch) => {
                        const isEditing = channelEditing === ch.platform;
                        const isWhatsApp = ch.platform.toLowerCase().includes('whatsapp');
                        const isTikTok = ch.platform.toLowerCase().includes('tiktok');
                        const isYouTube = ch.platform.toLowerCase().includes('youtube');
                        const isFacebook = ch.platform.toLowerCase().includes('facebook');

                        return (
                          <div
                            key={ch.platform}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Platform badge */}
                              <span
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                                  isWhatsApp
                                    ? 'bg-green-100 text-green-800'
                                    : isTikTok
                                    ? 'bg-slate-900 text-white'
                                    : isYouTube
                                    ? 'bg-red-100 text-red-800'
                                    : isFacebook
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {ch.platform}
                              </span>

                              {/* Visibility indicator */}
                              {isWhatsApp ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  <Lock size={10} /> Members Only
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                                  <Globe size={10} /> Public
                                </span>
                              )}

                              {/* URL View or Edit */}
                              <div className="flex-1 min-w-0 ml-2">
                                {isEditing ? (
                                  <input
                                    type="url"
                                    value={channelForm.url}
                                    onChange={(e) => setChannelForm({ ...channelForm, url: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
                                  />
                                ) : (
                                  <a
                                    href={normalizeChannelUrl(ch.platform, ch.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-slate-600 hover:text-amber-600 truncate flex items-center gap-1.5 group cursor-pointer"
                                  >
                                    <span className="truncate max-w-xs sm:max-w-md">{normalizeChannelUrl(ch.platform, ch.url)}</span>
                                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition shrink-0 text-amber-500" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveChannel(ch.platform, channelForm.url)}
                                    disabled={channelSaving || !channelForm.url.trim()}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                    title="Save changes"
                                  >
                                    <CheckCircle size={17} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChannelEditing(null);
                                      setChannelForm({ platform: availablePlatforms[0].id, url: '' });
                                    }}
                                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X size={17} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChannelEditing(ch.platform);
                                      setChannelForm({ platform: ch.platform, url: ch.url });
                                    }}
                                    className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Edit URL"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChannel(ch.platform)}
                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Delete channel"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Platform Guidance Banner */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <p className="font-black text-slate-700">Platform Visibility Rules:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                    <li>
                      <strong className="text-slate-700">WhatsApp Groups:</strong> Strictly hidden from non-members on the public community page to protect member privacy and prevent spam.
                    </li>
                    {isVideoPlatformCommunity ? (
                      <li>
                        <strong className="text-slate-700">TikTok &amp; YouTube:</strong> Available for Choir and Dancers to share performances, choreography, and liturgical recordings with the entire church and public visitors.
                      </li>
                    ) : (
                      <li>
                        <strong className="text-slate-700">Other Platforms:</strong> Video channels (TikTok/YouTube) are designated for Choir and Dancers media teams.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* MEMBERS / ACTIVITIES / ANNOUNCEMENTS */}
          {(activeTab === 'activities' || activeTab === 'announcements' || activeTab === 'members' || activeTab === 'approved-members') && (
            <>
              {loading ? (
                <PageLoader message="Synchronizing table data" />
              ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    {activeTab === 'activities' && <Calendar size={32} />}
                    {activeTab === 'announcements' && <Megaphone size={32} />}
                    {(activeTab === 'members' || activeTab === 'approved-members') && <Users size={32} />}
                  </div>
                  <h4 className="text-slate-300 font-bold italic">No records found</h4>
                  <p className="text-slate-500 text-sm mt-1">Click the "Add" button to populate this section.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {activeTab === 'members' ? (
                    <>
                      {/* Choir specific filter bar in admin */}
                      {categoryId === 'choir' && (
                        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-700">Filter Choir:</span>
                          <select
                            value={choirVoiceFilter}
                            onChange={(e: any) => setChoirVoiceFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                          >
                            <option value="all">All Voices (S-A-T-B)</option>
                            <option value="soprano">Soprano</option>
                            <option value="alto">Alto</option>
                            <option value="tenor">Tenor</option>
                            <option value="bass">Bass</option>
                          </select>

                          <select
                            value={choirGenderFilter}
                            onChange={(e: any) => setChoirGenderFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                          >
                            <option value="all">All Members (Gents & Ladies)</option>
                            <option value="male">Gents (Male)</option>
                            <option value="female">Ladies (Female)</option>
                          </select>
                        </div>
                      )}

                      {enrollmentStats && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {[
                            { label: 'Total', value: enrollmentStats.total, color: 'blue' },
                            { label: 'Pending', value: enrollmentStats.pending, color: 'amber' },
                            { label: 'Rejected', value: enrollmentStats.rejected, color: 'rose' },
                          ].map((stat) => (
                            <div key={stat.label} className="rounded-xl p-3 text-center bg-slate-50 border border-slate-200 shadow-xs">
                              <p className="text-xl font-black text-slate-900">{stat.value}</p>
                              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                            <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest">Full Name</th>
                            <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest">Phone</th>
                            <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest">Reg No</th>
                            {categoryId === 'choir' && (
                              <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest">Voice Section</th>
                            )}
                            <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                            <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.filter(m => {
                            const name = (m.fullName || m.full_name || '').toLowerCase();
                            const reg = (m.reg_number || m.regNumber || m.member_id || m.memberId || '').toLowerCase();
                            const phone = (m.phoneNumber || m.phone || '').toLowerCase();
                            const q = searchTerm.toLowerCase();
                            const matchesSearch = name.includes(q) || reg.includes(q) || phone.includes(q);
                            if (!matchesSearch) return false;

                            if (categoryId === 'choir') {
                              const v = (m.voice_type || m.voiceType || m.voice || '').toLowerCase();
                              if (choirVoiceFilter !== 'all' && !v.includes(choirVoiceFilter)) return false;
                              const g = (m.gender || '').toLowerCase().trim();
                              const isFemale = g.includes('female') || g === 'f' || g.includes('lady') || v.includes('soprano') || v.includes('alto');
                              const isMale = !isFemale && (g.includes('male') || g === 'm' || g.includes('gent') || v.includes('tenor') || v.includes('bass'));
                              if (choirGenderFilter === 'male' && !isMale) return false;
                              if (choirGenderFilter === 'female' && !isFemale) return false;
                            }
                            return true;
                          }).map((member) => (
                            <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-slate-800">
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">{member.fullName || member.full_name}</td>
                              <td className="py-3.5 px-4 text-sm text-slate-600 font-semibold">{member.phoneNumber || member.phone || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-sm text-slate-600 font-semibold">{member.reg_number || member.regNumber || member.member_id || member.memberId || 'N/A'}</td>
                              {categoryId === 'choir' && (
                                <td className="py-3.5 px-4 text-sm font-bold">
                                  <select
                                    value={member.voice_type || ''}
                                    onChange={async (e) => {
                                      const v = e.target.value;
                                      if (!v) return;
                                      try {
                                        await updateTableRecord('enrollments', member.id, { voice_type: v });
                                        showToast(`Voice section saved: ${v}`);
                                        await loadCategoryData();
                                      } catch {
                                        alert('Could not save voice section');
                                      }
                                    }}
                                    className={`px-2 py-1 rounded-md border text-xs font-black uppercase cursor-pointer ${
                                      (member.voice_type || '').toLowerCase().includes('soprano') ? 'bg-pink-100 text-pink-800 border-pink-200' :
                                      (member.voice_type || '').toLowerCase().includes('alto') ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                      (member.voice_type || '').toLowerCase().includes('tenor') ? 'bg-sky-100 text-sky-800 border-sky-200' :
                                      (member.voice_type || '').toLowerCase().includes('bass') ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                      'bg-white text-slate-500 border-slate-300'
                                    }`}
                                    title="Set this member's voice section"
                                  >
                                    <option value="">Set voice…</option>
                                    <option value="Soprano">Soprano</option>
                                    <option value="Alto">Alto</option>
                                    <option value="Tenor">Tenor</option>
                                    <option value="Bass">Bass</option>
                                  </select>
                                </td>
                              )}
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  member.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' : member.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {member.status !== 'Approved' && (
                                    <button onClick={async (e) => { e.stopPropagation(); try { await updateTableRecord('enrollments', member.id, { status: 'Approved' }); showToast('Member approved'); await loadCategoryData(); } catch { alert('Approve failed'); } }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Approve">
                                      <CheckCircle size={18} />
                                    </button>
                                  )}
                                  {member.status !== 'Rejected' && (
                                    <button onClick={async (e) => { e.stopPropagation(); try { await updateTableRecord('enrollments', member.id, { status: 'Rejected' }); showToast('Member rejected'); await loadCategoryData(); } catch { alert('Reject failed'); } }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Reject">
                                      <XCircle size={18} />
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="Delete">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : activeTab === 'approved-members' ? (
                    <>
                      {/* Sub-tab switcher */}
                      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4 w-fit">
                        <button onClick={() => setMemberSubTab('members')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${memberSubTab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          <Users size={13} className="inline mr-1.5" />Members
                        </button>
                        <button onClick={() => setMemberSubTab('associates')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${memberSubTab === 'associates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          <GraduationCap size={13} className="inline mr-1.5" />Associates
                        </button>
                      </div>

                      {memberSubTab === 'associates' ? (
                        <AssociatesTable moduleId={categoryId} />
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <Search size={14} className="text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search members by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400"
                              />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{data.length} Members</span>
                            {categoryId === 'choir' && (
                              <>
                                <select value={choirVoiceFilter} onChange={(e: any) => setChoirVoiceFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs">
                                  <option value="all">All Voices</option>
                                  <option value="soprano">Soprano</option>
                                  <option value="alto">Alto</option>
                                  <option value="tenor">Tenor</option>
                                  <option value="bass">Bass</option>
                                </select>
                                <select value={choirGenderFilter} onChange={(e: any) => setChoirGenderFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs">
                                  <option value="all">All Genders</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                </select>
                              </>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200 max-h-[600px] overflow-x-auto overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-10">No.</th>
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg No</th>
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                                  {categoryId === 'choir' && (
                                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Voice</th>
                                  )}
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Joined</th>
                                  <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.filter(m => {
                                  const name = (m.fullName || m.full_name || '').toLowerCase();
                                  const reg = (m.reg_number || m.regNumber || m.member_id || m.memberId || '').toLowerCase();
                                  const phone = (m.phoneNumber || m.phone || '').toLowerCase();
                                  const q = searchTerm.toLowerCase();
                                  const matchesSearch = name.includes(q) || reg.includes(q) || phone.includes(q);
                                  if (!matchesSearch) return false;
                                  if (categoryId === 'choir') {
                                    const v = (m.voice_type || m.voiceType || m.voice || '').toLowerCase();
                                    if (choirVoiceFilter !== 'all' && !v.includes(choirVoiceFilter)) return false;
                                    const g = (m.gender || '').toLowerCase().trim();
                                    const isFemale = g.includes('female') || g === 'f' || g.includes('lady') || v.includes('soprano') || v.includes('alto');
                                    const isMale = !isFemale && (g.includes('male') || g === 'm' || g.includes('gent') || v.includes('tenor') || v.includes('bass'));
                                    if (choirGenderFilter === 'male' && !isMale) return false;
                                    if (choirGenderFilter === 'female' && !isFemale) return false;
                                  }
                                  return true;
                                }).map((member, idx) => {
                                  const isEditing = editingMemberId === member.id;
                                  return (
                                    <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                      <td className="py-2.5 px-3 text-slate-400 text-xs">{idx + 1}</td>
                                      <td className="py-2.5 px-3">
                                        {isEditing ? (
                                          <input value={memberEditForm.full_name || ''} onChange={e => setMemberEditForm((p: any) => ({ ...p, full_name: e.target.value }))} className="text-xs border border-slate-200 rounded px-1.5 py-1 w-40" />
                                        ) : (
                                          <span className="text-slate-700 font-medium text-xs">{member.fullName || member.full_name}</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        {isEditing ? (
                                          <input value={memberEditForm.phone || ''} onChange={e => setMemberEditForm((p: any) => ({ ...p, phone: e.target.value }))} className="text-xs border border-slate-200 rounded px-1.5 py-1 w-28" />
                                        ) : (
                                          <span className="text-slate-500 text-xs">{member.phoneNumber || member.phone || '—'}</span>
                                        )}
                                      </td>
                                       <td className="py-2.5 px-3">
                                         <span className="text-slate-700 font-medium text-xs">{member.reg_number || member.regNumber || member.member_id || member.memberId || 'N/A'}</span>
                                       </td>
                                      <td className="py-2.5 px-3">
                                        {isEditing ? (
                                          <select value={memberEditForm.gender || ''} onChange={e => setMemberEditForm((p: any) => ({ ...p, gender: e.target.value }))} className="text-xs border border-slate-200 rounded px-1.5 py-1">
                                            <option value="">—</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                          </select>
                                        ) : (
                                          <span className={`text-xs font-semibold ${(member.gender || '').toLowerCase() === 'male' ? 'text-blue-600' : (member.gender || '').toLowerCase() === 'female' ? 'text-pink-600' : 'text-slate-400'}`}>
                                            {(member.gender || '').toLowerCase() === 'male' ? 'M' : (member.gender || '').toLowerCase() === 'female' ? 'F' : '—'}
                                          </span>
                                        )}
                                      </td>
                                      {categoryId === 'choir' && (
                                        <td className="py-2.5 px-3">
                                          {isEditing ? (
                                            <select value={memberEditForm.voice_type || ''} onChange={e => setMemberEditForm((p: any) => ({ ...p, voice_type: e.target.value }))} className="text-xs border border-slate-200 rounded px-1.5 py-1 w-24">
                                              <option value="">—</option>
                                              <option value="Soprano">Soprano</option>
                                              <option value="Alto">Alto</option>
                                              <option value="Tenor">Tenor</option>
                                              <option value="Bass">Bass</option>
                                            </select>
                                          ) : (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              (member.voice_type || '').toLowerCase().includes('soprano') ? 'bg-pink-50 text-pink-700' :
                                              (member.voice_type || '').toLowerCase().includes('alto') ? 'bg-amber-50 text-amber-700' :
                                              (member.voice_type || '').toLowerCase().includes('tenor') ? 'bg-sky-50 text-sky-700' :
                                              (member.voice_type || '').toLowerCase().includes('bass') ? 'bg-indigo-50 text-indigo-700' :
                                              'bg-slate-50 text-slate-500'
                                            }`}>
                                              {member.voice_type || '—'}
                                            </span>
                                          )}
                                        </td>
                                      )}
                                      <td className="py-2.5 px-3 text-slate-500 text-xs">{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}</td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex gap-1">
                                          {isEditing ? (
                                            <>
                                              <button onClick={async () => {
                                                setMemberSaving(true);
                                                try {
                                                  await updateTableRecord('enrollments', member.id, {
                                                    full_name: memberEditForm.full_name,
                                                    phone: memberEditForm.phone,
                                                    email: memberEditForm.email,
                                                    gender: memberEditForm.gender,
                                                    voice_type: memberEditForm.voice_type,
                                                  });
                                                  showToast('Member updated');
                                                  setEditingMemberId(null);
                                                  await loadCategoryData();
                                                } catch { alert('Update failed'); }
                                                setMemberSaving(false);
                                              }} disabled={memberSaving} className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50">
                                                <Save size={12} />
                                              </button>
                                              <button onClick={() => setEditingMemberId(null)} className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200">
                                                <X size={12} />
                                              </button>
                                            </>
                                          ) : (
                                            <button onClick={() => { setEditingMemberId(member.id); setMemberEditForm({ full_name: member.fullName || member.full_name || '', phone: member.phoneNumber || member.phone || '', email: member.email || '', gender: member.gender || '', voice_type: member.voice_type || '' }); }} className="text-xs font-semibold px-2 py-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200">
                                              <Edit2 size={12} />
                                            </button>
                                          )}
                                          <button onClick={async () => {
                                            if (!confirm('Remove this member?')) return;
                                            try {
                                              await deleteTableRecord('enrollments', member.id);
                                              showToast('Member removed');
                                              await loadCategoryData();
                                            } catch { alert('Delete failed'); }
                                          }} className="text-xs font-semibold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </>
                  ) : activeTab === 'schedules' ? (
                    <div className="space-y-4">
                      {data.map((item) => (
                        <div key={item.id} onClick={() => openEditModal(item)} className="p-5 border border-slate-800 bg-slate-800/60 rounded-2xl hover:border-purple-500 hover:bg-slate-800 transition-all flex items-start justify-between gap-4 group cursor-pointer text-white">
                          <div className="flex gap-4">
                            <div className="p-3 rounded-xl shrink-0 bg-purple-950 text-purple-300 border border-purple-800">
                              <Clock size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-lg uppercase tracking-tight">{item.day}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                                  {item.start_time} – {item.end_time || item.start_time}
                                </span>
                              </div>
                              <p className="text-slate-300 text-sm mt-1 leading-relaxed font-medium">
                                Venue: <strong className="text-white">{item.location}</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg"><Edit2 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.map((item) => (
                        <div key={item.id} onClick={() => openEditModal(item)} className="p-5 border border-slate-800 bg-slate-800/60 rounded-2xl hover:border-blue-500 hover:bg-slate-800 transition-all flex items-start justify-between gap-4 group cursor-pointer text-white">
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl shrink-0 ${activeTab === 'activities' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
                              {activeTab === 'activities' ? <Calendar size={20} /> : <Megaphone size={20} />}
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg uppercase tracking-tight">{item.title}</h4>
                              <p className="text-slate-300 text-sm mt-1 leading-relaxed">{item.description || item.content}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                  <Clock size={14} /> {item.activity_date || item.announcement_date ? new Date(item.activity_date || item.announcement_date).toLocaleDateString() : 'N/A'}
                                </div>
                                {item.location && (
                                  <div className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px] font-black uppercase tracking-widest">{item.location}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg"><Edit2 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Modal for Activities / Announcements / Members */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8 text-slate-900 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black mb-4 text-slate-900">{editingItem ? 'Edit' : 'Add'} {activeTab === 'activities' ? 'Activity' : activeTab === 'announcements' ? 'Announcement' : activeTab === 'schedules' ? 'Practice Schedule' : 'Member'}</h3>
            <div className="space-y-3.5">
              {activeTab === 'schedules' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Day of Week *</label>
                      <select value={formValues.day || (isStFrancisAdmin ? 'Sunday' : isDancersAdmin ? 'Saturday' : isCharismaticAdmin ? 'Thursday' : 'Tuesday')} onChange={(e) => setFormValues(v => ({ ...v, day: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-bold focus:outline-none focus:border-blue-500">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">{isStFrancisAdmin ? 'Venue / Meeting Point *' : 'Venue / Room *'}</label>
                      <input value={formValues.location || ''} onChange={(e) => setFormValues(v => ({ ...v, location: e.target.value }))} placeholder={isStFrancisAdmin ? 'e.g. LH 21 / Neighborhood Block' : 'e.g. School Compound / Main Hall'} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Start Time *</label>
                      <input type="text" value={formValues.start_time || ''} onChange={(e) => setFormValues(v => ({ ...v, start_time: e.target.value }))} placeholder={isStFrancisAdmin ? 'e.g. 17:00 or 5:00 PM' : 'e.g. 16:00 or 4:00 PM'} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">End Time</label>
                      <input type="text" value={formValues.end_time || ''} onChange={(e) => setFormValues(v => ({ ...v, end_time: e.target.value }))} placeholder="e.g. 18:30 or 6:30 PM" className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>
              )}
              {(activeTab === 'activities' || activeTab === 'announcements') && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Title</label>
                    <input value={formValues.title || ''} onChange={(e) => setFormValues(v => ({ ...v, title: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Description / Content</label>
                    <textarea value={formValues.description || formValues.content || ''} onChange={(e) => setFormValues(v => ({ ...v, description: e.target.value, content: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium focus:outline-none focus:border-blue-500" rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Venue / Location</label>
                      <input value={formValues.location || ''} onChange={(e) => setFormValues(v => ({ ...v, location: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Date</label>
                      <input type="date" value={formValues.activity_date?.slice?.(0, 10) || formValues.announcement_date?.slice?.(0, 10) || ''} onChange={(e) => setFormValues(v => ({ ...v, activity_date: e.target.value, announcement_date: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'members' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full name</label>
                    <input value={formValues.full_name || formValues.fullName || ''} onChange={(e) => setFormValues(v => ({ ...v, full_name: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium focus:outline-none focus:border-blue-500" />
                  </div>
                  {['charismatic', 'dancers', 'youth'].includes(categoryId || '') ? (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700">Phone Number</label>
                        <input value={formValues.phone || formValues.phoneNumber || ''} onChange={(e) => setFormValues(v => ({ ...v, phone: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" placeholder="e.g. 0712345678" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700">Email Address (optional)</label>
                        <input type="email" value={formValues.email || ''} onChange={(e) => setFormValues(v => ({ ...v, email: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" placeholder="e.g. email@example.com" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700">Voice Section (SATB)</label>
                          <select value={formValues.voice_type || ''} onChange={(e) => setFormValues(v => ({ ...v, voice_type: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-bold focus:outline-none focus:border-blue-500">
                            <option value="">Select Voice...</option>
                            <option value="Soprano">Soprano (High Female)</option>
                            <option value="Alto">Alto (Low Female)</option>
                            <option value="Tenor">Tenor (High Male)</option>
                            <option value="Bass">Bass (Deep Male)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700">Gender (Gent / Lady)</label>
                          <select value={formValues.gender || ''} onChange={(e) => setFormValues(v => ({ ...v, gender: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-bold focus:outline-none focus:border-blue-500">
                            <option value="">Select Gender...</option>
                            <option value="Male">Gent (Male)</option>
                            <option value="Female">Lady (Female)</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-xs font-bold text-slate-700">Phone Number</label>
                        <input value={formValues.phone || formValues.phoneNumber || ''} onChange={(e) => setFormValues(v => ({ ...v, phone: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500" placeholder="e.g. 0712345678" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-700">Status</label>
                    <select value={formValues.status || 'Pending'} onChange={(e) => setFormValues(v => ({ ...v, status: e.target.value }))} className="w-full border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2 rounded-xl mt-1 text-xs font-bold focus:outline-none focus:border-blue-500">
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700">Attachment / Image (optional)</label>
                <input type="file" onChange={handleFileChange} className="w-full mt-1 text-xs text-slate-600" />
                {formValues.image_url && <img src={formValues.image_url} alt="preview" className="w-32 h-20 object-cover mt-2 rounded-xl border border-slate-200" />}
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-100">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-xs text-slate-600 hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button
                  disabled={uploading}
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-60"
                  style={{ background: accentColor }}
                >
                  {uploading ? 'Uploading...' : (editingItem ? 'Save Changes' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Gallery Add */}
      {galleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Photo to Gallery</h3>
                <p className="text-xs text-slate-500 font-medium">{moduleMeta?.title || categoryId} • Community Gallery</p>
              </div>
              <button onClick={() => setGalleryModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition text-slate-600 cursor-pointer"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Event / Caption Name</label>
                <input
                  type="text"
                  placeholder="e.g. Easter Choir Rehearsal"
                  value={newImageForm.event_name}
                  onChange={(e) => setNewImageForm(v => ({ ...v, event_name: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-800 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Category Tag (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Concerts, Sunday Mass"
                  value={newImageForm.category}
                  onChange={(e) => setNewImageForm(v => ({ ...v, category: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-800 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Image *</label>
                <input
                  ref={galleryImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setGalleryImageFile(file);
                      setGalleryImagePreview(URL.createObjectURL(file));
                      setNewImageForm(v => ({ ...v, image_url: '' }));
                    }
                  }}
                />
                <div
                  onClick={() => galleryImageInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all mt-1"
                >
                  {galleryImagePreview ? (
                    <img src={galleryImagePreview} alt="preview" className="w-full h-36 object-cover rounded-lg" />
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-600">Click to select image</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
                {galleryImageFile && (
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{galleryImageFile.name}</p>
                )}
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-slate-500">Or paste image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newImageForm.image_url}
                    onChange={(e) => {
                      setNewImageForm(v => ({ ...v, image_url: e.target.value }));
                      setGalleryImageFile(null);
                      setGalleryImagePreview('');
                    }}
                    className="w-full border border-slate-200 bg-slate-50 text-slate-800 p-2 rounded-lg text-xs mt-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>
              {(galleryImagePreview || newImageForm.image_url) && (
                <img src={galleryImagePreview || newImageForm.image_url} alt="preview" className="w-full h-36 object-cover rounded-xl border border-slate-200 mt-2" />
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => setGalleryModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button onClick={handleAddGalleryImage} disabled={galleryUploading} className="px-5 py-2 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50" style={{ background: accentColor }}>
                  {galleryUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for T-Shirt Product Add/Edit */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">{productForm.id ? 'Edit Merchandise Product' : 'Add New Merchandise'}</h3>
                <p className="text-xs text-slate-500 font-medium">{moduleMeta?.title || categoryId} • Community Uniform &amp; Attire</p>
              </div>
              <button onClick={() => setProductModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition text-slate-600 cursor-pointer"><X size={14} /></button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Official Choir Polo T-Shirt"
                  value={productForm.name}
                  onChange={(e) => setProductForm(v => ({ ...v, name: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Price (KES) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(v => ({ ...v, price: Number(e.target.value) }))}
                    className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Expected Collection Date</label>
                  <input
                    type="date"
                    value={productForm.collection_date}
                    onChange={(e) => setProductForm(v => ({ ...v, collection_date: e.target.value }))}
                    className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Sizes Available (comma separated)</label>
                <input
                  type="text"
                  placeholder="S, M, L, XL, XXL"
                  value={productForm.sizes}
                  onChange={(e) => setProductForm(v => ({ ...v, sizes: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">T-Shirt Sample Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setProductImageFile(f);
                    if (f) {
                      setProductImagePreview(URL.createObjectURL(f));
                    } else {
                      setProductImagePreview('');
                    }
                  }}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 font-medium file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700 file:text-xs file:font-bold"
                />
                {productImagePreview && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50">
                    <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {!productImagePreview && productForm.image_url && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50">
                    <img src={productForm.image_url} alt="Current" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Current</span>
                  </div>
                )}
                {!productImageFile && !productForm.image_url && (
                  <p className="text-[10px] text-slate-400 mt-1">Select an image to upload (stored on Cloudinary).</p>
                )}
                {productImageFile && (
                  <button
                    type="button"
                    onClick={() => { setProductImageFile(null); setProductImagePreview(''); }}
                    className="text-[10px] text-red-500 font-bold mt-1 hover:underline"
                  >
                    Remove selected image
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description / Fabric Info</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% combed cotton, embroidered crest, unisex sizing."
                  value={productForm.description}
                  onChange={(e) => setProductForm(v => ({ ...v, description: e.target.value }))}
                  className="w-full border border-slate-200 bg-slate-50 text-slate-900 p-2.5 rounded-xl text-xs mt-1 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => setProductModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button onClick={handleSaveProduct} className="px-5 py-2 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer" style={{ background: accentColor }}>
                  {productForm.id ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Cancel Order */}
      {cancelOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle size={18} />
                <h3 className="font-black text-slate-900">Cancel Order #{cancelOrderModal.id}</h3>
              </div>
              <button onClick={() => setCancelOrderModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={14} /></button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Cancel the order for <strong>{cancelOrderModal.recipient_name}</strong>? Their order status will change to <em>Cancelled</em>.
            </p>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-700 block mb-1">Reason for Cancellation</label>
              <textarea
                rows={3}
                placeholder="e.g. M-Pesa transaction code not verified, out of stock, or member requested cancellation."
                value={orderRejectionReason}
                onChange={(e) => setOrderRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => setCancelOrderModal(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Go Back</button>
              <button
                onClick={handleCancelCommunityOrder}
                disabled={orderActionLoading === cancelOrderModal.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {orderActionLoading === cancelOrderModal.id ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Order Detail / Receipt */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Shirt size={16} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Order #{selectedOrderDetail.id} Details</h3>
                  <p className="text-[10px] text-slate-500">{moduleMeta?.title || categoryId} Attire</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={14} /></button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Recipient</span>
                <span className="font-black text-slate-900">{selectedOrderDetail.recipient_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Phone</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrderDetail.phone}</span>
              </div>
              {selectedOrderDetail.mpesa_code && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">M-Pesa Ref</span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{selectedOrderDetail.mpesa_code}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Specification</span>
                <span className="font-bold text-slate-900">Size {selectedOrderDetail.size} &times; {selectedOrderDetail.quantity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                <span className="font-black uppercase text-indigo-600 text-[10px]">{selectedOrderDetail.status}</span>
              </div>
              {selectedOrderDetail.rejection_reason && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs mt-2">
                  <span className="font-bold block text-[10px] uppercase text-rose-800 mb-0.5">Cancellation Reason</span>
                  {selectedOrderDetail.rejection_reason}
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
                <span className="font-black text-slate-500 uppercase text-[10px]">Total Amount</span>
                <span className="text-lg font-black text-slate-900">KES {Number(selectedOrderDetail.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-slate-100">
              <button onClick={() => window.print()} className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Printer size={13} /> Print
              </button>
              <button onClick={() => setSelectedOrderDetail(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* CHOIR SONG UPLOAD & EDIT MODAL (SIDE-BY-SIDE MULTILINGUAL OCR SUITE) */}
      {/* ========================================================================= */}
      {songModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-6xl w-full shadow-2xl border border-slate-200 my-4 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Music size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {editingSong ? 'Edit Choir Song' : 'Upload Song Sheet & Lyrics'}
                    </h3>
                    {songForm.confidence_score > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {songForm.confidence_score}% OCR Accuracy
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Side-by-side sheet music comparison with multilingual Smart OCR (Swahili, English, Luo, Kamba, Kikuyu, Latin).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSongModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Multi-Song Detected Selector Bar */}
            {detectedSongsList.length > 1 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl space-y-2 animate-fade-in flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                    <Sparkles size={14} className="text-purple-600 animate-pulse" />
                    <span>{detectedSongsList.length} Songs Detected on Sheet!</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                    Multi-Song Sheet
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {detectedSongsList.map((s, idx) => {
                    const isActive = (songForm.title || '').trim().toLowerCase() === (s.title || '').trim().toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          applyDetectedSong(s);
                          showToast(`Auto-filled details for "${s.title}"`);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-purple-700 text-white shadow-md ring-2 ring-purple-400 font-black'
                            : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <Music size={11} className={isActive ? 'text-purple-200' : 'text-purple-500'} />
                        <span>{idx + 1}. {s.title || `Song ${idx + 1}`}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                          isActive ? 'bg-purple-800/80 text-purple-100' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {s.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Body: Side-by-Side Dual-Pane Layout */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                {/* ── LEFT PANE: Sheet Photo Upload & Interactive Viewer (5 cols) ── */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-blue-600" />
                      <span>Sheet Music {continuationPages.length > 0 ? `(${continuationPages.length + 1} Pages)` : 'Photo *'}</span>
                    </label>
                    {(songFilePreview || continuationPages.length > 0) && (
                      <a
                        href={activeSheetPageIndex === 0 ? songFilePreview : (continuationPages[activeSheetPageIndex - 1]?.preview || songFilePreview)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Maximize2 size={11} /> Pop-out
                      </a>
                    )}
                  </div>

                  {/* Multi-Page Tabs Switcher */}
                  {(songFilePreview || continuationPages.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActiveSheetPageIndex(0)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                          activeSheetPageIndex === 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>📄 Page 1 (Main)</span>
                      </button>

                      {continuationPages.map((page, idx) => (
                        <div key={idx} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveSheetPageIndex(idx + 1)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-l-lg transition flex items-center gap-1 cursor-pointer ${
                              activeSheetPageIndex === idx + 1
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>📄 Page {idx + 2}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveContinuationPage(idx)}
                            className="px-1 py-1 text-[11px] bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-400 rounded-r-lg border-l border-slate-200 transition"
                            title="Remove this continuation page"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}

                      {/* Add Continuation Page Button */}
                      <label className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200 transition cursor-pointer flex items-center gap-1 ml-auto">
                        <Plus size={11} />
                        <span>+ Add Page {continuationPages.length + 2}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddContinuationFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Main File Upload & Extract Trigger */}
                  <div className="space-y-2">
                    {!songFilePreview && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSongFileSelect}
                        className="w-full text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                    )}

                    {/* Multilingual Vision AI Engine Badge */}
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                        <span className="text-[11px] font-bold text-indigo-900">
                          Multilingual Vision AI (Swahili, English, Luo, Kikuyu, Kamba, Latin)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded">
                        {continuationPages.length > 0 ? `${continuationPages.length + 1} Pages Attached` : 'Ready'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOcrExtract}
                      disabled={ocrExtracting || (!songFile && !songFilePreview && continuationPages.length === 0)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {ocrExtracting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Transcribing {continuationPages.length > 0 ? `${continuationPages.length + 1} Pages` : 'Hymn'} with Vision AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>⚡ Extract {continuationPages.length > 0 ? `All ${continuationPages.length + 1} Continuous Pages` : 'Multilingual Text with Vision AI'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Static Non-Bouncing Loading State with Concentric Rings & Cross */}
                  {ocrStatus === 'scanning' && (
                    <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl text-white shadow-md flex items-center gap-3.5 transition-all">
                      {/* Miniature dual concentric spinning rings with center cross */}
                      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" style={{ animationDuration: '2.5s' }} />
                        <div className="absolute inset-1 rounded-full border border-purple-400/30 border-b-purple-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
                        {/* Latin Cross Icon */}
                        <svg className="w-4 h-4 text-amber-300 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11 2h2v6h5v2h-5v12h-2V10H6V8h5V2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>Transcribing Hymn with Vision AI</span>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        </p>
                        <p className="text-[11px] text-indigo-200/90 font-medium truncate">
                          {ocrStatusMessage || 'Reading sheet music, stanzas & sol-fa notation...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {ocrStatus === 'success' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-900 font-bold">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-emerald-950">OCR Analysis Complete</p>
                        <p className="text-[11px] text-emerald-700 font-medium">{ocrStatusMessage}</p>
                      </div>
                    </div>
                  )}

                  {ocrStatus === 'warning' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900 font-bold">
                      <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-amber-950">Notice</p>
                        <p className="text-[11px] text-amber-800 font-medium">{ocrStatusMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Interactive Zoomable Sheet Photo Viewer */}
                  {(songFilePreview || continuationPages.length > 0) ? (
                    <div className="space-y-2">
                      {/* Zoom & Contrast Controls */}
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSheetZoom(z => Math.max(0.6, z - 0.2))}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut size={13} />
                          </button>
                          <span className="text-[10px] font-bold text-slate-500 min-w-[36px] text-center">
                            {Math.round(sheetZoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => setSheetZoom(z => Math.min(2.5, z + 0.2))}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSheetZoom(1)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded ml-0.5 cursor-pointer"
                            title="Reset Zoom"
                          >
                            <RotateCcw size={11} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Viewing Page {activeSheetPageIndex + 1} of {continuationPages.length + (songFilePreview ? 1 : 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInvertSheetContrast(!invertSheetContrast)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                              invertSheetContrast
                                ? 'bg-purple-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Invert dark contrast for rehearsal lighting"
                          >
                            <Contrast size={11} />
                            <span>Dark Sheet</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative h-80 sm:h-96 rounded-xl overflow-auto border-2 border-slate-200 bg-slate-900 flex items-start justify-center p-2">
                        <img
                          src={activeSheetPageIndex === 0 ? songFilePreview : (continuationPages[activeSheetPageIndex - 1]?.preview || songFilePreview)}
                          alt="Sheet Preview"
                          className="max-w-full rounded-lg transition-transform duration-150 origin-top"
                          style={{
                            transform: `scale(${sheetZoom})`,
                            filter: invertSheetContrast ? 'invert(1) hue-rotate(180deg) contrast(1.2)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <ImageIcon size={32} className="text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">No sheet image selected</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Select a clear photo or scanned page to preview and run OCR.</p>
                    </div>
                  )}
                </div>

                {/* ── RIGHT PANE: Metadata & Extracted Lyrics Editor (7 cols) ── */}
                <div className="lg:col-span-7 space-y-3.5">
                  
                  {/* Multi-Song Switcher Tabs (When 2+ songs found on the sheet) */}
                  {detectedSongsList.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/90 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-black text-slate-600 px-1">
                        Select Song ({detectedSongsList.length}):
                      </span>
                      {detectedSongsList.map((song, idx) => {
                        const isActive = (songForm.title === song.title) || (!songForm.title && idx === 0);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyDetectedSong(song)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs font-black'
                                : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                            }`}
                          >
                            <span>🎵</span>
                            <span className="max-w-[140px] truncate">{song.title || `Song ${idx + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Row 1: Title & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wide">Song Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mzalendo, Bwana Unirehemu, Ave Maria, Wer Misango"
                        value={songForm.title}
                        onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wide">Liturgical Category *</label>
                      <select
                        value={songForm.category}
                        onChange={(e) => setSongForm({ ...songForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="marian">🌹 Marian (Bikira Maria)</option>
                        <option value="mwanzo">🚪 Entrance (Mwanzo)</option>
                        <option value="utukufu">✨ Kyrie / Gloria (Utukufu na Huruma)</option>
                        <option value="sadaka">🍞 Offertory (Sadaka / Matoleo)</option>
                        <option value="komunyo">🍷 Communion (Komunyo / Ekaristi)</option>
                        <option value="shukrani">🙏 Thanksgiving (Shukrani)</option>
                        <option value="kutoka">🚶‍♂️ Recessional (Kutoka)</option>
                        <option value="kwaresma">✝️ Lent (Kwaresma / Mateso)</option>
                        <option value="pasaka">🌅 Easter (Pasaka / Ufufuko)</option>
                        <option value="noeli">⭐ Christmas (Noeli / Krismasi)</option>
                        <option value="pentecost">🔥 Pentecost (Roho Mtakatifu)</option>
                        <option value="patron">📖 St. Thomas Aquinas (Msimamizi)</option>
                        <option value="general">🎼 General / Other (Mbalimbali)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Language & Composer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wide">Language</label>
                      <select
                        value={songForm.language}
                        onChange={(e) => setSongForm({ ...songForm, language: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Swahili">Swahili</option>
                        <option value="English">English</option>
                        <option value="Luo">Luo (Dholuo)</option>
                        <option value="Kikuyu">Kikuyu (Gikuyu)</option>
                        <option value="Kamba">Kamba (Kikamba)</option>
                        <option value="Latin">Latin</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wide">Composer / Arranger</label>
                      <input
                        type="text"
                        placeholder="e.g. Fr. Jude Njoroge, B. Mukasa, Traditional"
                        value={songForm.composer}
                        onChange={(e) => setSongForm({ ...songForm, composer: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Row 3: Key Signature, Time Signature, Tempo */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1 uppercase tracking-wide">Key</label>
                      <input
                        type="text"
                        placeholder="e.g. G, F#, Dm"
                        value={songForm.key_signature}
                        onChange={(e) => setSongForm({ ...songForm, key_signature: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1 uppercase tracking-wide">Time</label>
                      <input
                        type="text"
                        placeholder="4/4, 3/4, 6/8"
                        value={songForm.time_signature}
                        onChange={(e) => setSongForm({ ...songForm, time_signature: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1 uppercase tracking-wide">Tempo</label>
                      <input
                        type="text"
                        placeholder="e.g. Moderato, Allegro"
                        value={songForm.tempo}
                        onChange={(e) => setSongForm({ ...songForm, tempo: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Tonic Sol-fa Notation Section (Collapsible) */}
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
                    <button
                      type="button"
                      onClick={() => setShowSolfaEditor(!showSolfaEditor)}
                      className="w-full flex items-center justify-between text-xs font-black text-purple-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Music size={13} className="text-purple-600" />
                        <span>Tonic Sol-fa Notation {songForm.solfa_notation ? '(Attached)' : '(Optional)'}</span>
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold uppercase">
                        {showSolfaEditor ? 'Hide' : 'Show / Edit'}
                      </span>
                    </button>

                    {showSolfaEditor && (
                      <textarea
                        rows={3}
                        placeholder="d:r:m | f:s:l | s:-:- (auto-extracted from sheet or entered manually)"
                        value={songForm.solfa_notation}
                        onChange={(e) => setSongForm({ ...songForm, solfa_notation: e.target.value })}
                        className="w-full mt-2 p-2 bg-white border border-purple-200 rounded-xl text-xs font-mono text-purple-950 focus:outline-none focus:border-purple-500 leading-relaxed"
                      />
                    )}
                  </div>

                  {/* Extracted Lyrics Editor */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        Lyrics Text Editor *
                      </label>
                      
                      {/* Rapid Stanza Tag helper buttons */}
                      <div className="flex flex-wrap items-center gap-1">
                        {['[Chorus]', '[Verse 1]', '[Verse 2]', '[Verse 3]', '[Mwitikio]', '[Ubeti]', '[Wer]', '[Bridge]'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSongForm({ ...songForm, lyrics_text: `${songForm.lyrics_text}\n\n${tag}\n` })}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-bold text-slate-600 rounded transition cursor-pointer"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={9}
                      placeholder="Type or review lyrics here. Click '⚡ Extract Multilingual Text with OCR' above to auto-populate from the sheet music photo..."
                      value={songForm.lyrics_text}
                      onChange={(e) => setSongForm({ ...songForm, lyrics_text: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 leading-relaxed font-sans focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-shrink-0">
              <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
                {detectedSongsList.length > 1
                  ? `Tip: You can save all ${detectedSongsList.length} songs at once, or switch between them above.`
                  : 'Edits to lyrics build the adaptive dictionary for recurring typo correction.'}
              </span>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSongModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                {detectedSongsList.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchSaveAllSongs}
                    disabled={batchSaving || songSaving}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                    title="Save all extracted songs as individual entries in the repertoire"
                  >
                    {batchSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>{batchSaving ? 'Saving All...' : `Save All ${detectedSongsList.length} Songs`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveSong(false, null)}
                  disabled={songSaving || batchSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {songSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{songSaving ? 'Saving Song...' : (detectedSongsList.length > 1 ? 'Save This Song Only' : 'Save Song to Repertoire')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SONG PREVIEW MODAL */}
      {/* ========================================================================= */}
      {viewingSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">{viewingSongModal.title}</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                  <span className="capitalize">{viewingSongModal.category}</span>
                  {viewingSongModal.composer && <span>• By {viewingSongModal.composer}</span>}
                </div>
              </div>
              <button
                onClick={() => setViewingSongModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sheet Music Image */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs max-h-96 flex items-center justify-center overflow-auto p-2">
              <img
                src={viewingSongModal.image_url}
                alt={viewingSongModal.title}
                className="max-h-80 object-contain rounded-xl"
              />
            </div>

            {/* Lyrics Preview */}
            {viewingSongModal.lyrics_text && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-black uppercase text-slate-400 mb-2">Extracted Lyrics</p>
                <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {viewingSongModal.lyrics_text}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSongModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIDE-BY-SIDE DUPLICATE SONG COMPARISON & DECISION MODAL */}
      {/* ========================================================================= */}
      {duplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">

                    Similar Song Already in Repertoire
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    A hymn titled <span className="font-bold underline text-white">"{duplicateModal.existing.title}"</span> already exists. Compare both versions below and choose what to do:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateModal(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Side-by-Side Comparison Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* LEFT: Existing Version */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="px-2.5 py-1 bg-slate-200 text-slate-800 text-[11px] font-black rounded-lg uppercase tracking-wide">
                      📁 Existing in Repertoire
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      ID #{duplicateModal.existing.id}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">{duplicateModal.existing.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md capitalize">{duplicateModal.existing.category}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">{duplicateModal.existing.language || 'Swahili'}</span>
                      {duplicateModal.existing.key_signature && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-md">Key {duplicateModal.existing.key_signature}</span>}
                      {duplicateModal.existing.composer && <span>• By {duplicateModal.existing.composer}</span>}
                    </div>
                  </div>

                  {/* Existing Sheet Image Thumbnail */}
                  {duplicateModal.existing.image_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white h-40 flex items-center justify-center relative group">
                      <img
                        src={duplicateModal.existing.image_url}
                        alt="Existing Sheet"
                        className="max-h-full object-contain"
                      />
                      <a
                        href={duplicateModal.existing.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1"
                      >
                        <Maximize2 size={13} /> View Full Sheet
                      </a>
                    </div>
                  )}

                  {/* Existing Lyrics */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                      Existing Lyrics
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl max-h-56 overflow-y-auto text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {duplicateModal.existing.lyrics_text || '(No lyrics recorded)'}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Newly Extracted / Uploaded Version */}
                <div className="border-2 border-indigo-300 rounded-2xl p-4 bg-indigo-50/40 flex flex-col space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                    <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={12} /> New Upload / Scan
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      Pending Save
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-indigo-950">{duplicateModal.incomingForm.title}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md capitalize">{duplicateModal.incomingForm.category}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">{duplicateModal.incomingForm.language || 'Swahili'}</span>
                      {duplicateModal.incomingForm.key_signature && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-md">Key {duplicateModal.incomingForm.key_signature}</span>}
                      {duplicateModal.incomingForm.composer && <span>• By {duplicateModal.incomingForm.composer}</span>}
                    </div>
                  </div>

                  {/* Incoming Sheet Image Thumbnail */}
                  {(songFilePreview || duplicateModal.incomingForm.image_url) && (
                    <div className="rounded-xl overflow-hidden border border-indigo-200 bg-white h-40 flex items-center justify-center relative group">
                      <img
                        src={songFilePreview || duplicateModal.incomingForm.image_url}
                        alt="New Sheet"
                        className="max-h-full object-contain"
                      />
                      <a
                        href={songFilePreview || duplicateModal.incomingForm.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1"
                      >
                        <Maximize2 size={13} /> View New Sheet
                      </a>
                    </div>
                  )}

                  {/* Incoming Lyrics */}
                  <div className="flex-1 flex flex-col">
                    <label className="text-[10px] font-black text-indigo-900 uppercase tracking-wide mb-1">
                      New Extracted Lyrics
                    </label>
                    <div className="p-3 bg-white border border-indigo-200 rounded-xl max-h-56 overflow-y-auto text-xs font-sans text-indigo-950 whitespace-pre-wrap leading-relaxed">
                      {duplicateModal.incomingForm.lyrics_text || '(No lyrics provided)'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Decision Footer Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Choir masters can update the existing song or archive both versions in the repertoire.
              </span>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setDuplicateModal(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSong(true, null)}
                  disabled={songSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Keep both copies side-by-side in the songbook"
                >
                  <Plus size={14} />
                  <span>Keep Both (Save New Copy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSong(false, duplicateModal.existing.id)}
                  disabled={songSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Replace old lyrics and sheet with this new version"
                >
                  <RefreshCw size={14} />
                  <span>Overwrite Existing Song</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {batchDuplicateReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Similar Songs Found</h3>
                <p className="text-xs text-amber-100 font-medium mt-1">Review each match before finishing this multi-song save.</p>
              </div>
              <button type="button" onClick={() => setBatchDuplicateReview(null)} className="p-2 rounded-xl hover:bg-white/15 transition cursor-pointer" title="Cancel duplicate review">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Duplicate {Object.keys(batchDuplicateReview.decisions).length + 1} of {batchDuplicateReview.conflicts.length}</span>
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Unique songs already saved</span>
              </div>
              {(() => {
                const conflict = batchDuplicateReview.conflicts[0];
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Existing song</p>
                      <h4 className="text-base font-black text-slate-900">{conflict.existing.title}</h4>
                      <p className="text-xs text-slate-500">{conflict.existing.category} {conflict.existing.language ? `• ${conflict.existing.language}` : ''}</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">{conflict.existing.lyrics_text || 'No lyrics recorded.'}</p>
                    </div>
                    <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-indigo-500">New OCR song</p>
                      <h4 className="text-base font-black text-indigo-950">{conflict.incoming.title}</h4>
                      <p className="text-xs text-slate-500">{conflict.incoming.category} {conflict.incoming.language ? `• ${conflict.incoming.language}` : ''}</p>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">{conflict.incoming.lyrics_text || 'No lyrics extracted.'}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
              <button type="button" onClick={() => setBatchDuplicateReview(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer">Cancel Batch</button>
              <button type="button" disabled={batchSaving} onClick={() => finishBatchDuplicateReview('keep')} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition disabled:opacity-50 cursor-pointer">Keep Both</button>
              <button type="button" disabled={batchSaving} onClick={() => finishBatchDuplicateReview('overwrite')} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition disabled:opacity-50 cursor-pointer">Overwrite Existing</button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}
