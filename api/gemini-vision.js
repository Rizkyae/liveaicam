// api/gemini-vision.js

// [OPSIONAL] Hapus ini jika Anda mengatur variabel lingkungan di Vercel Dashboard
// require('dotenv').config(); // <-- Bisa dipertahankan untuk pengembangan lokal.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ini adalah cara untuk Vercel Serverless Function:
module.exports = async (req, res) => {
    // Ini akan dieksekusi ketika ada permintaan ke /api/gemini-vision
    if (req.method === 'POST') {
        // req.body sudah otomatis diparse oleh Vercel jika Content-Type adalah application/json
        const { image, prompt } = req.body; // Ambil data langsung dari req.body

        if (!image || !prompt) {
            // Mengembalikan error jika data yang dibutuhkan tidak lengkap
            return res.status(400).json({ error: 'Gambar (image) dan prompt diperlukan.' });
        }

        try {
            // Inisialisasi Gemini API (pastikan GEMINI_API_KEY diatur di Vercel Environment Variables)
            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY) {
                // Mengembalikan error jika API Key tidak ditemukan
                return res.status(500).json({ error: "API Key is not configured in Vercel Environment Variables." });
            }

            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Pastikan Anda memproses 'image' dari frontend
            // Asumsi 'image' adalah base64 string dengan atau tanpa prefix "data:image/jpeg;base64,"
            const base64Data = image.split(',')[1] || image; // Hapus prefix jika ada

            const imageParts = [
                {
                    inlineData: {
                        mimeType: "image/jpeg", // <-- Pastikan ini sesuai dengan jenis gambar yang Anda kirim (misal: image/png)
                        data: base64Data
                    }
                }
            ];

            // Tambahkan instruksi eksplisit ke prompt agar AI merespons dalam Bahasa Indonesia
            const promptBahasaIndonesia = `Jawab dalam Bahasa Indonesia dengan gaya bahasa yang santai/gaul, seolah sedang ngobrol sama temen. Gunakan tanda bintang ganda (**) untuk membuat kata atau frasa penting menjadi tebal. ${prompt}`;

            // Panggil API Gemini
            const result = await model.generateContent([promptBahasaIndonesia, ...imageParts]);
            const response = await result.response;
            const text = response.text(); // Ambil teks hasil dari Gemini

            // Kirim respons sukses ke frontend
            res.status(200).json({
                message: 'Success processing with Gemini AI!',
                geminiResponse: text
            });

        } catch (error) {
            console.error('Error in Gemini AI processing:', error);
            // Kirim respons error ke frontend
            res.status(500).json({ error: 'Failed to process with Gemini AI', details: error.message });
        }
    } else {
        // Metode HTTP selain POST tidak diizinkan
        res.status(405).send('Method Not Allowed');
    }
};
