

import express from "express"
import {createFile , deleteFile} from "../../controllers/mediaController.js"
import upload from "../../Configs/multerStorageConfig.js";


const route = express.Router()


// Upload single file (profile image/video)
route.post("/single", upload.single("file"), createFile);

// Upload multiple files (church members, bulk)
route.post("/multiple", upload.array("files", 10), createFile);

// Delete one or many files
route.delete("/", deleteFile);




export default route