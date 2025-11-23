/* script.js */

// --- Helper Functions ---
const getEl = (id) => document.getElementById(id);
const getLS = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setLS = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

// --- Sidebar Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const closeBtn = document.querySelector('.sidebar-close');

    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if(hamburger) hamburger.addEventListener('click', toggleMenu);
    if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);

    // Highlight Active Menu
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar a');
    links.forEach(link => {
        if(link.getAttribute('href') === page) link.classList.add('active');
    });

    // Initialize Pages
    if (getEl('form-nasabah')) initNasabahForm();
    if (getEl('tabel-nasabah')) loadNasabahTable();
    if (getEl('form-pinjaman')) initPinjamanForm();
    if (getEl('grid-pinjaman')) loadPinjamanCards();
    if (getEl('form-pembayaran')) initPembayaran();
    if (getEl('tabel-tabungan')) loadTabungan();
    if (getEl('dashboard-saldo')) loadSaldo();
    if (getEl('tabel-bukti')) loadBukti();
});

// --- 1. Nasabah Logic ---
function initNasabahForm() {
    getEl('form-nasabah').addEventListener('submit', (e) => {
        e.preventDefault();
        const nasabah = getLS('nasabah');
        const newData = {
            id: Date.now(),
            nama: getEl('nama').value,
            usaha: getEl('usaha').value,
            tempat: getEl('tempat').value,
            alamat: getEl('alamat').value,
            hp: getEl('hp').value,
        };
        nasabah.push(newData);
        setLS('nasabah', nasabah);
        
        // Inisialisasi tabungan awal 0
        let tabungan = getLS('tabungan');
        tabungan.push({ idNasabah: newData.id, nama: newData.nama, total: 0 });
        setLS('tabungan', tabungan);

        alert('Nasabah berhasil ditambahkan!');
        window.location.href = 'index.html';
    });
}

function loadNasabahTable() {
    const tbody = getEl('tabel-nasabah').querySelector('tbody');
    const search = getEl('search-nasabah');
    let data = getLS('nasabah');

    function render(items) {
        tbody.innerHTML = '';
        items.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.nama}</td>
                    <td>${item.usaha}</td>
                    <td>${item.hp}</td>
                    <td>${item.alamat}</td>
                    <td>
                        <button class="action-btn delete" onclick="hapusNasabah(${item.id})">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }

    render(data);
    search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = data.filter(x => x.nama.toLowerCase().includes(term));
        render(filtered);
    });
}

window.hapusNasabah = (id) => {
    if(confirm('Hapus nasabah ini?')) {
        let data = getLS('nasabah').filter(x => x.id !== id);
        setLS('nasabah', data);
        location.reload();
    }
};

// --- 2. Pinjaman Logic ---
function initPinjamanForm() {
    // Populate Select Nasabah
    const select = getEl('nama_nasabah');
    const nasabah = getLS('nasabah');
    nasabah.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n.nama; // Menggunakan Nama sebagai value utama untuk simplifikasi
        opt.dataset.id = n.id;
        opt.text = n.nama;
        select.appendChild(opt);
    });

    // Auto Calculations
    const inputs = ['pokok', 'jasa_persen', 'jumlah_angsuran', 'tabungan_persen', 'admin_persen'];
    inputs.forEach(id => getEl(id).addEventListener('input', calculatePinjaman));

    function calculatePinjaman() {
        const pokok = parseFloat(getEl('pokok').value) || 0;
        const jasaP = parseFloat(getEl('jasa_persen').value) || 0;
        const tenor = parseFloat(getEl('jumlah_angsuran').value) || 1;
        const tabunganP = parseFloat(getEl('tabungan_persen').value) || 0;
        const adminP = parseFloat(getEl('admin_persen').value) || 0;

        const nilaiJasa = pokok * (jasaP / 100);
        const totalBayar = pokok + nilaiJasa;
        const cicilan = totalBayar / tenor;
        
        const nilaiTabungan = pokok * (tabunganP / 100);
        const nilaiAdmin = pokok * (adminP / 100);
        const diterima = pokok - nilaiTabungan - nilaiAdmin;

        getEl('jumlah_dibayar').value = totalBayar; // Hidden input or readonly
        getEl('display_jumlah_dibayar').value = formatRupiah(totalBayar);
        
        getEl('nominal_cicilan').value = cicilan;
        getEl('display_cicilan').value = formatRupiah(cicilan);

        getEl('uang_diterima').value = diterima;
        getEl('display_diterima').value = formatRupiah(diterima);
        
        // Simpan nilai tabungan & admin sementara di atribut dataset form
        getEl('form-pinjaman').dataset.nilaiTabungan = nilaiTabungan;
        getEl('form-pinjaman').dataset.nilaiAdmin = nilaiAdmin;
    }

    getEl('form-pinjaman').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const nasabahSelect = getEl('nama_nasabah');
        const nasabahId = nasabahSelect.options[nasabahSelect.selectedIndex].dataset.id;

        const newPinjaman = {
            id: Date.now(),
            nasabahId: nasabahId,
            nama: getEl('nama_nasabah').value,
            tanggal: getEl('tanggal').value,
            ke: getEl('pinjaman_ke').value,
            pokok: parseFloat(getEl('pokok').value),
            total_tagihan: parseFloat(getEl('jumlah_dibayar').value),
            sisa_tagihan: parseFloat(getEl('jumlah_dibayar').value),
            tenor: parseInt(getEl('jumlah_angsuran').value),
            sisa_tenor: parseInt(getEl('jumlah_angsuran').value),
            cicilan_per_kali: parseFloat(getEl('nominal_cicilan').value),
            periode: getEl('periode').value,
            status: 'Aktif'
        };

        let pinjaman = getLS('pinjaman');
        pinjaman.push(newPinjaman);
        setLS('pinjaman', pinjaman);

        // Update Tabungan Nasabah
        const nilaiTabungan = parseFloat(form.dataset.nilaiTabungan || 0);
        let tabunganData = getLS('tabungan');
        let userTab = tabunganData.find(t => t.nama === newPinjaman.nama);
        if (userTab) {
            userTab.total += nilaiTabungan;
        } else {
            tabunganData.push({ nama: newPinjaman.nama, total: nilaiTabungan });
        }
        setLS('tabungan', tabunganData);

        alert('Pinjaman berhasil dicatat!');
        window.location.href = 'pinjaman.html';
    });
}

function loadPinjamanCards() {
    const container = getEl('grid-pinjaman');
    const search = getEl('search-pinjaman');
    let data = getLS('pinjaman');

    function render(items) {
        container.innerHTML = '';
        items.forEach(item => {
            const isLunas = item.sisa_tagihan <= 100; // Toleransi pembulatan
            container.innerHTML += `
                <div class="card">
                    <h3>${item.nama} <span style="font-size:0.8rem; color:#777">(${item.tanggal})</span></h3>
                    <div class="card-detail"><span>Pinjaman Ke:</span> <strong>${item.ke}</strong></div>
                    <div class="card-detail"><span>Total Tagihan:</span> <strong>${formatRupiah(item.total_tagihan)}</strong></div>
                    <div class="card-detail"><span>Cicilan/${item.periode}:</span> <strong>${formatRupiah(item.cicilan_per_kali)}</strong></div>
                    <hr style="margin:10px 0; border:0; border-top:1px dashed #ccc;">
                    <div class="card-detail"><span>Sisa Saldo:</span> <strong style="color:var(--primary)">${formatRupiah(item.sisa_tagihan)}</strong></div>
                    <div class="card-detail"><span>Sisa Angsuran:</span> <strong>${item.sisa_tenor}x</strong></div>
                    <div class="card-detail"><span>Status:</span> <span class="${isLunas ? 'status-lunas' : 'status-aktif'}">${isLunas ? 'LUNAS' : 'BELUM LUNAS'}</span></div>
                    
                    <div style="margin-top:15px; text-align:right;">
                        <a href="bukti.html?nama=${item.nama}" class="action-btn edit">Riwayat</a>
                        ${isLunas ? `<button class="action-btn delete" onclick="hapusPinjaman(${item.id})">Hapus Data</button>` : ''}
                    </div>
                </div>
            `;
        });
    }
    render(data);
    
    if(search) {
        search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            render(data.filter(x => x.nama.toLowerCase().includes(term)));
        });
    }
}

window.hapusPinjaman = (id) => {
    if(confirm('Hapus data pinjaman lunas ini?')) {
        let data = getLS('pinjaman').filter(x => x.id !== id);
        setLS('pinjaman', data);
        location.reload();
    }
};

// --- 3. Pembayaran Logic ---
function initPembayaran() {
    const searchBtn = getEl('btn-cari-bayar');
    const inputNama = getEl('cari-nasabah-bayar');
    const resultArea = getEl('hasil-pencarian-bayar');

    // Fungsi render form pembayaran
    function showPaymentForm(pinjaman) {
        resultArea.innerHTML = `
            <div class="card" style="background:#eef">
                <h3>Pembayaran: ${pinjaman.nama}</h3>
                <p>Sisa Tagihan: <b>${formatRupiah(pinjaman.sisa_tagihan)}</b></p>
                <p>Angsuran ke-${(pinjaman.tenor - pinjaman.sisa_tenor) + 1} dari ${pinjaman.tenor}</p>
                <br>
                <div class="form-group">
                    <label>Jumlah Bayar</label>
                    <input type="number" id="input-bayar-nominal" value="${Math.round(pinjaman.cicilan_per_kali)}">
                </div>
                <button class="btn-primary" onclick="prosesBayar(${pinjaman.id})">BAYAR SEKARANG</button>
            </div>
        `;
    }

    searchBtn.addEventListener('click', () => {
        const term = inputNama.value.toLowerCase();
        const allPinjaman = getLS('pinjaman');
        // Cari pinjaman aktif
        const found = allPinjaman.find(p => p.nama.toLowerCase().includes(term) && p.sisa_tagihan > 100);
        
        if (found) {
            showPaymentForm(found);
        } else {
            resultArea.innerHTML = '<p style="color:red">Data tagihan aktif tidak ditemukan untuk nama tersebut.</p>';
        }
    });
}

window.prosesBayar = (id) => {
    const bayar = parseFloat(getEl('input-bayar-nominal').value);
    if(!bayar || bayar <= 0) return alert("Masukkan nominal!");

    let allPinjaman = getLS('pinjaman');
    let idx = allPinjaman.findIndex(p => p.id === id);
    
    if (idx !== -1) {
        // Update Pinjaman
        allPinjaman[idx].sisa_tagihan -= bayar;
        if(allPinjaman[idx].sisa_tagihan < 0) allPinjaman[idx].sisa_tagihan = 0;
        
        if(allPinjaman[idx].sisa_tenor > 0) {
            allPinjaman[idx].sisa_tenor -= 1;
        }
        
        setLS('pinjaman', allPinjaman);

        // Buat Bukti / Log
        const now = new Date();
        const log = {
            id: Date.now(),
            nama: allPinjaman[idx].nama,
            tanggal: now.toLocaleDateString('id-ID'),
            waktu: now.toLocaleTimeString('id-ID'),
            angsuran_ke: (allPinjaman[idx].tenor - allPinjaman[idx].sisa_tenor), // yang baru dibayar
            nominal: bayar
        };
        let logs = getLS('bukti_bayar');
        logs.push(log);
        setLS('bukti_bayar', logs);

        alert("Pembayaran Berhasil!");
        window.location.href = 'pinjaman.html';
    }
};

// --- 4. Tabungan & Saldo Logic ---
function loadTabungan() {
    const tbody = getEl('tabel-tabungan').querySelector('tbody');
    let data = getLS('tabungan');

    data.forEach((t, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${t.nama}</td>
                <td>${formatRupiah(t.total)}</td>
                <td>
                    <button class="action-btn edit" onclick="editTabungan('${t.nama}')">Edit</button>
                </td>
            </tr>
        `;
    });
}

window.editTabungan = (nama) => {
    let data = getLS('tabungan');
    let item = data.find(t => t.nama === nama);
    let baru = prompt(`Ubah saldo tabungan untuk ${nama}:`, item.total);
    if (baru !== null) {
        item.total = parseFloat(baru);
        setLS('tabungan', data);
        location.reload();
    }
}

function loadSaldo() {
    const pinjaman = getLS('pinjaman');
    const tabungan = getLS('tabungan');

    let totalPinjaman = 0; // Pokok/Tagihan awal
    let sisaTagihan = 0; // Yang belum dibayar
    let totalTabungan = tabungan.reduce((acc, curr) => acc + curr.total, 0);

    pinjaman.forEach(p => {
        totalPinjaman += p.total_tagihan;
        sisaTagihan += p.sisa_tagihan;
    });

    let sudahDibayar = totalPinjaman - sisaTagihan;

    getEl('total-pinjaman').innerText = formatRupiah(totalPinjaman);
    getEl('total-dibayar').innerText = formatRupiah(sudahDibayar);
    getEl('sisa-tagihan').innerText = formatRupiah(sisaTagihan);
    getEl('total-tabungan').innerText = formatRupiah(totalTabungan);
}

function loadBukti() {
    const tbody = getEl('tabel-bukti').querySelector('tbody');
    const search = getEl('search-bukti');
    let data = getLS('bukti_bayar');
    
    // Check URL param for filter
    const urlParams = new URLSearchParams(window.location.search);
    const filterNama = urlParams.get('nama');
    if(filterNama) {
        if(search) search.value = filterNama;
        data = data.filter(x => x.nama === filterNama);
    }

    // Sort by newest
    data.sort((a,b) => b.id - a.id);

    function render(items) {
        tbody.innerHTML = '';
        items.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.tanggal} ${item.waktu}</td>
                    <td>${item.nama}</td>
                    <td>Angsuran Ke-${item.angsuran_ke}</td>
                    <td>${formatRupiah(item.nominal)}</td>
                </tr>
            `;
        });
    }
    render(data);

    if(search){
        search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            render(data.filter(x => x.nama.toLowerCase().includes(term)));
        });
    }
}
