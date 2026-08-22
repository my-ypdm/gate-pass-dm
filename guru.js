const API_URL = "URL_DEPLOYMENT_APPS_SCRIPT_KAMU";

window.onload = function() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Keamanan halaman guru
    if (!token || role !== "guru") {
        alert("Akses ditolak!");
        window.location.href = "index.html";
        return;
    }

    // Tampilkan nama guru
    document.getElementById("display-nama-guru").innerText = localStorage.getItem("nama") || "Bapak/Ibu Guru";

    // Muat data rekap
    loadGuruData();
};

async function loadGuruData() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("info-guru-content");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getGuruData", token: token })
        });

        const data = await res.json();
        if (data.status === "success") {
            container.innerHTML = `
                <p><b>Status Kehadiran Sekolah Hari Ini:</b></p>
                <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>Total Siswa Absen Tercatat: <b>${data.summary.totalAbsen}</b> siswa</li>
                </ul>
            `;
        } else {
            container.innerHTML = `<span style="color: red;">Gagal memuat data: ${data.message}</span>`;
        }
    } catch (err) {
        container.innerHTML = `<span style="color: red;">Kesalahan koneksi server.</span>`;
    }
}

function handleLogoutGuru() {
    localStorage.clear();
    window.location.href = "index.html";
}
/**
 * Mengambil Data Rekap untuk Guru
 */
function getGuruData(token) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Validasi token sesi aktif
  var sheetSessions = ss.getSheetByName("Sessions");
  var sessionValid = false;
  var userID = "";
  
  if (sheetSessions) {
    var dataSessions = sheetSessions.getDataRange().getValues();
    for (var i = 1; i < dataSessions.length; i++) {
      if (String(dataSessions[i][0]).trim() === String(token).trim() && dataSessions[i][4] === "Aktif") {
        sessionValid = true;
        userID = dataSessions[i][1];
        break;
      }
    }
  }

  if (!sessionValid) {
    return { status: "error", message: "Sesi telah habis, silakan login ulang." };
  }

  // Ambil data rekap absensi hari ini dari Spreadsheet kamu
  // (Sesuaikan nama tab sheet absensi kamu, misal "RekapHarian" atau "Absensi")
  var sheetAbsensi = ss.getSheetByName("Absensi"); 
  var totalHadir = 0;
  var totalTerlambat = 0;
  var totalSiswaAbsen = 0;

  if (sheetAbsensi) {
    var dataAbsensi = sheetAbsensi.getDataRange().getValues();
    // Lakukan perhitungan atau filter sesuai kebutuhan guru
    // Contoh sederhana menghitung total baris data presensi hari ini
    totalSiswaAbsen = dataAbsensi.length - 1; 
  }

  return {
    status: "success",
    summary: {
      hadir: totalHadir,
      terlambat: totalTerlambat,
      totalAbsen: totalSiswaAbsen
    }
  };
}
