import { useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import type {
  fileUpload,
  NotificationModalProps,
} from "../../../interface/api";
import { uploadFile } from "../../../api/axiosInstance";
import { useAuth } from "../../../context/AuthContext";

const NotificationModal: React.FC<NotificationModalProps> = ({
  createNotification,
  onClose,
  roles,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"normal" | "urgent">("normal");

  // Initialize postedTo using a clean ternary/logic chain (no return)
  const [postedTo, setPostedTo] = useState(
    roles.includes("CSA_LEADER") && roles.includes("JUMUIA_LEADER")
      ? "csa"
      : roles.includes("CSA_LEADER")
        ? "csa"
        : roles.includes("JUMUIA_LEADER")
          ? "jumuia"
          : "",
  );
  const isFormIncomplete = [title, message].some((field) => !field.trim()); //add this later || postedTo === ""

  //  Handle file selection (NO upload here)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 3 - selectedFiles.length);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  //  Remove preview before upload
  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  //  Upload + create notification (updated only to include posted_to + socket emit)
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
      const results = await createNotification({
        title,
        message,
        images: uploadedImages,
        status,
        posted_to: user?.jumuiya_id ? String(user.jumuiya_id) : "csa", // ensure string
      });
  console.log(results);
      onClose();
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-2 sm:px-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-5"
        >
          {/* Header */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Create Notification and notify your fellow Mebers
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Share updates with your community clearly and quickly
            </p>
          </div>

          {/* {roles.includes("CSA_LEADER") && roles.includes("JUMUIA_LEADER") && ( */}
            <div className="space-y-1 w-full max-w-sm mx-auto">
              <label className="block text-sm font-semibold text-gray-800">
                Post To
              </label>
              <div className="relative">
                <select
                  value={postedTo}
                  onChange={(e) => setPostedTo(e.target.value)}
                  className="appearance-none w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl shadow-md 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                 transition duration-200 ease-in-out hover:border-gray-400"
                >
                  <option value="csa">CSA</option>
                  <option value="jumuia">My Jumuia</option>
                </select>
                {/* Custom arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          {/* )} */}

          {/* {add priority to the message either normal or urgent, this will help us determine how to display
 the message on the client side and also help us determine if we need to send an email notification to the
  members or not, this is important because some notifications may be urgent and require immediate attention 
  while others may be normal and can be checked later,.} */}

          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">
              Priority
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("normal")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition ${
                  status === "normal"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Normal
              </button>

              <button
                type="button"
                onClick={() => setStatus("urgent")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition ${
                  status === "urgent"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-red-50"
                }`}
              >
                Urgent 🚨
              </button>
            </div>
          </div>

          {/* Flex container for Title, Message & Upload */}
          <div className="flex flex-col md:flex-row md:space-x-4 gap-3 sm:gap-4">
            {/* Left: Title & Message */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Water outage scheduled tomorrow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  placeholder="Provide more details... e.g. Water will be unavailable from 8AM to 2PM due to maintenance."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Right: Upload */}
            <div className="flex-1 space-y-2 sm:space-y-3">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Attach Images (optional)
              </label>

              <label
                htmlFor="file-upload"
                className="group flex flex-col items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 border border-dashed border-gray-300 rounded-xl cursor-pointer transition hover:border-blue-500 hover:bg-blue-50"
              >
                <FiUpload className="text-xl sm:text-2xl text-gray-400 group-hover:text-blue-500 transition" />
                <span className="text-xs sm:text-sm text-gray-600 text-center">
                  Click to upload or drag images here
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 text-center">
                  Max 3 images • JPG, PNG
                </span>
              </label>

              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={previews.length >= 3}
              />

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-1 sm:mt-2">
                  {previews.map((src, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={src}
                        alt="preview"
                        className="w-full h-20 sm:h-24 object-cover rounded-lg border"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemovePreview(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {previews.length >= 3 && (
                <p className="text-[10px] sm:text-xs text-red-500">
                  Maximum of 3 images allowed
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isFormIncomplete || isSending}
            className={`w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              isFormIncomplete || isSending
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSending ? "Notifying other members ...." : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationModal;
