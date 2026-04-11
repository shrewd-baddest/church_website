import { useState } from "react";
import { FiUpload, FiX, FiSend } from "react-icons/fi";
import type { fileUpload, NotificationModalProps } from "../../../interface/api";
import { uploadFile } from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";

const NotificationModal: React.FC<NotificationModalProps> = ({ createNotification, onClose, roles }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"normal" | "urgent">("normal");
  const [hasInteractedPriority, setHasInteractedPriority] = useState(false);

  const [postedTo, setPostedTo] = useState(
    roles.includes("CSA_LEADER") ? "csa" : "jumuia"
  );

  const isFormIncomplete = [title, message].some((field) => !field.trim());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - selectedFiles.length);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFormIncomplete) return;
    setIsSending(true);
    let uploadedImages: fileUpload[] = [];
    try {
      if (selectedFiles.length > 0) {
        const res = await uploadFile(selectedFiles);
        uploadedImages = res.data.data;
      }
      await createNotification({
        title,
        message,
        images: uploadedImages,
        status,
        posted_to: postedTo === "jumuia" ? String(user?.jumuiya_id) : "csa",
      });
      onClose();
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto scrollbar-hide p-4">
      <div className="relative bg-white w-full max-w-4xl h-auto rounded-3xl border-none animate-in scale-in duration-500 select-none shadow-2xl">
        
        {/* Simple Close */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50">
          <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm">
            <FiX className="text-xl sm:text-xl" />
          </button>
        </div>

        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
              {/* LEFT COLUMN: Specify & Title */}
              <div className="flex-1 space-y-6">
                  {/* Destination Segment */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Choose where to send the message</label>
                    <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                      <button 
                        type="button" 
                        onClick={() => setPostedTo('csa')} 
                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${postedTo === 'csa' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        CSA
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPostedTo('jumuia')} 
                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${postedTo === 'jumuia' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Jumuia
                      </button>
                    </div>
                  </div>

                  {/* Priority Segment */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Choose the priority of the message</label>
                    <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                      <button 
                        type="button" 
                        onClick={() => { setStatus('normal'); setHasInteractedPriority(true); }} 
                        className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'normal' ? 'bg-black text-white shadow-md shadow-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Normal
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setStatus('urgent'); setHasInteractedPriority(true); }} 
                        className={`relative flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${status === 'urgent' ? 'bg-red-500 text-white shadow-md shadow-red-100' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Urgent
                        {!hasInteractedPriority && status !== 'urgent' && (
                          <div className="absolute -top-8 right-1/2 translate-x-1/2 flex flex-col items-center animate-bounce text-red-500 z-50 pointer-events-none">
                            <span className="text-[8px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap shadow-sm border border-red-100">Toggle</span>
                            <svg className="w-3 h-3 text-red-300 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Subject Headline</label>
                    <input
                      type="text"
                      placeholder="e.g., Charity Walk"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-blue-50/20 border-2 border-transparent rounded-2xl px-5 py-3 text-sm font-bold text-gray-950 placeholder:text-gray-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    />
                  </div>
              </div>

              {/* RIGHT COLUMN: Message & Media */}
              <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Content</label>
                    <textarea
                      placeholder="e.g., Meet at 7:00am at the church main gate..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="w-full bg-blue-50/20 border-2 border-transparent rounded-2xl px-5 py-3 text-sm font-bold text-gray-950 placeholder:text-gray-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                    />
                  </div>

                  {/* Media Assets */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Attachments ({previews.length}/3)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:flex gap-2">
                        <label className={`aspect-square w-full sm:w-16 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-1 text-gray-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${previews.length >= 3 ? 'hidden' : ''}`}>
                          <FiUpload className="text-lg" />
                          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>

                        {previews.map((src, index) => (
                          <div key={index} className="relative aspect-square w-full sm:w-16 rounded-2xl overflow-hidden group shadow-sm border border-gray-50">
                              <img src={src} alt="p" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                              <button
                                type="button"
                                onClick={() => handleRemovePreview(index)}
                                className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX className="text-lg" />
                              </button>
                          </div>
                        ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* 4. Final Action */}
            <div className="pt-2 border-t border-gray-50">
              <button
                 type="submit"
                 disabled={isFormIncomplete || isSending}
                 className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.4em] transition-all ${isFormIncomplete || isSending ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98] shadow-lg shadow-gray-100'}`}
              >
                 {isSending ? "Syncing..." : "Send Notification"} { !isSending && <FiSend className="text-xl" /> }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
