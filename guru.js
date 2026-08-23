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

    // Menghilangkan kotak/card biru di luar agar tampilannya rata dengan halaman
    smartBox.style.background = "transparent";
    smartBox.style.border = "none";
    smartBox.style.boxShadow = "none";
    smartBox.style.padding = "0";

    smartBox.innerHTML = "<div style='text-align: center; padding: 20px; color: #64748b; font-size: 13px;'>⏳ Memeriksa jadwal dan data absensi piket hari ini...</div>";

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
                    <div style="text-align: center; padding: 16px; color: #475569; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <b>Tidak Ada Jadwal Mengajar Hari Ini</b>
                        <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">Hari ini hari ${data.hari} (${data.jamSekarang}), tidak tercatat jadwal aktif di sistem untukmu.</p>
                    </div>
                `;
                return;
            }

            // Render judul dan daftar kartu jadwal tanpa kotak luar
            let htmlCards = `<div style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #1e293b; display: flex; justify-content: space-between; align-items: center;">
                <span>Jadwal Hari Ini (${data.hari})</span>
                <span style="font-size: 12px; color: #64748b; font-weight: normal; white-space: nowrap;">Pukul ${data.jamSekarang}</span>
            </div>`;
            htmlCards += `<div style="display: flex; flex-direction: column; gap: 12px;">`;

            jadwalList.forEach(item => {
                let badgeBg = "";
                let badgeText = "";
                let leftBorderColor = "";

                if (item.status === "berlangsung") {
                    badgeBg = "#8b5cf6"; // Ungu
                    badgeText = "Sedang Berlangsung";
                    leftBorderColor = "#8b5cf6";
                } else if (item.status === "segera_mulai") {
                    badgeBg = "#f97316"; // Oranye
                    badgeText = "Segera Mulai";
                    leftBorderColor = "#f97316";
                } else if (item.status === "akan_datang") {
                    badgeBg = "#3b82f6"; // Biru
                    badgeText = "Akan Datang";
                    leftBorderColor = "#3b82f6";
                } else if (item.status === "selesai") {
                    badgeBg = "#22c55e"; // Hijau
                    badgeText = "✔️ Selesai";
                    leftBorderColor = "#22c55e";
                }

                htmlCards += `
                    <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; border-left: 5px solid ${leftBorderColor}; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 6px;">
                            <span style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 20px; background: ${badgeBg}; color: #ffffff; white-space: nowrap;">${badgeText}</span>
                            <span style="font-size: 12px; font-weight: 600; color: #475569; white-space: nowrap;">⏰ ${item.jamMulai} - ${item.jamSelesai}</span>
                        </div>
                        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">📚 ${item.mapel}</div>
                        <div style="font-size: 13px; color: #475569; margin-bottom: 10px;">Kelas: <b style="color: #1e293b;">${item.kelas}</b></div>
                        
                        <!-- Rekap Absensi Piket -->
                        <div style="font-size: 12px; color: #475569; background: #f8fafc; border-radius: 6px; padding: 8px 10px; border: 1px solid #f1f5f9;">
                            <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">📊 Absensi Piket Kelas:</div>
                            <div style="display: flex; justify-content: space-between; color: #475569; font-weight: 500;">
                                <span>Hadir: <b style="color: #16a34a;">${item.rekap.hadir}</b></span>
                                <span>Terlambat: <b style="color: #d97706;">${item.rekap.terlambat}</b></span>
                                <span>Total: <b style="color: #0f172a;">${item.rekap.totalAbsen}</b></span>
                            </div>
                        </div>
                    </div>
                `;
            });

            htmlCards += `</div>`;
            smartBox.innerHTML = htmlCards;

        } else {
            smartBox.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal memuat data: ${data.message}</div>`;
        }
    } catch (err) {
        console.error(err);
        smartBox.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal terhubung ke server! Periksa koneksi internetmu.</div>`;
    }
}
