const API_URL = "https://script.google.com/macros/s/AKfycbygH0NIBVryILT42wx0hOytzA1R1mxtsCffoKaFaRwSwXkSyN50zbBlpoWqLTCF03bx/exec"; 

let html5QrCode = null;
let selectedKodeStatus = "H";
let stats = { hadir: 0, telat: 0, total: 0 };
let scannedBarcodeCache = "";

window.onload = function() {
    startClock();
    const token = localStorage.getItem("token");
    if (token) {
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

function setStatusMode(code) {
    selectedKodeStatus = code;
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.getAttribute('data-code') === code) {
            btn.classList.add('active');
        }
    });
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
            localStorage.setItem("token", data.token);
            localStorage.setItem("nama", data.nama);
            document.getElementById("display-nama").innerText = data.nama;
            showDashboardScreen();
        } else {
            alert("Login gagal: " + data.message);
        }
    } catch (err) {
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

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "getStudent", token: token, barcode: decodedText })
        });

        const data = await res.json();
        if (data.status === "success") {
            scannedBarcodeCache = decodedText; 
            
            document.getElementById("prev-nama").innerText = data.student.nama;
            document.getElementById("prev-kelas").innerText = data.student.kelas + " (" + data.student.jenjang + ")";
            document.getElementById("prev-nis").innerText = data.student.nis;
            document.getElementById("prev-status").innerText = selectedKodeStatus;

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
                kodeStatus: selectedKodeStatus 
            })
        });

        const data = await res.json();
        
        if (data.status === "success") {
            alert(data.message);
            location.reload();
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
    location.reload();
}
