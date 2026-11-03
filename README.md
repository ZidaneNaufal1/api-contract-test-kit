# API Contract Test Kit

Library JavaScript kecil untuk memeriksa status HTTP, header, dan tipe beberapa properti JSON. Cocok sebagai latihan dan alat bantu sederhana untuk endpoint yang dipercayai; bukan pengganti validator OpenAPI atau JSON Schema penuh.

## Mulai

Memerlukan Node.js 20+. Clone repository, lalu jalankan `npm test`. Library tidak membutuhkan dependency eksternal. `npm pack` membuat paket lokal; belum dipublikasikan ke npm.

```js
const { checkContract } = require('./src');
const result = await checkContract('http://localhost:3000/health', {
  status: 200,
  headers: { 'content-type': 'application/json' },
  schema: { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' } } }
});
console.log(result); // { ok: true, errors: [] } jika sesuai
```

Contoh tersebut perlu server lokal yang tersedia dan dapat dijalankan di dalam fungsi async. Timeout default 3 detik, dapat diatur dengan argumen ketiga `{ timeoutMs: 1000 }`.

## Batas dan keamanan

Hanya HTTP GET, tanpa redirect otomatis. Header dibandingkan persis. Subset schema: type string, number, boolean, object, array, null; object dapat memiliki properties dan required. Array tidak memvalidasi item. Keyword lain ditolak saat diperiksa; ini bukan implementasi JSON Schema penuh. Validasi dibatasi ke properti yang hadir, jadi definisi yang tidak dikunjungi belum diperiksa. Kesalahan jaringan dan timeout dilaporkan tanpa menyalin isi respons.

Hanya gunakan URL yang dipercaya: library mengakses jaringan dari komputer pemanggil dan tidak dirancang untuk menerima URL dari pengguna tak tepercaya. Respons JSON dibaca seluruhnya ke memori; tidak ada batas ukuran. Jangan gunakan untuk layanan publik tanpa lapisan pembatas tambahan.

## Kontribusi

Jalankan `npm test`; sertakan tes perilaku dan dokumentasi untuk perubahan. Dibuat dengan bantuan OpenAI Codex. Lisensi MIT.

**English:** A minimal GET response contract checker for trusted endpoints with status, exact headers, a limited JSON type schema, and an abort timeout.
