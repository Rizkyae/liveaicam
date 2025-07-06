// app.js

const video = document.getElementById('webcamVideo');
const canvas = document.getElementById('hiddenCanvas');
const context = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const captureButton = document.getElementById('captureButton'); // Mengaktifkan kembali tombol ini
const stopButton = document.getElementById('stopButton'); // Tombol Hentikan Podcast AI
const responseDiv = document.getElementById('response');

let stream; // Untuk menyimpan stream dari webcam
let synth = window.speechSynthesis; // Web Speech API untuk Text-to-Speech

// Fungsi untuk memilih suara laki-laki (umur tidak bisa spesifik, tapi kita bisa coba filter)
function getMaleVoice() {
    let voices = synth.getVoices();
    // Coba temukan suara yang terkesan 'male' atau 'young' dari bahasa Indonesia atau Inggris
    // Ini mungkin berbeda di setiap browser/OS
    let maleVoice = voices.find(voice => 
        (voice.lang === 'id-ID' || voice.lang.startsWith('en-')) && 
        (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('young') || 
         voice.name.toLowerCase().includes('indonesia male') || voice.name.toLowerCase().includes('male'))
    );
    // Jika tidak ditemukan suara 'male' spesifik, coba suara yang tidak spesifik gender
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'id-ID'); // Coba suara Indonesia default
    }
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.default); // Coba suara default browser
    }
    return maleVoice;
}

// --- Fungsi untuk Memulai Webcam dan Mikrofon ---
startButton.addEventListener('click', async () => {
    try {
        // Meminta akses video DAN audio
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        video.play();
        startButton.disabled = true;
        captureButton.disabled = false; // Aktifkan kembali tombol capture
        stopButton.disabled = false; // Aktifkan tombol stop
        responseDiv.innerHTML = '<p>Webcam dan Mikrofon aktif. Klik "Ambil Gambar & Kirim ke AI" untuk berinteraksi.</p>';
    } catch (err) {
        console.error('Gagal mengakses webcam atau mikrofon: ', err);
        responseDiv.innerHTML = '<p style="color: red;">Gagal mengakses webcam atau mikrofon. Pastikan Anda memberikan izin.</p>';
        captureButton.disabled = true;
        stopButton.disabled = true;
    }
});

// --- Fungsi untuk Menghentikan Webcam dan Mikrofon ---
stopButton.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Hentikan semua track (video dan audio)
        video.srcObject = null; // Kosongkan sumber video
        startButton.disabled = false; // Aktifkan kembali tombol start
        captureButton.disabled = true; // Nonaktifkan tombol capture
        stopButton.disabled = true; // Nonaktifkan tombol stop
        responseDiv.innerHTML = '<p>Webcam dan Mikrofon nonaktif.</p>';
    }
});

// --- Fungsi untuk Mengambil Gambar dan Mengirim ke Server ---
captureButton.addEventListener('click', async () => {
    if (!stream) {
        responseDiv.innerHTML = '<p style="color: red;">Webcam belum aktif. Silakan mulai webcam terlebih dahulu.</p>';
        return;
    }

    // Pastikan ukuran canvas sesuai dengan video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Gambar frame dari video ke canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Dapatkan data gambar dalam format base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Hapus awalan 'data:image/jpeg;base64,'
    const base64Data = imageData.split(',')[1];

    responseDiv.innerHTML = '<p class="loading">Mengirim gambar ke AI... Mohon tunggu.</p>';
    captureButton.disabled = true; // Nonaktifkan tombol saat memproses

    try {
        const serverEndpoint = 'http://localhost:3000/gemini-vision'; // Pastikan ini benar

        const res = await fetch(serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Data,
                prompt: "Jelaskan apa yang Anda lihat di gambar ini secara detail."
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Kesalahan server: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        // Pastikan 'data.text' ada dan merupakan string
        if (data && typeof data.text === 'string') {
            const aiResponseText = data.text;
            responseDiv.innerHTML = `<h3>Respons RIZKY AI:</h3><p>${aiResponseText}</p>`;

            // --- Fitur Text-to-Speech ---
            const utterance = new SpeechSynthesisUtterance(aiResponseText);
            const selectedVoice = getMaleVoice(); // Dapatkan suara laki-laki
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            utterance.lang = 'id-ID'; // Set bahasa ke Bahasa Indonesia
            synth.speak(utterance);

        } else {
            responseDiv.innerHTML = `<p style="color: red;">Respons AI tidak dalam format yang diharapkan.</p>`;
            console.error("Respon AI tidak valid:", data);
        }

    } catch (error) {
        console.error('Kesalahan saat mengirim ke RISKI AI:', error);
        responseDiv.innerHTML = `<p style="color: red;">Terjadi kesalahan: ${error.message}</p>`;
    } finally {
        captureButton.disabled = false; // Aktifkan kembali tombol
    }
});

// Pastikan tombol stop ada saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Buat tombol stop jika belum ada di HTML
    let existingStopButton = document.getElementById('stopButton');
    if (!existingStopButton) {
        const newStopButton = document.createElement('button');
        newStopButton.id = 'stopButton';
        newStopButton.textContent = 'Hentikan Podcast AI';
        newStopButton.disabled = true; // Awalnya nonaktif
        // Masukkan tombol ini ke dalam DOM, contoh: setelah startButton
        startButton.parentNode.insertBefore(newStopButton, startButton.nextSibling);
    }
    // Dapatkan referensi setelah DOM dimuat (jika dibuat dinamis)
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn) { // Pastikan tombol stopBtn ada sebelum menambahkan event listener
        stopBtn.addEventListener('click', () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
                startButton.disabled = false;
                captureButton.disabled = true;
                stopBtn.disabled = true;
                responseDiv.innerHTML = '<p>Webcam dan Mikrofon nonaktif.</p>';
            }
        });
    }
});