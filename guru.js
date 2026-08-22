// Gunakan URL Web App Google Apps Script kamu yang sama
const API_URL = "https://script.google.com/macros/s/AKfycbygH0NIBVryILT42wx0hOytzA1R1mxtsCffoKaFaRwSwXkSyN50zbBlpoWqLTCF03bx/exec"; 

window.onload = function() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Validasi keamanan sederhana di sisi klien
    if (!token || role !== "guru") {
        window.location.href = "index.html"; // Lempar kembali ke login jika bukan guru
        return;
    }

    // Panggil fungsi utama dashboard guru
    loadGuruDashboard();
};

async function loadGuruDashboard() {
    const token = localStorage.getItem("token");
    const smartBox = document.getElementById("smart-schedule-box");

    if (!smartBox) return;

    smartBox.innerHTML = "⏳ Memeriksa jadwal dan data absensi piket hari ini...";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getGuruDashboardData", token: token })
        });

        const data = await res.json();

        if (data.status === "success") {
            // Tampilkan nama guru di header
            document.getElementById("display-nama-guru").innerText = data.namaGuru || "Bapak/Ibu Guru";

            // Cek apakah guru sedang mengajar jam ini
            if (data.mengajarSekarang) {
                const jadwal = data.jadwalAktif;
                const rekap = data.rekapKelas;

                smartBox.innerHTML = `
                    <div style="margin-bottom: 6px; color: #1e40af;"><b>🔔 Sedang Berlangsung (${jadwal.jamMulai} - ${jadwal.jamSelesai})</b></div>
                    <p style="margin: 0 0 8px 0; font-size: 13px;">Kamu mengajar mata pelajaran <b>${jadwal.mapel}</b> di kelas <b>${jadwal.kelas}</b>.</p>
                    <hr style="border: 0; border-top: 1px solid #bfdbfe; margin: 8px 0;">
                    <div style="font-size: 12px; color: #1e3a8a; line-height: 1.4;">
                        📊 <b>Rekap Absensi Piket Hari Ini di Kelas Ini:</b><br>
                        - Hadir Tepat Waktu: <b>${rekap.hadir}</b> siswa<br>
                        - Terlambat: <b>${rekap.terlambat}</b> siswa<br>
                        - Total Masuk Tercatat: <b>${rekap.totalAbsen}</b> siswa
                    </div>
                `;
            } else {
                // Jika saat ini di luar jam mengajar
                smartBox.innerHTML = `
                    <b>☕ Tidak Ada Jadwal Mengajar Saat Ini</b>
                    <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">Saat ini pukul ${data.jamSekarang} (${data.hari}), tidak tercatat jadwal aktif di sistem untukmu.</p>
                `;
            }
        } else {
            smartBox.innerHTML = `❌ Gagal memuat data: ${data.message}`;
        }
    } catch (err) {
        console.error(err);
        smartBox.innerHTML = `❌ Gagal terhubung ke server! Periksa koneksi internetmu.`;
    }
}

// Fungsi Keluar / Logout khusus Guru
async function handleLogoutGuru() {
    const token = localStorage.getItem("token");
    
    if (token) {
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "logout", token: token })
            });
        } catch (err) {
            console.error("Gagal menghubungi server saat logout", err);
        }
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("nama");
    localStorage.removeItem("role");
    
    window.location.href = "index.html";
}
