import { BackendDataService } from "../services/backend-data.js";

export const getGallery = (_req, res) => {
    try {
        const gallery = BackendDataService.load("choir_gallery.json", []);
        res.json(gallery);
    } catch (error) {
        res.status(500).json({ error: "Failed to load gallery data" });
    }
};

export const uploadToGallery = (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const gallery = BackendDataService.load("choir_gallery.json", []);
        const newPhoto = {
            id: Date.now().toString(),
            filename: req.file.filename,
            eventName: req.body.eventName || "Untitled Event",
            description: req.body.description || "",
            uploadDate: new Date().toISOString(),
            imageUrl: `/images/gallery/${req.file.filename}`,
        };

        gallery.push(newPhoto);
        BackendDataService.save("choir_gallery.json", gallery);
        res.status(201).json(newPhoto);
    } catch (error) {
        res.status(500).json({ error: "Failed to save photo to gallery" });
    }
};
