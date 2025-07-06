// server.js
require('dotenv').config(); // Untuk memuat variabel lingkungan dari .env
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors'); // Untuk mengizinkan permintaan dari browser

const app = express();
const port = 3000; // Port untuk server backend Anda

// --- Konfigurasi Middleware ---
app.use(cors()); // Izinkan semua CORS untuk pengembangan. Di produksi, batasi domain yang diizinkan.
app.use(express.json({ limit: '50mb' })); // Batasi ukuran payload JSON, karena gambar bisa besar

// --- Inisialisasi Gemini API ---
const API_KEY = process.env.GEMINI_API_KEY; // Ambil API Key dari variabel lingkungan
if (!API_KEY) {
    console.error("Kesalahan: Variabel lingkungan GEMINI_API_KEY tidak ditemukan.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);

// --- Endpoint untuk Memproses Gambar dengan Gemini Vision ---
app.post('/gemini-vision', async (req, res) => {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
        return res.status(400).json({ error: 'Gambar dan prompt diperlukan.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --- Perubahan Penting di Sini ---
        // Menambahkan instruksi eksplisit ke prompt agar AI merespons dalam Bahasa Indonesia
        const promptBahasaIndonesia = `${prompt} Jawab dalam Bahasa Indonesia.`; 
        
        const result = await model.generateContent([
            promptBahasaIndonesia, // Gunakan prompt yang sudah dimodifikasi
            { inlineData: { mimeType: "image/jpeg", data: image } }
        ]);

        const response = await result.response;
        const text = response.text();
        res.json({ text });

    } catch (error) {
        console.error('Kesalahan saat memanggil Gemini API:', error);
        res.status(500).json({ error: 'Gagal memproses permintaan dengan RISKI AI.', details: error.message });
    }
});

// --- Mulai Server ---
app.listen(port, () => {
    console.log(`Server backend berjalan di http://localhost:${port}`);
    console.log(`Pastikan Anda memiliki file .env dengan GEMINI_API_KEY Anda.`);
});