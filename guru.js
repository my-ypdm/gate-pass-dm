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
async function loadGuruJadwal() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("jadwal-container"); // Pastikan elemen ini ada di halaman HTML menu jadwal

    if (!container) return;

    // Bersihkan gaya kotak luar agar menyatu rapi dengan halaman
    container.style.background = "transparent";
    container.style.border = "none";
    container.style.boxShadow = "none";
    container.style.padding = "0";

    container.innerHTML = "<div style='text-align: center; padding: 20px; color: #64748b; font-size: 13px;'>⏳ Memuat seluruh jadwal mengajar...</div>";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getGuruJadwalData", token: token })
        });

        const data = await res.json();

        if (data.status === "success") {
            const jadwal = data.jadwal;

            if (!jadwal || jadwal.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #475569; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <b>📚 Belum Ada Jadwal</b>
                        <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">Belum ada jadwal mengajar yang tercatat di sistem untuk akunmu.</p>
                    </div>
                `;
                return;
            }

            // Kelompokkan jadwal berdasarkan hari
            let groupedJadwal = {};
            jadwal.forEach(item => {
                if (!groupedJadwal[item.hari]) {
                    groupedJadwal[item.hari] = [];
                }
                groupedJadwal[item.hari].push(item);
            });

            let html = `<div style="display: flex; flex-direction: column; gap: 16px;">`;

            for (let hari in groupedJadwal) {
                html += `
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            📌 ${hari}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                `;

                groupedJadwal[hari].forEach(item => {
                    html += `
                        <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; border-left: 5px solid #3b82f6; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">📚 ${item.mapel}</div>
                                <div style="font-size: 12px; color: #475569;">Kelas: <b style="color: #1e293b;">${item.kelas}</b></div>
                            </div>
                            <div style="text-align: right; white-space: nowrap;">
                                <span style="font-size: 12px; font-weight: 600; color: #3b82f6; background: #eff6ff; padding: 4px 8px; border-radius: 6px;">⏰ ${item.jamMulai} - ${item.jamSelesai}</span>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            }

            html += `</div>`;
            container.innerHTML = html;

        } else {
            container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal memuat jadwal: ${data.message}</div>`;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal terhubung ke server! Periksa koneksi internetmu.</div>`;
    }
}
// 1. Load Halaman Awal Absensi Mapel (Menampilkan pilihan Kelas/Jadwal Guru)
// 1. Load Halaman Absensi Mapel (Otomatis mendeteksi jadwal yang sedang berlangsung hari ini)
async function loadAbsensiMapel() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("content-absensi-mapel");

    if (!container) return;

    container.style.background = "transparent";
    container.style.border = "none";
    container.style.boxShadow = "none";
    container.style.padding = "0";

    container.innerHTML = "<div style='text-align: center; padding: 20px; color: #64748b; font-size: 13px;'>⏳ Memeriksa jadwal mengajar yang sedang berlangsung...</div>";

    try {
        // Menggunakan data dashboard guru karena sudah otomatis memfilter jadwal & status berdasarkan jam saat ini
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getGuruDashboardData", token: token })
        });

        const data = await res.json();

        if (data.status === "success") {
            const daftarJadwal = data.daftarJadwal;

            if (!daftarJadwal || daftarJadwal.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #475569; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                        <b>Tidak Ada Jadwal Hari Ini</b>
                        <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">Hari ini (${data.hari}) tidak ada jadwal mengajar tercatat untuk Anda.</p>
                    </div>
                `;
                return;
            }

            // Cari jadwal yang statusnya sedang berlangsung atau segera mulai
            let activeSchedule = daftarJadwal.find(item => item.status === "berlangsung" || item.status === "segera_mulai");

            let html = `
                <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px;">
                    <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">📋 Absensi Siswa per Mata Pelajaran</div>
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 14px;">Hari ini: <b>${data.hari}</b> | Pukul: <b>${data.jamSekarang}</b></p>
            `;

            // Jika ada kelas yang sedang aktif/berlangsung
            if (activeSchedule) {
                html += `
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                        <div style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; margin-bottom: 4px;">✨ Jadwal Aktif Saat Ini</div>
                        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">📚 ${activeSchedule.mapel} - Kelas ${activeSchedule.kelas}</div>
                        <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">⏰ ${activeSchedule.jamMulai} - ${activeSchedule.jamSelesai}</div>
                        <button onclick="fetchStudentsForAttendance('${activeSchedule.kelas}', '${activeSchedule.mapel}')" style="width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Buka Absensi Kelas Ini &rsaquo;</button>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px; text-align: center; color: #64748b; font-size: 12px;">
                        ℹ️ Tidak ada jadwal yang sedang berlangsung pada jam ${data.jamSekarang}. Silakan pilih dari daftar jadwal hari ini di bawah:
                    </div>
                `;
            }

            html += `<div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">Daftar Seluruh Jadwal Hari Ini:</div>`;
            html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;

            daftarJadwal.forEach(item => {
                html += `
                    <button onclick="fetchStudentsForAttendance('${item.kelas}', '${item.mapel}')" style="text-align: left; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">📚 ${item.mapel} - Kelas ${item.kelas}</div>
                            <div style="font-size: 11px; color: #64748b;">⏰ ${item.jamMulai} - ${item.jamSelesai}</div>
                        </div>
                        <span style="font-size: 12px; font-weight: 600; color: #2563eb;">Pilih &rsaquo;</span>
                    </button>
                `;
            });

            html += `</div></div>`;
            container.innerHTML = html;

        } else {
            container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal memuat data: ${data.message}</div>`;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal terhubung ke server!</div>`;
    }
}

// 2. Ambil Daftar Siswa Berdasarkan Kelas yang Dipilih
async function fetchStudentsForAttendance(kelas, mapel) {
    const token = localStorage.getItem("token");
    const container = document.getElementById("content-absensi-mapel");

    container.innerHTML = `<div style='text-align: center; padding: 20px; color: #64748b; font-size: 13px;'>⏳ Memuat data siswa Kelas ${kelas} (${mapel})...</div>`;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "get_students_by_class", token: token, kelas: kelas })
        });

        const data = await res.json();

        if (data.status === "success") {
            const students = data.students;

            if (!students || students.length === 0) {
                container.innerHTML = `
                    <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px; text-align: center;">
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Tidak ada siswa aktif ditemukan di kelas ${kelas}.</p>
                        <button onclick="loadAbsensiMapel()" style="padding: 8px 14px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">← Kembali</button>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">Presensi: ${mapel}</div>
                            <div style="font-size: 12px; color: #64748b;">Kelas: ${kelas} (${students.length} Siswa)</div>
                        </div>
                        <button onclick="loadAbsensiMapel()" style="padding: 6px 10px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; cursor: pointer;">Ganti Kelas</button>
                    </div>

                    <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;" id="student-list-container">
            `;

            students.forEach((s, idx) => {
                html += `
                    <div class="student-row" data-nis="${s.nis}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; gap: 10px;">
                        <div>
                            <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${idx + 1}. ${s.nama}</div>
                            <div style="font-size: 11px; color: #64748b;">NIS: ${s.nis}</div>
                        </div>
                        <select class="status-absen-select" data-nis="${s.nis}" style="padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px; background: white; font-weight: 600; color: #1e293b;">
                            <option value="Hadir" selected>Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Alpha">Alpha</option>
                        </select>
                    </div>
                `;
            });

            html += `
                    </div>
                    <button onclick="submitAbsensiMapel('${mapel}')" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">💾 Simpan Absensi ${mapel}</button>
                </div>
            `;

            container.innerHTML = html;

        } else {
            container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal memuat siswa: ${data.message}</div>`;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="color: #dc2626; font-size: 13px; padding: 10px;">❌ Gagal terhubung ke server!</div>`;
    }
}

// 3. Kirim Data Absensi ke Server Google Apps Script
async function submitAbsensiMapel(mataPelajaran) {
    const token = localStorage.getItem("token");
    const rows = document.querySelectorAll(".student-row");
    let dataAbsensiList = [];

    rows.forEach(row => {
        const nis = row.getAttribute("data-nis");
        const statusSelect = row.querySelector(".status-absen-select");
        const status = statusSelect ? statusSelect.value : "Hadir";

        dataAbsensiList.push({
            nis: nis,
            status: status
        });
    });

    const container = document.getElementById("content-absensi-mapel");
    container.innerHTML = `<div style='text-align: center; padding: 20px; color: #64748b; font-size: 13px;'>⏳ Menyimpan absensi ke database...</div>`;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({
                action: "absensi_mapel",
                token: token,
                mataPelajaran: mataPelajaran,
                dataAbsensiList: dataAbsensiList
            })
        });

        const data = await res.json();

        if (data.status === "success") {
            container.innerHTML = `
                <div style="background: #ffffff; border-radius: 10px; border: 1px solid #bbf7d0; padding: 24px; text-align: center;">
                    <div style="font-size: 28px; margin-bottom: 8px;">✅</div>
                    <div style="font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 4px;">Berhasil Disimpan!</div>
                    <p style="font-size: 12px; color: #15803d; margin-bottom: 16px;">${data.message}</p>
                    <button onclick="loadAbsensiMapel()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">Kembali ke Daftar Kelas</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="background: #ffffff; border-radius: 10px; border: 1px solid #fecaca; padding: 20px; text-align: center;">
                    <div style="font-size: 14px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">Gagal Menyimpan</div>
                    <p style="font-size: 12px; color: #b91c1c; margin-bottom: 12px;">${data.message}</p>
                    <button onclick="loadAbsensiMapel()" style="padding: 8px 14px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">← Kembali</button>
                </div>
            `;
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div style="background: #ffffff; border-radius: 10px; border: 1px solid #fecaca; padding: 20px; text-align: center;">
                <p style="font-size: 12px; color: #b91c1c; margin-bottom: 12px;">Gagal terhubung ke server saat menyimpan absensi.</p>
                <button onclick="loadAbsensiMapel()" style="padding: 8px 14px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">← Kembali</button>
            </div>
        `;
    }
}
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
    localStorage.removeItem("lastStatus"); 
    
    // Arahkan kembali ke halaman login
    window.location.href = "index.html";
}
