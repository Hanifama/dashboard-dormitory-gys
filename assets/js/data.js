/* Dormitory Energy Management - shared dummy dataset (PT. Garuda Yamato Steel).
   Single source: GYS Employee Dormitory (GYS-DORM-001), Cikarang.
   Hierarchy: Dormitory -> Building -> Floor -> Room -> Employee/Tenant
              -> Smart Meter -> DCU/ESP -> Transaction -> Token -> Payment. */
(function () {
  'use strict';

  var DORM = 'GYS Employee Dormitory';

  var DORMS = [
    { id: 'D-01', code: 'GYS-DORM-001', name: 'GYS Employee Dormitory', location: 'Cikarang, Bekasi, Jawa Barat', lat: '-6.359700', lng: '107.144400', address: 'Cikarang, Bekasi, Jawa Barat', desc: 'Asrama Karyawan - PT. Garuda Yamato Steel', status: 'Active' }
  ];

  var BUILDINGS = [
    { id: 'B-A', code: 'GYS-BLD-A', name: 'Building A', dorm: DORM, status: 'Active' },
    { id: 'B-B', code: 'GYS-BLD-B', name: 'Building B', dorm: DORM, status: 'Active' },
    { id: 'B-C', code: 'GYS-BLD-C', name: 'Building C', dorm: DORM, status: 'Active' }
  ];

  var FLOORS = [
    { id: 'F-A1', code: 'GYS-BLD-A-F01', number: '1', dorm: DORM, building: 'GYS-BLD-A', status: 'Active' },
    { id: 'F-B1', code: 'GYS-BLD-B-F01', number: '2', dorm: DORM, building: 'GYS-BLD-B', status: 'Active' },
    { id: 'F-C1', code: 'GYS-BLD-C-F01', number: '3', dorm: DORM, building: 'GYS-BLD-C', status: 'Active' }
  ];

  /* Room plan: 89 regular + 2 tenant = 91. Status index sets are 0-based
     within each building's regular room list. */
  var BLDGS = [
    { code: 'GYS-BLD-A', prefix: 'A', floor: '1', base: 101, count: 30,
      maint: [5, 13, 21, 27], avail: [3, 9, 12, 17, 20, 24, 26, 29] },
    { code: 'GYS-BLD-B', prefix: 'B', floor: '2', base: 201, count: 30,
      maint: [2, 11, 19, 25], avail: [6, 10, 15, 18, 22, 27, 29] },
    { code: 'GYS-BLD-C', prefix: 'C', floor: '3', base: 301, count: 29,
      maint: [4, 14, 24], avail: [1, 7, 10, 12, 17, 20, 22, 25, 27, 28] }
  ];

  var NAMES = [
    'Ahmad Fauzan', 'Dimas Pratama', 'Rizky Maulana', 'Fajar Nugroho',
    'Andi Setiawan', 'Budi Prasetyo', 'Reza Kurniawan', 'Muhammad Ilham',
    'Arif Hidayat', 'Yoga Saputra', 'Dewi Lestari', 'Siti Rahma',
    'Putri Ayu', 'Rina Wulandari', 'Intan Permata', 'Maya Kusuma',
    'Fitri Rahmawati', 'Lina Marlina', 'Eka Lestari', 'Dian Puspita',
    'Hendra Saputra', 'Tono Prasetyo', 'Bambang Sutrisno', 'Eko Prasetyo',
    'Wahyu Ramadhan', 'Galih Permana', 'Bayu Aditya', 'Farhan Aziz',
    'Iqbal Ramadhan', 'Aldi Saputra', 'Rudi Hartono', 'Sinta Ayu',
    'Ratna Dewi', 'Agus Wijaya', 'Dedi Kurniawan', 'Yudi Setiawan',
    'Slamet Riyadi', 'Joko Susilo', 'Agus Priyanto', 'Rian Hidayat',
    'Vina Melinda', 'Nita Kurnia', 'Wawan Setiawan', 'Dani Firmansyah',
    'Bella Anggraini', 'Tania Putri', 'Ilham Saputra', 'Fikri Ramadhan',
    'Bagus Nugroho', 'Lutfi Hakim', 'Novi Rahayu', 'Dinda Lestari',
    'Andre Gunawan'
  ];

  var DEPTS = ['Produksi', 'Pemeliharaan', 'Teknik', 'Kontrol Kualitas', 'Gudang', 'Logistik', 'K3', 'TI', 'SDM', 'Keuangan', 'Pengadaan'];
  var POSITIONS = ['Operator', 'Teknisi', 'Insinyur', 'Supervisor', 'Staf', 'Staf Senior', 'Inspektur QC', 'Staf Gudang', 'Teknisi Pemeliharaan', 'Pemimpin Produksi'];
  var JOINS = ['12 Jan 2022', '03 Mar 2021', '21 Jun 2023', '05 Oct 2022', '17 Feb 2024', '29 Jul 2021', '11 Nov 2023', '08 Apr 2024'];
  var UPDATES = ['2 mnt lalu', '9 mnt lalu', '18 mnt lalu', '35 mnt lalu', '1 jam lalu', '2 jam lalu', '4 jam lalu', '6 jam lalu', 'Kemarin', '2 hari lalu'];
  var INSTALLED = ['10 Jan 2024', '22 Feb 2024', '05 Mar 2024', '18 Apr 2024'];

  function pad(n, l) { return String(n).padStart(l, '0'); }

  var ROOMS = [], METERS = [], EMPLOYEES = [];
  var mNo = 0, eNo = 0, rNo = 0;

  BLDGS.forEach(function (b) {
    for (var i = 0; i < b.count; i++) {
      mNo++; rNo++;
      var roomNo = b.prefix + '-' + (b.base + i);
      var meterId = 'GYS-MTR-' + pad(mNo, 4);
      var status = b.maint.indexOf(i) > -1 ? 'Maintenance'
        : (b.avail.indexOf(i) > -1 ? 'Available' : 'Occupied');
      /* DCU split per building: A 20/10, B 20/10, C 20/9(+2 tenant). */
      var dcu = 'GYS-DCU-00' + (b.prefix === 'A' ? (mNo <= 20 ? 1 : 2)
        : b.prefix === 'B' ? (mNo <= 50 ? 3 : 4) : (mNo <= 80 ? 5 : 6));
      var empName = '-', empId = '-';
      if (status === 'Occupied') {
        empName = NAMES[eNo];
        empId = 'GYS-EMP-' + pad(eNo + 1, 4);
        EMPLOYEES.push({
          id: empId, name: empName, dept: DEPTS[eNo % DEPTS.length],
          pos: POSITIONS[eNo % POSITIONS.length], dorm: DORM,
          room: roomNo, meter: meterId, account: 'Active', occupancy: 'Occupied',
          joined: JOINS[eNo % JOINS.length], phone: '+62 812 3400 ' + pad(eNo + 1, 4)
        });
        eNo++;
      }
      ROOMS.push({
        id: 'R-' + pad(rNo, 3), dorm: DORM, building: b.code, floor: b.floor,
        room: roomNo, empId: empId, employee: empName, meter: meterId,
        capacity: String(2 + (rNo % 2) * 2), status: status,
        updated: UPDATES[rNo % UPDATES.length]
      });
      METERS.push({
        id: meterId, sn: 'SN-GYS-24-' + pad(mNo, 4), dorm: DORM,
        building: b.code, floor: b.floor, room: roomNo, employee: empName,
        dcu: dcu, reading: (120 + ((mNo * 137) % 4800) / 10).toFixed(1) + ' kWh',
        usage: (0.4 + ((mNo * 53) % 24) / 10).toFixed(1) + ' kW',
        credit: 'Rp' + (15000 + ((mNo * 7919) % 180000)).toLocaleString('id-ID'),
        status: 'TBD', updated: UPDATES[(mNo + 2) % UPDATES.length],
        installed: INSTALLED[mNo % INSTALLED.length]
      });
    }
  });

  /* Tenant rooms on Building C, Floor 3: occupied by companies, not employees. */
  var TENANTS = [
    { room: 'C-T01', name: 'PT. Yamato Engineering Support', meter: 'GYS-MTR-T001', sn: 'SN-GYS-24-T001' },
    { room: 'C-T02', name: 'PT. Garuda Industrial Services', meter: 'GYS-MTR-T002', sn: 'SN-GYS-24-T002' }
  ];
  TENANTS.forEach(function (t, k) {
    rNo++;
    ROOMS.push({
      id: 'R-' + pad(rNo, 3), dorm: DORM, building: 'GYS-BLD-C', floor: '3',
      room: t.room, empId: '-', employee: t.name, tenant: t.name, meter: t.meter,
      capacity: '8', status: 'Occupied', updated: UPDATES[(k + 5) % UPDATES.length]
    });
    METERS.push({
      id: t.meter, sn: t.sn, dorm: DORM, building: 'GYS-BLD-C', floor: '3',
      room: t.room, employee: t.name, dcu: 'GYS-DCU-006',
      reading: (820 + k * 145).toFixed(1) + ' kWh', usage: (3.1 + k * 0.8).toFixed(1) + ' kW',
      credit: 'Rp' + (285000 - k * 40000).toLocaleString('id-ID'),
      status: 'Online', updated: UPDATES[k], installed: '18 Apr 2024'
    });
  });

  /* Meter status distribution: 78 Online, 7 Warning, 4 Offline, 2 Maintenance.
     Offlines sit on Available rooms; warnings on Occupied rooms. */
  var M_WARN = [1, 15, 38, 55, 61, 70, 80];
  var M_OFF = [4, 41, 68, 58];
  var M_MAINT = [6, 75];
  METERS.forEach(function (m) {
    if (m.status !== 'TBD') return;
    var n = parseInt(m.id.slice(-4), 10);
    m.status = M_MAINT.indexOf(n) > -1 ? 'Maintenance'
      : M_OFF.indexOf(n) > -1 ? 'Offline'
      : M_WARN.indexOf(n) > -1 ? 'Warning' : 'Online';
  });

  var DCUS = [
    { id: 'GYS-DCU-001', name: 'DCU A-01', location: DORM + ' - Gedung A, Lantai 1, Ruang Panel', ip: '10.20.1.11', lastComm: '12 dtk lalu', status: 'Online', esp: 'GYS-ESP-001', capacity: 24 },
    { id: 'GYS-DCU-002', name: 'DCU A-02', location: DORM + ' - Gedung A, Lantai 1, Ruang Panel', ip: '10.20.1.12', lastComm: '28 dtk lalu', status: 'Online', esp: 'GYS-ESP-002', capacity: 12 },
    { id: 'GYS-DCU-003', name: 'DCU B-01', location: DORM + ' - Gedung B, Lantai 2, Ruang Panel', ip: '10.20.2.11', lastComm: '3 mnt lalu', status: 'Warning', esp: 'GYS-ESP-003', capacity: 24 },
    { id: 'GYS-DCU-004', name: 'DCU B-02', location: DORM + ' - Gedung B, Lantai 2, Ruang Panel', ip: '10.20.2.12', lastComm: '15 dtk lalu', status: 'Online', esp: 'GYS-ESP-004', capacity: 12 },
    { id: 'GYS-DCU-005', name: 'DCU C-01', location: DORM + ' - Gedung C, Lantai 3, Ruang Panel', ip: '10.20.3.11', lastComm: '9 dtk lalu', status: 'Online', esp: 'GYS-ESP-005', capacity: 24 },
    { id: 'GYS-DCU-006', name: 'DCU C-02', location: DORM + ' - Gedung C, Lantai 3, Ruang Panel', ip: '10.20.3.12', lastComm: '21 dtk lalu', status: 'Online', esp: 'GYS-ESP-006', capacity: 12 }
  ];

  /* Token -> Transaction -> Payment chain. Token kWh = amount / 1500. */
  var CHAINS = [
    { tkn: 'TKN-0001', no: '48127391552018472936', emp: 'Ahmad Fauzan', room: 'A-101', meter: 'GYS-MTR-0001', amt: 100000, tstatus: 'Successful', date: '06 Oct 2026 20:41', method: 'QRIS', trx: 'Successful' },
    { tkn: 'TKN-0002', no: '73195520441867203918', emp: 'Dimas Pratama', room: 'A-102', meter: 'GYS-MTR-0002', amt: 50000, tstatus: 'Successful', date: '06 Oct 2026 18:22', method: 'Virtual Account', trx: 'Successful' },
    { tkn: 'TKN-0003', no: '20448613729195063741', emp: 'Eko Prasetyo', room: 'B-208', meter: 'GYS-MTR-0038', amt: 20000, tstatus: 'Pending', date: '06 Oct 2026 17:05', method: 'E-Wallet', trx: 'Pending' },
    { tkn: 'TKN-0004', no: '55820194773610528419', emp: 'Joko Susilo', room: 'C-301', meter: 'GYS-MTR-0061', amt: 50000, tstatus: 'Successful', date: '06 Oct 2026 15:48', method: 'Payroll Deduction', trx: 'Successful' },
    { tkn: 'TKN-0005', no: '91376048255123986402', emp: 'Dedi Kurniawan', room: 'B-225', meter: 'GYS-MTR-0055', amt: 50000, tstatus: 'Failed', date: '06 Oct 2026 14:11', method: 'QRIS', trx: 'Failed' },
    { tkn: 'TKN-0006', no: '33741860559247183096', emp: 'Rizky Maulana', room: 'A-103', meter: 'GYS-MTR-0003', amt: 150000, tstatus: 'Successful', date: '06 Oct 2026 13:37', method: 'Virtual Account', trx: 'Successful' },
    { tkn: 'TKN-0007', no: '66029413778051423975', emp: 'Dani Firmansyah', room: 'C-310', meter: 'GYS-MTR-0070', amt: 50000, tstatus: 'Successful', date: '06 Oct 2026 11:26', method: 'E-Wallet', trx: 'Successful' },
    { tkn: 'TKN-0008', no: '12958304776123985034', emp: 'Hendra Saputra', room: 'B-204', meter: 'GYS-MTR-0034', amt: 20000, tstatus: 'Expired', date: '05 Oct 2026 22:14', method: 'QRIS', trx: 'Successful' },
    { tkn: 'TKN-0009', no: '80417553962097341886', emp: 'Reza Kurniawan', room: 'A-109', meter: 'GYS-MTR-0009', amt: 250000, tstatus: 'Successful', date: '05 Oct 2026 19:52', method: 'Payroll Deduction', trx: 'Successful' },
    { tkn: 'TKN-0010', no: '47190256318834520713', emp: 'PT. Yamato Engineering Support', room: 'C-T01', meter: 'GYS-MTR-T001', amt: 500000, tstatus: 'Pending', date: '05 Oct 2026 16:03', method: 'QRIS', trx: 'Pending' },
    { tkn: 'TKN-0011', no: '28561730945508217649', emp: 'Lutfi Hakim', room: 'C-320', meter: 'GYS-MTR-0080', amt: 50000, tstatus: 'Failed', date: '05 Oct 2026 10:29', method: 'E-Wallet', trx: 'Failed' },
    { tkn: 'TKN-0012', no: '59204817633059174286', emp: 'Slamet Riyadi', room: 'B-229', meter: 'GYS-MTR-0059', amt: 200000, tstatus: 'Successful', date: '04 Oct 2026 21:15', method: 'Virtual Account', trx: 'Successful' }
  ];

  /* Money/energy stay raw numbers: dashboard.js formats via idr()/kwh(). */
  var TOKENS = CHAINS.map(function (c) {
    return { id: c.tkn, no: c.no, employee: c.emp, room: c.room, meter: c.meter, amount: c.amt, kwh: Math.round(c.amt / 1500 * 10) / 10, status: c.tstatus, created: c.date };
  });

  var TRANSACTIONS = CHAINS.map(function (c, i) {
    return { id: 'TRX-GYS-' + pad(i + 1, 6), date: c.date, employee: c.emp, room: c.room, meter: c.meter, token: c.tkn, amount: c.amt, method: c.method, status: c.trx };
  });

  var PAY_IDX = [0, 1, 2, 3, 4, 5, 6, 8, 9, 11];
  var PAYMENTS = PAY_IDX.map(function (ci, i) {
    var c = CHAINS[ci];
    var fee = c.method === 'Payroll Deduction' ? 0 : 2500;
    return {
      id: 'PAY-GYS-' + pad(i + 1, 6), employee: c.emp, method: c.method,
      trx: 'TRX-GYS-' + pad(ci + 1, 6), amount: c.amt, fee: fee, total: c.amt + fee,
      status: c.trx === 'Successful' ? 'Successful' : c.trx, date: c.date
    };
  });

  var TARIFFS = [
    { id: 'TRF-GYS-2026-01', effective: '01 Jan 2026', price: 'Rp1.500', fee: 'Rp2.500', min: 'Rp20.000', max: 'Rp500.000', status: 'Active' },
    { id: 'TRF-GYS-2025-02', effective: '01 Jul 2025', price: 'Rp1.450', fee: 'Rp2.500', min: 'Rp20.000', max: 'Rp500.000', status: 'Inactive' },
    { id: 'TRF-GYS-2025-01', effective: '01 Jan 2025', price: 'Rp1.400', fee: 'Rp2.000', min: 'Rp20.000', max: 'Rp300.000', status: 'Inactive' },
    { id: 'TRF-GYS-2024-01', effective: '01 Jan 2024', price: 'Rp1.350', fee: 'Rp2.000', min: 'Rp20.000', max: 'Rp300.000', status: 'Expired' }
  ];

  var NOTIFICATIONS = [
    { id: 'NTF-001', title: 'Meter GYS-MTR-0041 offline', type: 'Meter Offline', recipient: 'Teknisi', channel: 'Dashboard', status: 'Unread', severity: 'critical', created: '26 mnt lalu', desc: 'Smart meter GYS-MTR-0041 (Kamar B-211, Gedung B) tidak mengirim data dalam interval pemantauan yang dikonfigurasi.' },
    { id: 'NTF-002', title: 'Saldo rendah di GYS-MTR-0015', type: 'Kredit Rendah', recipient: 'Yoga Saputra', channel: 'WhatsApp', status: 'Unread', severity: 'warning', created: '1 jam lalu', desc: 'Saldo meter GYS-MTR-0015 (Kamar A-115) di bawah ambang yang dikonfigurasi.' },
    { id: 'NTF-003', title: 'Konsumsi tinggi di GYS-MTR-0038', type: 'Konsumsi Tinggi', recipient: 'Manajer', channel: 'Dashboard', status: 'Unread', severity: 'warning', created: '2 jam lalu', desc: 'Meter GYS-MTR-0038 (Kamar B-208) melebihi profil konsumsi per jam.' },
    { id: 'NTF-004', title: 'Pembayaran gagal untuk TRX-GYS-000005', type: 'Pembayaran', recipient: 'Keuangan', channel: 'Email', status: 'Unread', severity: 'critical', created: '3 jam lalu', desc: 'Pembayaran QRIS Rp50.000 oleh Dedi Kurniawan ditolak penerbit.' },
    { id: 'NTF-005', title: 'Gagal kirim token (TKN-0005)', type: 'Token', recipient: 'Teknisi', channel: 'Dashboard', status: 'Unread', severity: 'warning', created: '3 jam lalu', desc: 'Token TKN-0005 tidak dapat dikirim ke meter GYS-MTR-0055.' },
    { id: 'NTF-006', title: 'Sinyal GYS-DCU-003 menurun', type: 'Peringatan DCU', recipient: 'Teknisi', channel: 'Dashboard', status: 'Unread', severity: 'warning', created: '4 jam lalu', desc: 'Packet loss di GYS-DCU-003 (Gedung B). 20 meter masih melapor via buffer.' },
    { id: 'NTF-007', title: 'Token TKN-0001 terkirim', type: 'Token', recipient: 'Ahmad Fauzan', channel: 'WhatsApp', status: 'Read', severity: 'info', created: '5 jam lalu', desc: 'Token 66,7 kWh berhasil ditulis ke meter GYS-MTR-0001.' },
    { id: 'NTF-008', title: 'Potongan gaji tersinkron', type: 'Sistem', recipient: 'Keuangan', channel: 'Email', status: 'Read', severity: 'info', created: 'Kemarin', desc: 'Berkas potongan gaji September direkonsiliasi dengan 8 pembelian token.' },
    { id: 'NTF-009', title: 'Tarif TRF-GYS-2026-01 aktif', type: 'Sistem', recipient: 'Manajer', channel: 'Email', status: 'Read', severity: 'info', created: '2 hari lalu', desc: 'Tarif energi Rp1.500/kWh dengan biaya admin Rp2.500 kini berlaku.' },
    { id: 'NTF-010', title: 'Teknisi baru bergabung', type: 'Sistem', recipient: 'Administrator', channel: 'Dashboard', status: 'Read', severity: 'info', created: '2 hari lalu', desc: 'Andi Saputra diberi akses teknisi untuk GYS Employee Dormitory.' },
    { id: 'NTF-011', title: 'Laporan energi mingguan siap', type: 'Sistem', recipient: 'Manajer', channel: 'Email', status: 'Read', severity: 'info', created: '3 hari lalu', desc: 'Laporan konsumsi energi minggu ke-40 tersedia untuk diunduh.' },
    { id: 'NTF-012', title: 'Pengingat kredit rendah terkirim', type: 'Kredit Rendah', recipient: 'Karyawan', channel: 'WhatsApp', status: 'Read', severity: 'info', created: '3 hari lalu', desc: 'Pengingat WhatsApp dikirim ke 5 kamar yang mendekati ambang kredit.' }
  ];

  var USERS = [
    { id: 'USR-0001', name: 'Agus Setiawan', email: 'agus.setiawan@gys.co.id', empId: 'GYS-EMP-0101', role: 'Super Admin', dorm: DORM, area: 'Semua Gedung', status: 'Active', login: '06 Oct 2026 21:02' },
    { id: 'USR-0002', name: 'Sinta Maharani', email: 'sinta.maharani@gys.co.id', empId: 'GYS-EMP-0102', role: 'Manager', dorm: DORM, area: 'Gedung A', status: 'Active', login: '06 Oct 2026 17:44' },
    { id: 'USR-0003', name: 'Tono Wijaya', email: 'tono.wijaya@gys.co.id', empId: 'GYS-EMP-0103', role: 'Technician', dorm: DORM, area: 'Gedung B', status: 'Active', login: '06 Oct 2026 16:10' },
    { id: 'USR-0004', name: 'Rina Kartika', email: 'rina.kartika@gys.co.id', empId: 'GYS-EMP-0104', role: 'Finance', dorm: DORM, area: 'Semua Gedung', status: 'Active', login: '06 Oct 2026 15:31' },
    { id: 'USR-0005', name: 'Andi Saputra', email: 'andi.saputra@gys.co.id', empId: 'GYS-EMP-0105', role: 'Technician', dorm: DORM, area: 'Gedung C', status: 'Active', login: '06 Oct 2026 09:58' },
    { id: 'USR-0006', name: 'Lina Wulandari', email: 'lina.wulandari@gys.co.id', empId: 'GYS-EMP-0106', role: 'Operator', dorm: DORM, area: 'Gedung A', status: 'Active', login: '05 Oct 2026 22:07' },
    { id: 'USR-0007', name: 'Budi Santoso', email: 'budi.santoso@gys.co.id', empId: 'GYS-EMP-0107', role: 'Operator', dorm: DORM, area: 'Gedung B', status: 'Inactive', login: '01 Oct 2026 11:49' },
    { id: 'USR-0008', name: 'Eka Novitasari', email: 'eka.novitasari@gys.co.id', empId: 'GYS-EMP-0108', role: 'Viewer', dorm: DORM, area: 'Gedung C', status: 'Active', login: '30 Sep 2026 08:15' },
    { id: 'USR-0009', name: 'Hendra Gunawan', email: 'hendra.gunawan@gys.co.id', empId: 'GYS-EMP-0109', role: 'Finance', dorm: DORM, area: 'Semua Gedung', status: 'Active', login: '29 Sep 2026 14:26' },
    { id: 'USR-0010', name: 'Fitri Handayani', email: 'fitri.handayani@gys.co.id', empId: 'GYS-EMP-0110', role: 'Viewer', dorm: DORM, area: 'Gedung A', status: 'Inactive', login: '20 Sep 2026 10:03' }
  ];

  var ROLES = [
    { id: 'ROLE-01', name: 'Super Admin', desc: 'Akses penuh ke semua modul dan pengaturan', status: 'Active' },
    { id: 'ROLE-02', name: 'Manager', desc: 'Kelola asrama, setujui pembayaran, lihat laporan', status: 'Active' },
    { id: 'ROLE-03', name: 'Technician', desc: 'Kelola meter, DCU, token, dan notifikasi', status: 'Active' },
    { id: 'ROLE-04', name: 'Finance', desc: 'Kelola pembayaran, rekonsiliasi, dan laporan penggajian', status: 'Active' },
    { id: 'ROLE-05', name: 'Operator', desc: 'Operasional harian kamar, karyawan, dan meter', status: 'Active' },
    { id: 'ROLE-06', name: 'Viewer', desc: 'Akses baca dasbor dan laporan', status: 'Active' }
  ];

  /* Role -> allowed sidebar menu keys (menu keys match data-nav values). */
  var ACCESS = {
    'ROLE-01': ['dashboard', 'buildings', 'floors', 'rooms', 'employees', 'meters', 'dcu', 'tokens', 'transactions', 'payments', 'tariffs', 'notifications', 'reports', 'users', 'roles', 'auditlog', 'settings'],
    'ROLE-02': ['dashboard', 'buildings', 'floors', 'rooms', 'employees', 'meters', 'dcu', 'tokens', 'transactions', 'payments', 'tariffs', 'notifications', 'reports', 'auditlog', 'settings'],
    'ROLE-03': ['dashboard', 'rooms', 'employees', 'meters', 'dcu', 'tokens', 'notifications', 'reports'],
    'ROLE-04': ['dashboard', 'transactions', 'payments', 'tariffs', 'notifications', 'reports'],
    'ROLE-05': ['dashboard', 'rooms', 'employees', 'meters', 'notifications'],
    'ROLE-06': ['dashboard', 'reports']
  };

  var EXPORTS = [
    { name: 'gys-energy-sep-2026.csv', type: 'Konsumsi Energi', date: '02 Oct 2026 09:12', size: '184 KB' },
    { name: 'gys-tokens-week40.xlsx', type: 'Token', date: '05 Oct 2026 13:45', size: '96 KB' },
    { name: 'gys-occupancy-sep-2026.pdf', type: 'Hunian Kamar', date: '01 Oct 2026 16:20', size: '212 KB' }
  ];

  var METER_HISTORY = [
    { meter: 'GYS-MTR-0006', date: '06 Oct 2026 15:02', oldSn: 'SN-GYS-23-0106', newSn: 'SN-GYS-24-0006', reason: 'Meter diganti setelah isolasi gangguan kamar', tech: 'Tono Wijaya' },
    { meter: 'GYS-MTR-0075', date: '02 Oct 2026 10:18', oldSn: 'SN-GYS-24-0075', newSn: 'SN-GYS-24-0075', reason: 'Meter diisolasi untuk pemeliharaan kamar', tech: 'Andi Saputra' },
    { meter: 'GYS-MTR-0038', date: '28 Sep 2026 09:41', oldSn: 'SN-GYS-24-0038', newSn: 'SN-GYS-24-0038', reason: 'Firmware dikalibrasi', tech: 'Tono Wijaya' }
  ];

  /* ---------- Audit Log: system activity trail (chronological; UI sorts desc) ----------
     Users, roles, target IDs and timestamps stay consistent with the rest of
     the dummy dataset so the trail reads like a real backend audit feed. */
  var AU = {
    U1: ['USR-0001', 'Agus Setiawan', 'Super Admin', '192.168.10.11'],
    U2: ['USR-0002', 'Sinta Maharani', 'Manager', '192.168.10.12'],
    U3: ['USR-0003', 'Tono Wijaya', 'Technician', '192.168.10.13'],
    U4: ['USR-0004', 'Rina Kartika', 'Finance', '192.168.10.14'],
    U5: ['USR-0005', 'Andi Saputra', 'Technician', '192.168.10.15'],
    U6: ['USR-0006', 'Lina Wulandari', 'Operator', '192.168.10.16'],
    U7: ['USR-0007', 'Budi Santoso', 'Operator', '192.168.10.17'],
    U8: ['USR-0008', 'Eka Novitasari', 'Viewer', '192.168.10.18'],
    U9: ['USR-0009', 'Hendra Gunawan', 'Finance', '192.168.10.19'],
    U10: ['USR-0010', 'Fitri Handayani', 'Viewer', '192.168.10.20']
  };
  var AUDIT_LOGS = [];
  function A(ts, u, action, module, desc, target, targetId, field, prev, next) {
    AUDIT_LOGS.push({
      id: 'LOG-' + pad(AUDIT_LOGS.length + 1, 4), ts: ts, uid: u[0], user: u[1], role: u[2], ip: u[3],
      action: action, module: module, desc: desc, status: action === 'LOGIN_FAILED' ? 'Failed' : 'Success',
      target: target || '-', targetId: targetId || '-', field: field || '-', prev: prev || '-', next: next || '-'
    });
  }
  /* 2026-10-07 */
  A('2026-10-07 06:58:02', AU.U5, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 07:01:44', AU.U5, 'VIEW', 'Dashboard', 'Melihat ringkasan dasbor');
  A('2026-10-07 07:05:19', AU.U1, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 07:09:33', AU.U1, 'VIEW', 'Pengguna', 'Melihat pengguna USR-0008', 'Pengguna', 'USR-0008');
  A('2026-10-07 07:12:07', AU.U1, 'PASSWORD_RESET', 'Pengguna', 'Mereset kata sandi pengguna USR-0008', 'Pengguna', 'USR-0008', 'Kata Sandi', '-', 'Direset');
  A('2026-10-07 07:15:51', AU.U3, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 07:19:26', AU.U3, 'VIEW', 'Meter', 'Melihat meter GYS-MTR-0038', 'Meter', 'GYS-MTR-0038');
  A('2026-10-07 07:24:10', AU.U3, 'UPDATE', 'Meter', 'Mengubah status meter GYS-MTR-0038 dari Online ke Peringatan', 'Meter', 'GYS-MTR-0038', 'Status', 'Online', 'Peringatan');
  A('2026-10-07 07:31:45', AU.U2, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 07:36:02', AU.U2, 'VIEW', 'Laporan', 'Melihat laporan konsumsi energi');
  A('2026-10-07 07:42:18', AU.U2, 'EXPORT', 'Laporan', 'Mengekspor laporan konsumsi energi ke PDF');
  A('2026-10-07 07:48:55', AU.U6, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 07:52:30', AU.U6, 'VIEW', 'Kamar', 'Melihat kamar A-104', 'Kamar', 'A-104');
  A('2026-10-07 07:55:12', AU.U6, 'VIEW', 'Karyawan', 'Melihat karyawan GYS-EMP-0002', 'Karyawan', 'GYS-EMP-0002');
  A('2026-10-07 08:02:37', AU.U4, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 08:07:09', AU.U4, 'VIEW', 'Transaksi', 'Melihat transaksi TRX-GYS-000005', 'Transaksi', 'TRX-GYS-000005');
  A('2026-10-07 08:11:54', AU.U4, 'VIEW', 'Pembayaran', 'Melihat pembayaran PAY-GYS-000005', 'Pembayaran', 'PAY-GYS-000005');
  A('2026-10-07 08:12:34', AU.U8, 'LOGIN_FAILED', 'Autentikasi', 'Upaya login gagal untuk pengguna USR-0008');
  A('2026-10-07 08:16:20', AU.U8, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 08:21:03', AU.U8, 'VIEW', 'Dashboard', 'Melihat ringkasan dasbor');
  A('2026-10-07 08:24:17', AU.U3, 'UPDATE', 'Meter', 'Mengubah status meter GYS-MTR-0006 dari Online ke Pemeliharaan', 'Meter', 'GYS-MTR-0006', 'Status', 'Online', 'Pemeliharaan');
  A('2026-10-07 08:29:41', AU.U5, 'VIEW', 'DCU & IoT', 'Melihat DCU GYS-DCU-003', 'DCU', 'GYS-DCU-003');
  A('2026-10-07 08:33:08', AU.U5, 'UPDATE', 'DCU & IoT', 'Mengubah status DCU GYS-DCU-003 dari Online ke Peringatan', 'DCU', 'GYS-DCU-003', 'Status', 'Online', 'Peringatan');
  A('2026-10-07 08:38:52', AU.U1, 'CREATE', 'Kamar', 'Membuat kamar A-130', 'Kamar', 'A-130', 'Data', '-', 'Dibuat');
  A('2026-10-07 08:44:15', AU.U1, 'UPDATE', 'Kamar', 'Mengubah status kamar A-129 dari Tersedia ke Terisi', 'Kamar', 'A-129', 'Status', 'Tersedia', 'Terisi');
  A('2026-10-07 08:49:37', AU.U9, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 08:54:22', AU.U9, 'VIEW', 'Pembayaran', 'Melihat pembayaran PAY-GYS-000009', 'Pembayaran', 'PAY-GYS-000009');
  A('2026-10-07 08:58:06', AU.U9, 'EXPORT', 'Pembayaran', 'Mengekspor laporan pembayaran ke Excel');
  A('2026-10-07 09:01:42', AU.U2, 'EXPORT', 'Laporan', 'Mengekspor laporan status meter ke CSV');
  A('2026-10-07 09:06:29', AU.U7, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 09:11:15', AU.U7, 'VIEW', 'Meter', 'Melihat meter GYS-MTR-0015', 'Meter', 'GYS-MTR-0015');
  A('2026-10-07 09:14:21', AU.U10, 'LOGIN_FAILED', 'Autentikasi', 'Upaya login gagal untuk pengguna USR-0010');
  A('2026-10-07 09:19:48', AU.U6, 'UPDATE', 'Kamar', 'Mengubah status kamar C-305 dari Terisi ke Pemeliharaan', 'Kamar', 'C-305', 'Status', 'Terisi', 'Pemeliharaan');
  A('2026-10-07 09:25:33', AU.U10, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 09:31:07', AU.U10, 'VIEW', 'Kamar', 'Melihat kamar C-301', 'Kamar', 'C-301');
  A('2026-10-07 09:36:54', AU.U3, 'CREATE', 'Meter', 'Membuat data meter GYS-MTR-0089', 'Meter', 'GYS-MTR-0089', 'Data', '-', 'Dibuat');
  A('2026-10-07 09:42:30', AU.U4, 'UPDATE', 'Transaksi', 'Menandai transaksi TRX-GYS-000005 sudah ditinjau', 'Transaksi', 'TRX-GYS-000005', 'Tinjauan', 'Menunggu', 'Ditinjau');
  A('2026-10-07 09:47:16', AU.U5, 'LOGOUT', 'Autentikasi', 'Pengguna keluar dari sistem');
  A('2026-10-07 09:52:41', AU.U1, 'CONFIG_UPDATE', 'Konfigurasi Sistem', 'Mengubah ambang meter offline dari 10 menit ke 15 menit', 'Pengaturan', '-', 'Ambang', '10 menit', '15 menit');
  A('2026-10-07 10:05:24', AU.U2, 'VIEW', 'Karyawan', 'Melihat karyawan GYS-EMP-0032', 'Karyawan', 'GYS-EMP-0032');
  A('2026-10-07 10:11:58', AU.U2, 'UPDATE', 'Karyawan', 'Mengubah kamar karyawan GYS-EMP-0010 dari A-112 ke A-115', 'Karyawan', 'GYS-EMP-0010', 'Kamar', 'A-112', 'A-115');
  A('2026-10-07 10:18:33', AU.U6, 'EXPORT', 'Kamar', 'Mengekspor laporan hunian kamar ke Excel');
  A('2026-10-07 10:26:07', AU.U8, 'LOGOUT', 'Autentikasi', 'Pengguna keluar dari sistem');
  A('2026-10-07 10:33:49', AU.U1, 'DELETE', 'Meter', 'Menghapus snapshot pembacaan usang untuk meter GYS-MTR-0042', 'Snapshot Pembacaan', 'GYS-MTR-0042', 'Data', 'Ada', 'Dihapus');
  A('2026-10-07 10:41:12', AU.U9, 'VIEW', 'Transaksi', 'Melihat transaksi TRX-GYS-000010', 'Transaksi', 'TRX-GYS-000010');
  A('2026-10-07 10:48:35', AU.U4, 'EXPORT', 'Transaksi', 'Mengekspor laporan transaksi ke CSV');
  A('2026-10-07 11:02:19', AU.U3, 'VIEW', 'Token', 'Melihat token TKN-0005', 'Token', 'TKN-0005');
  A('2026-10-07 11:09:54', AU.U7, 'LOGIN_FAILED', 'Autentikasi', 'Upaya login gagal untuk pengguna USR-0007');
  A('2026-10-07 11:15:27', AU.U7, 'VIEW', 'Notifikasi', 'Melihat notifikasi NTF-001', 'Notifikasi', 'NTF-001');
  A('2026-10-07 11:23:11', AU.U3, 'UPDATE', 'Token', 'Mengirim ulang token TKN-0005 ke meter GYS-MTR-0055', 'Token', 'TKN-0005', 'Pengiriman', 'Gagal', 'Dikirim ulang');
  A('2026-10-07 11:35:46', AU.U5, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-07 11:42:03', AU.U5, 'VIEW', 'Lantai', 'Melihat lantai GYS-BLD-C-F01', 'Lantai', 'GYS-BLD-C-F01');
  /* 2026-10-06 */
  A('2026-10-06 07:58:11', AU.U3, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 08:04:37', AU.U3, 'VIEW', 'DCU & IoT', 'Melihat DCU GYS-DCU-001', 'DCU', 'GYS-DCU-001');
  A('2026-10-06 08:12:55', AU.U1, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 08:19:28', AU.U1, 'CREATE', 'Tarif', 'Membuat tarif TRF-GYS-2026-01', 'Tarif', 'TRF-GYS-2026-01', 'Data', '-', 'Dibuat');
  A('2026-10-06 08:27:03', AU.U1, 'UPDATE', 'Tarif', 'Mengubah biaya admin tarif TRF-GYS-2026-01 dari Rp2.000 ke Rp2.500', 'Tarif', 'TRF-GYS-2026-01', 'Biaya Admin', 'Rp2.000', 'Rp2.500');
  A('2026-10-06 08:35:40', AU.U2, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 08:41:16', AU.U2, 'VIEW', 'Asrama', 'Melihat asrama GYS-DORM-001', 'Asrama', 'GYS-DORM-001');
  A('2026-10-06 08:49:52', AU.U6, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 08:55:28', AU.U6, 'CREATE', 'Karyawan', 'Membuat data karyawan GYS-EMP-0053', 'Karyawan', 'GYS-EMP-0053', 'Data', '-', 'Dibuat');
  A('2026-10-06 09:03:14', AU.U4, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 09:10:47', AU.U4, 'VIEW', 'Pembayaran', 'Melihat pembayaran PAY-GYS-000001', 'Pembayaran', 'PAY-GYS-000001');
  A('2026-10-06 09:18:22', AU.U9, 'EXPORT', 'Pembayaran', 'Mengekspor laporan potongan gaji ke Excel');
  A('2026-10-06 09:26:59', AU.U5, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-06 09:33:35', AU.U5, 'CREATE', 'DCU & IoT', 'Membuat DCU GYS-DCU-006', 'DCU', 'GYS-DCU-006', 'Data', '-', 'Dibuat');
  A('2026-10-06 09:41:08', AU.U5, 'UPDATE', 'DCU & IoT', 'Memindahkan meter GYS-MTR-0041 ke DCU GYS-DCU-003', 'Meter', 'GYS-MTR-0041', 'DCU', 'GYS-DCU-004', 'GYS-DCU-003');
  A('2026-10-06 13:15:44', AU.U1, 'UPDATE', 'Pengguna', 'Mengubah akses area pengguna USR-0005 dari Gedung A ke Gedung C', 'Pengguna', 'USR-0005', 'Akses Area', 'Gedung A', 'Gedung C');
  A('2026-10-06 13:24:19', AU.U1, 'CREATE', 'Pengguna', 'Membuat pengguna USR-0010', 'Pengguna', 'USR-0010', 'Data', '-', 'Dibuat');
  A('2026-10-06 14:02:53', AU.U3, 'DELETE', 'Transaksi', 'Menghapus upaya ulang yang gagal untuk transaksi TRX-GYS-000005', 'Upaya Ulang', 'TRX-GYS-000005', 'Data', 'Ada', 'Dihapus');
  A('2026-10-06 15:20:36', AU.U4, 'LOGOUT', 'Autentikasi', 'Pengguna keluar dari sistem');
  A('2026-10-06 16:44:09', AU.U1, 'CONFIG_UPDATE', 'Konfigurasi Sistem', 'Mengubah ambang saldo rendah dari Rp10.000 ke Rp15.000', 'Pengaturan', '-', 'Ambang', 'Rp10.000', 'Rp15.000');
  A('2026-10-06 17:30:52', AU.U6, 'LOGOUT', 'Autentikasi', 'Pengguna keluar dari sistem');
  A('2026-10-06 18:05:17', AU.U3, 'UPDATE', 'Notifikasi', 'Menandai notifikasi NTF-007 sudah dibaca', 'Notifikasi', 'NTF-007', 'Status', 'Belum Dibaca', 'Dibaca');
  /* 2026-10-05 */
  A('2026-10-05 08:11:26', AU.U1, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-05 08:18:03', AU.U1, 'CREATE', 'Lantai', 'Membuat data lantai GYS-BLD-C-F01', 'Lantai', 'GYS-BLD-C-F01', 'Data', '-', 'Dibuat');
  A('2026-10-05 09:02:41', AU.U2, 'LOGIN', 'Autentikasi', 'Pengguna masuk ke sistem');
  A('2026-10-05 09:09:15', AU.U2, 'VIEW', 'Gedung', 'Melihat gedung GYS-BLD-B', 'Gedung', 'GYS-BLD-B');
  A('2026-10-05 09:16:48', AU.U3, 'UPDATE', 'Meter', 'Mengkalibrasi firmware meter GYS-MTR-0038', 'Meter', 'GYS-MTR-0038', 'Firmware', 'v2.3.1', 'v2.4.0');
  A('2026-10-05 10:24:33', AU.U4, 'DELETE', 'Karyawan', 'Menghapus data kontak ganda untuk karyawan GYS-EMP-0032', 'Data Kontak', 'GYS-EMP-0032', 'Data', 'Ada', 'Dihapus');
  A('2026-10-05 11:37:19', AU.U9, 'CREATE', 'Pembayaran', 'Membuat pembayaran PAY-GYS-000009', 'Pembayaran', 'PAY-GYS-000009', 'Data', '-', 'Dibuat');
  A('2026-10-05 13:45:02', AU.U1, 'EXPORT', 'Laporan', 'Mengekspor ringkasan audit ke PDF');
  A('2026-10-05 15:12:37', AU.U10, 'PASSWORD_RESET', 'Pengguna', 'Mereset kata sandi pengguna USR-0010', 'Pengguna', 'USR-0010', 'Kata Sandi', '-', 'Direset');
  A('2026-10-05 16:58:24', AU.U2, 'LOGOUT', 'Autentikasi', 'Pengguna keluar dari sistem');

  /* ---------- Disturbance / Incident reports ----------
     Every room/meter/DCU/token reference below exists in the dataset. */
  var INCIDENTS = [
    { id: 'INC-GYS-0001', ts: '2026-10-07 06:12:40', type: 'Smart Meter Offline', room: 'B-211', device: 'GYS-MTR-0041', desc: 'Meter tidak mengirim data dalam interval pemantauan.', priority: 'Tinggi', status: 'Open', handledBy: '-', handledAt: '-', resolution: '-' },
    { id: 'INC-GYS-0002', ts: '2026-10-07 07:03:15', type: 'Saldo Rendah', room: 'A-115', device: 'GYS-MTR-0015', desc: 'Saldo meter habis; kamar tanpa listrik.', priority: 'Kritis', status: 'Open', handledBy: '-', handledAt: '-', resolution: '-' },
    { id: 'INC-GYS-0003', ts: '2026-10-07 07:41:02', type: 'Kesalahan Komunikasi', room: '-', device: 'GYS-DCU-003', desc: 'Packet loss 18% di gateway Gedung B; meter melapor via buffer.', priority: 'Kritis', status: 'Handling', handledBy: 'Tono Wijaya', handledAt: '2026-10-07 08:15', resolution: '-' },
    { id: 'INC-GYS-0004', ts: '2026-10-07 08:20:33', type: 'Konsumsi Energi Abnormal', room: 'B-208', device: 'GYS-MTR-0038', desc: 'Konsumsi per jam 3,1x di atas profil dasar kamar.', priority: 'Sedang', status: 'Open', handledBy: '-', handledAt: '-', resolution: '-' },
    { id: 'INC-GYS-0005', ts: '2026-10-07 08:44:19', type: 'Gagal Buat Token', room: 'B-225', device: 'GYS-MTR-0055', desc: 'Token TKN-0005 tidak dapat dikirim ke meter.', priority: 'Tinggi', status: 'Handling', handledBy: 'Andi Saputra', handledAt: '2026-10-07 09:02', resolution: '-' },
    { id: 'INC-GYS-0006', ts: '2026-10-07 09:15:47', type: 'Smart Meter Offline', room: 'C-308', device: 'GYS-MTR-0068', desc: 'Offline berulang kedua dalam 7 hari; perlu cek perangkat keras.', priority: 'Kritis', status: 'Open', handledBy: '-', handledAt: '-', resolution: '-' },
    { id: 'INC-GYS-0007', ts: '2026-10-06 14:22:10', type: 'Kesalahan Meter', room: 'A-106', device: 'GYS-MTR-0006', desc: 'Gangguan relai terdeteksi saat uji mandiri meter.', priority: 'Tinggi', status: 'Resolved', handledBy: 'Tono Wijaya', handledAt: '2026-10-06 16:40', resolution: 'Meter diganti (SN-GYS-24-0006); kamar kembali ke antrean layanan.' },
    { id: 'INC-GYS-0008', ts: '2026-10-06 16:05:29', type: 'DCU Offline', room: '-', device: 'GYS-DCU-003', desc: 'Gateway tidak terjangkau selama 6 menit.', priority: 'Kritis', status: 'Resolved', handledBy: 'Andi Saputra', handledAt: '2026-10-06 16:31', resolution: 'Gateway tersambung kembali; koneksi stabil sejak itu.' },
    { id: 'INC-GYS-0009', ts: '2026-10-06 19:33:51', type: 'Saldo Rendah', room: 'C-310', device: 'GYS-MTR-0070', desc: 'Saldo di bawah ambang Rp15.000.', priority: 'Sedang', status: 'Resolved', handledBy: 'Andi Saputra', handledAt: '2026-10-06 20:10', resolution: 'Pengingat dikirim; karyawan mengisi ulang meter.' },
    { id: 'INC-GYS-0010', ts: '2026-10-05 10:11:26', type: 'Smart Meter Offline', room: 'B-228', device: 'GYS-MTR-0058', desc: 'Meter berhenti melapor setelah pemeliharaan panel.', priority: 'Tinggi', status: 'Resolved', handledBy: 'Tono Wijaya', handledAt: '2026-10-05 11:02', resolution: 'Meter tersambung kembali setelah pekerjaan panel selesai.' },
    { id: 'INC-GYS-0011', ts: '2026-10-07 10:32:54', type: 'Saldo Rendah', room: 'C-320', device: 'GYS-MTR-0080', desc: 'Saldo di bawah ambang Rp15.000.', priority: 'Sedang', status: 'Open', handledBy: '-', handledAt: '-', resolution: '-' },
    { id: 'INC-GYS-0012', ts: '2026-10-06 11:18:37', type: 'Kesalahan Meter', room: 'B-226', device: 'GYS-MTR-0056', desc: 'Penyimpangan kalibrasi di atas toleransi pada fasa B.', priority: 'Sedang', status: 'Handling', handledBy: 'Andi Saputra', handledAt: '2026-10-06 13:25', resolution: '-' },
    { id: 'INC-GYS-0013', ts: '2026-10-06 09:44:03', type: 'Kesalahan Komunikasi', room: 'A-101', device: 'GYS-MTR-0001', desc: 'Respons meter terputus-putus; 4x percobaan dalam 10 menit.', priority: 'Rendah', status: 'Handling', handledBy: 'Tono Wijaya', handledAt: '2026-10-06 10:20', resolution: '-' },
    { id: 'INC-GYS-0014', ts: '2026-10-05 15:47:29', type: 'Gagal Buat Token', room: 'C-320', device: 'GYS-MTR-0080', desc: 'Pembuatan token TKN-0011 habis waktu di gateway.', priority: 'Sedang', status: 'Resolved', handledBy: 'Tono Wijaya', handledAt: '2026-10-05 16:12', resolution: 'Token berhasil dikirim ulang setelah percobaan.' }
  ];

  /* ---------- Derived report datasets (read-only views) ---------- */
  var TOKEN_REPORTS = TRANSACTIONS.map(function (t) {
    var k = TOKENS.filter(function (x) { return x.id === t.token; })[0] || {};
    return { id: t.id, trx: t.id, token: k.no || '-', employee: t.employee, room: t.room, meter: t.meter, amount: t.amount, kwh: k.kwh, date: t.date, status: k.status || t.status };
  });
  var CONSUMPTION = METERS.map(function (m) {
    return { id: m.id, meter: m.id, room: m.room, building: m.building, reading: m.reading, usage: m.usage, credit: m.credit, status: m.status, updated: m.updated };
  });
  var METER_REPORTS = METERS.map(function (m) {
    return { id: m.id, sn: m.sn, room: m.room, dcu: m.dcu, status: m.status, installed: m.installed, updated: m.updated };
  });

  /* Monthly energy token per active employee: auto-generated each 1st, one record
     per period. Current period is Active; past periods are Completed. */
  var MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var MT_NOW = new Date();
  function mtPeriod(off) {
    var d = new Date(MT_NOW.getFullYear(), MT_NOW.getMonth() - off, 1);
    return { key: d.getFullYear() + '-' + pad(d.getMonth() + 1, 2), label: MONTHS_ID[d.getMonth()] + ' ' + d.getFullYear() };
  }
  var MONTHLY_DEFAULT = 100000;
  var MONTHLY_TOKENS = [];
  EMPLOYEES.forEach(function (e, i) {
    if (e.account !== 'Active') return;
    [0, 1, 2].forEach(function (off) {
      var p = mtPeriod(off);
      var adj = off === 2 && i % 11 === 0;
      MONTHLY_TOKENS.push({
        id: 'MTK-' + p.key + '-' + e.id.slice(-4), empId: e.id, period: p.key, label: p.label,
        amount: adj ? 150000 : MONTHLY_DEFAULT, used: null,
        status: off === 0 ? 'Active' : 'Completed',
        source: adj ? 'Penyesuaian' : 'Otomatis', note: adj ? 'Penyesuaian kebutuhan' : '-'
      });
    });
  });

  window.DBM = {
    COMPANY: { name: 'PT. Garuda Yamato Steel', code: 'GYS', industry: 'Steel Manufacturing', dormitory: DORM },
    dorms: DORMS, buildings: BUILDINGS, floors: FLOORS, rooms: ROOMS,
    employees: EMPLOYEES, meters: METERS, dcus: DCUS, tokens: TOKENS,
    transactions: TRANSACTIONS, payments: PAYMENTS, tariffs: TARIFFS,
    notifications: NOTIFICATIONS, users: USERS, roles: ROLES, access: ACCESS,
    exports: EXPORTS, meterHistory: METER_HISTORY, auditLogs: AUDIT_LOGS,
    tokenreports: TOKEN_REPORTS, consumption: CONSUMPTION, trxreports: TRANSACTIONS,
    payreports: PAYMENTS, meterreports: METER_REPORTS, incidents: INCIDENTS,
    monthlyTokens: MONTHLY_TOKENS, monthlyDefault: MONTHLY_DEFAULT
  };
})();
