require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json", // 🔹 Path to downloaded JSON
    scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth });

async function uploadToDrive(file, studentId, title) {
    const fileMetadata = {
        name: `${studentId}-${file.originalname}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // 🔹 Drive Folder ID
    };

    const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id, webViewLink, webContentLink",
    });

    // 🔹 Cleanup temp file
    fs.unlinkSync(file.path);

    return response.data; // Returns file ID & links
}

module.exports = { uploadToDrive };
