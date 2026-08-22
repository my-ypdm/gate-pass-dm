const API_URL = "https://script.google.com/macros/s/AKfycbygH0NIBVryILT42wx0hOytzA1R1mxtsCffoKaFaRwSwXkSyN50zbBlpoWqLTCF03bx/exec"; 

let html5QrCode = null;
let selectedKodeStatus = localStorage.getItem("lastStatus") || "H";
let confirmedStatusCode = localStorage.getItem("lastStatus") || "H"; 
let stats = { hadir: 0, telat: 0, total: 0 };
let scannedBarcodeCache = "";

window.onload = function() {
    startClock();
    
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

   
    if (token) {
        
        if (role === "guru") {
            window.location.href = "guru.html";
            return;
        }

        // Jika petugas piket, muat status terakhir dari localStorage
        const savedStatus = localStorage.getItem("lastStatus");
        if (savedStatus) {
            selectedKodeStatus = savedStatus;
            confirmedStatusCode = savedStatus;
            const dropdown = document.getElementById("status-select");
            if (dropdown) {
                dropdown.value = savedStatus;
            }
        }

        // Tampilkan nama petugas piket dan masuk ke dashboard
        document.getElementById("display-nama").innerText = localStorage.getItem("nama") || "Petugas Piket";
        showDashboardScreen();
    }
};

function startClock() {
    setInterval(() => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById("live-clock").innerText = `${now.toLocaleDateString('id-ID', options)} | ${now.toLocaleTimeString('id-ID')}`;
    }, 1000);
}

async function handleLogin() {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const btn = document.getElementById("btn-login");

    if (!u || !p) return alert("Isi username dan password!");

    btn.disabled = true;
    btn.innerText = "Memproses...";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "login", username: u, password: p })
        });
        
        const data = await res.json();
        if (data.status === "success") {
            // Simpan data sesi ke localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("nama", data.nama);
            localStorage.setItem("role", data.role); 
            
            // CEK ROLE: 
            if (data.role === "guru") {
                window.location.href = "guru.html"; 
                return; 

            // --- JIKA PETUGAS PIKET, JALANKAN ALUR BIASA ---
            localStorage.removeItem("lastStatus");
            selectedKodeStatus = "H";
            confirmedStatusCode = "H";
            const dropdown = document.getElementById("status-select");
            if (dropdown) {
                dropdown.value = "H";
            }

            document.getElementById("display-nama").innerText = data.nama;
            showDashboardScreen();
        } else {
            alert("Login gagal: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Gagal koneksi ke server!");
    } finally {
        btn.disabled = false;
        btn.innerText = "Masuk Terminal";
    }
}

function showDashboardScreen() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    loadStatsFromSheet();
    startBackCameraScanner();
}

function onStatusDropdownChange(selectElement) {
    selectedKodeStatus = selectElement.value;
    confirmedStatusCode = selectElement.value;
    localStorage.setItem("lastStatus", selectedKodeStatus); 
}

function resetToDashboardAfterSubmit() {
    document.getElementById("preview-card").style.display = "none";
    document.getElementById("scanner-container").style.display = "block";
    
    const msgBox = document.getElementById("message");
    msgBox.style.display = "none";
    msgBox.className = "";

    scannedBarcodeCache = "";
    isProcessing = false;

    loadStatsFromSheet();
    
    const savedStatus = localStorage.getItem("lastStatus");
    if (savedStatus) {
        confirmedStatusCode = savedStatus;
        selectedKodeStatus = savedStatus;
        const dropdown = document.getElementById("status-select");
        if (dropdown) {
            dropdown.value = savedStatus;
        }
    }
}

async function loadStatsFromSheet() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getStats", token: token })
        });
        const data = await res.json();

        if (data.status === "success") {
            stats.hadir = data.hadir;
            stats.telat = data.telat;
            stats.total = data.total;
            document.getElementById("count-hadir").innerText = stats.hadir;
            document.getElementById("count-telat").innerText = stats.telat;
            document.getElementById("count-total").innerText = stats.total;
        }
    } catch (err) {
        console.error("Gagal memuat statistik:", err);
    }
}

function startBackCameraScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess).catch(() => {
        html5QrCode.start({ facingMode: "user" }, config, onScanSuccess);
    });
}

let isProcessing = false;

async function onScanSuccess(decodedText) {
    if (isProcessing) return;
    isProcessing = true;

    const msgBox = document.getElementById("message");
    msgBox.style.display = "block";
    msgBox.className = "";
    msgBox.innerText = "⏳ Memeriksa barcode: " + decodedText + "...";

    const token = localStorage.getItem("token");
    const statusSelect = document.getElementById("status-select");
    confirmedStatusCode = statusSelect ? statusSelect.value : "H";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getStudent", token: token, barcode: decodedText })
        });

        const data = await res.json();
        if (data.status === "success") {
            scannedBarcodeCache = decodedText; 
            
            const statusLabels = {
                "H": "Hadir Tepat Waktu",
                "T1": "Terlambat Ringan",
                "T2": "Terlambat Sedang",
                "T3": "Terlambat Berat"
            };

            document.getElementById("prev-nama").innerText = data.student.nama;
            document.getElementById("prev-kelas").innerText = data.student.kelas + " (" + data.student.jenjang + ")";
            document.getElementById("prev-nis").innerText = data.student.nis;
            
            document.getElementById("prev-status").innerText = statusLabels[confirmedStatusCode] || confirmedStatusCode;

            document.getElementById("scanner-container").style.display = "none";
            document.getElementById("preview-card").style.display = "block";
            msgBox.style.display = "none";
        } else {
            msgBox.className = "error";
            msgBox.innerText = "❌ " + data.message;
            setTimeout(() => { isProcessing = false; }, 2000);
        }
    } catch (err) {
        msgBox.className = "error";
        msgBox.innerText = "❌ Gagal terhubung ke server!";
        setTimeout(() => { isProcessing = false; }, 2000);
    }
}

async function submitAbsensi() {
    const token = localStorage.getItem("token");
    const msgBox = document.getElementById("message");
    
    msgBox.style.display = "block";
    msgBox.className = "";
    msgBox.innerText = "⏳ Menyimpan presensi...";

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ 
                action: "absensi", 
                token: token, 
                barcode: scannedBarcodeCache,
                kodeStatus: confirmedStatusCode 
            })
        });

        const data = await res.json();
        
        if (data.status === "success") {
            localStorage.setItem("lastStatus", confirmedStatusCode);
            alert(data.message);
            resetToDashboardAfterSubmit();
        } else {
            msgBox.className = "error";
            msgBox.innerText = "❌ " + data.message;
            isProcessing = false;
        }
    } catch (err) {
        msgBox.className = "error";
        msgBox.innerText = "❌ Gagal menyimpan ke Spreadsheet!";
        isProcessing = false;
    }
}

function cancelPreview() {
    const msgBox = document.getElementById("message");
    msgBox.style.display = "none";
    resetScannerState();
}

function resetScannerState() {
    scannedBarcodeCache = "";
    document.getElementById("preview-card").style.display = "none";
    document.getElementById("scanner-container").style.display = "block";
    setTimeout(() => { isProcessing = false; }, 1000);
}

// 📱 FUNGSI KONTROL SIDEBAR (MENU SAMPING)
function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.style.left === '0px') {
        sidebar.style.left = '-280px';
        overlay.style.display = 'none';
    } else {
        sidebar.style.left = '0px';
        overlay.style.display = 'block';
    }
}

function selectSidebarMenu(menuType) {
    const pageScan = document.getElementById('page-scan-content');
    const pageStat = document.getElementById('page-statistik-content');

    // Tutup laci sidebar secara otomatis saat menu diklik
    toggleSidebar();

    if (menuType === 'scan') {
        pageScan.style.display = 'flex';
        pageStat.style.display = 'none';
    } else if (menuType === 'statistik') {
        pageScan.style.display = 'none';
        pageStat.style.display = 'flex';
        
        // Nanti fungsi ambil data statistik bulanan/harian gabungan ditaruh di sini
    }
}

async function handleLogout() {
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
    
    location.reload();
}
