import { useState } from "react";
import { FiUpload } from "react-icons/fi";
import type { fileUpload, NotificationModalProps } from "../../../interface/api";



const NotificationModal: React.FC<NotificationModalProps> = ({
  createNotification,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<fileUpload[]>([]);
  const [isSending, setIsSending] = useState(false);

  const isFormIncomplete = [title, message].some((field) => !field.trim());




  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Simulate upload logic (replace with actual upload function)
    const uploaded: fileUpload[] = await Promise.all(
      files.map(async (file) => {
        // Replace this with actual upload logic (e.g., Cloudinary)
        const mockUpload: fileUpload = {
          id: Date.now(), // temporary ID
          public_id: file.name.replace(/\.[^/.]+$/, ""), // remove extension
          url: URL.createObjectURL(file), // temporary preview URL
          format: file.type.split("/")[1],
          resource_type: file.type.split("/")[0],
          created_at: new Date().toISOString(),
        };
        return mockUpload;
      })
    );
    setUploadedImages(uploaded);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isFormIncomplete) return;
    setIsSending(true);
    await createNotification({ title, message, images: uploadedImages });
    setIsSending(false);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto space-y-5"
    >
      <h2 className="text-xl font-bold text-gray-800">📣 Create Notification</h2>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <label
        htmlFor="file-upload"
        className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-800"
      >
        <FiUpload className="text-xl" />
        <span>Upload Images</span>
      </label>
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {uploadedImages.length > 0 && (
        <div className="text-sm text-gray-600">
          {uploadedImages.length} image{uploadedImages.length > 1 ? "s" : ""} selected
        </div>
      )}

      <button
        type="submit"
        disabled={isFormIncomplete || isSending}
        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition ${
          isFormIncomplete || isSending
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isSending ? "Sending..." : "Send Notification"}
      </button>
    </form>
  );
};

export default NotificationModal;
