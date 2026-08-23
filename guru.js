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

            const jadwalList = data.daftarJadwal;

            if (!jadwalList || jadwalList.length === 0) {
                smartBox.innerHTML = `
                    <div style="text-align: center; padding: 10px; color: #475569;">
                        <b>☕ Tidak Ada Jadwal Mengajar Hari Ini</b>
                        <p style="margin: 4px 0 0 0; font-size: 12px;">Hari ini hari ${data.hari} (${data.jamSekarang}), tidak tercatat jadwal aktif di sistem untukmu.</p>
                    </div>
                `;
                return;
            }

            // Render kartu-kartu jadwal hari ini dengan warna yang diminta
            let htmlCards = `<div style="margin-bottom: 10px; font-weight: 600; color: #1e3a8a;">📅 Jadwal Mengajar Hari Ini (${data.hari}, Pukul ${data.jamSekarang}):</div>`;
            htmlCards += `<div style="display: flex; flex-direction: column; gap: 10px;">`;

            jadwalList.forEach(item => {
                let badgeStyle = "";
                let badgeText = "";
                let cardBorder = "";

                if (item.status === "berlangsung" || item.status === "segera_mulai") {
                    // KUNING: Sedang Berlangsung / Segera Mulai
                    badgeStyle = "background: #eab308; color: #ffffff;";
                    badgeText = item.status === "berlangsung" ? "🔔 Sedang Berlangsung" : "⚠️ Segera Mulai (5 Menit Lagi)";
                    cardBorder = "border: 2px solid #eab308; background: #fefce8;";
                } else if (item.status === "akan_datang") {
                    // BIRU: Akan Datang
                    badgeStyle = "background: #3b82f6; color: #ffffff;";
                    badgeText = "⏳ Akan Datang";
                    cardBorder = "border: 1px solid #bfdbfe; background: #eff6ff;";
                } else if (item.status === "selesai") {
                    // HIJAU: Selesai
                    badgeStyle = "background: #22c55e; color: #ffffff;";
                    badgeText = "✔️ Selesai";
                    cardBorder = "border: 1px solid #bbf7d0; background: #f0fdf4; opacity: 0.85;";
                }

                htmlCards += `
                    <div style="${cardBorder} border-radius: 8px; padding: 12px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; ${badgeStyle}">${badgeText}</span>
                            <span style="font-weight: 600; color: #334155;">⏰ ${item.jamMulai} - ${item.jamSelesai}</span>
                        </div>
                        <div style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 2px;">📚 ${item.mapel}</div>
                        <div style="color: #475569; margin-bottom: 6px;">🏫 Kelas: <b>${item.kelas}</b></div>
                        <div style="font-size: 12px; color: #334155; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px;">
                            📊 Absensi Piket Kelas Ini: Hadir: <b>${item.rekap.hadir}</b> | Terlambat: <b>${item.rekap.terlambat}</b> | Total Masuk: <b>${item.rekap.totalAbsen}</b>
                        </div>
                    </div>
                `;
            });

            htmlCards += `</div>`;
            smartBox.innerHTML = htmlCards;

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
