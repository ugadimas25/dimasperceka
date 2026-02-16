# Implementasi Province & District di Popup Farm Polygons (maps/all_actors_new)

## Tujuan
Menambahkan informasi **Province [Producer]**, **Province [Plot]**, **District [Producer]**, **District [Plot]** pada popup Farm Polygons di halaman `maps/all_actors_new`. Data diambil dari tabel `ktv_eudr_summ_dtl_v3` di database `koltitrace_reporting_data`.

## Mapping Kolom

| Label di Popup | Kolom di `ktv_eudr_summ_dtl_v3` | Key di JSON response |
|---|---|---|
| Province [Producer] | `provincename` | `ProvinceNameProducer` |
| Province [Plot] | `provincename_plot` | `ProvinceNamePlot` |
| District [Producer] | `districtname` | `DistrictNameProducer` |
| District [Plot] | `districtname_plot` | `DistrictNamePlot` |

## File yang Diubah

### 1. `api/application/models/map/mmaps_new.php`

#### a. Fungsi `GetFarmPolygon()` (sekitar line 694, setelah block query utama selesai)

Tambahkan kode berikut **setelah** block:
```php
if (strpos($Key, ',') !== false) {
    $DataReturn["Data"]  = $this->db->query($sql)->result_array();
}else{
    $p = array(
        '%'.$Key.'%','%'.$Key.'%'
    );
    $DataReturn["Data"]  = $this->db->query($sql,$p)->result_array();
}
```

Dan **sebelum** `return $DataReturn;`, sisipkan:

```php
// Enrich farm polygon data with province/district info from reporting DB
if (!empty($DataReturn["Data"])) {
    $ktv_report = $this->load->database('ktv_report', TRUE);

    $plots = [];
    foreach ($DataReturn["Data"] as $row) {
        $plots[] = $ktv_report->escape((int)$row['SupplierID'] . $row['FarmNr']);
    }
    $plotsIn = implode(',', array_unique($plots));
    $partnerFilter = (int)$PartnerID;

    $sqlReport = "SELECT
                    CONCAT(supplierid, farmnr) AS plot_key,
                    provincename,
                    provincename_plot,
                    districtname AS districtname_report,
                    districtname_plot
                  FROM ktv_eudr_summ_dtl_v3
                  WHERE partnerid = {$partnerFilter}
                    AND CONCAT(supplierid, farmnr) IN ({$plotsIn})";

    $reportResult = $ktv_report->query($sqlReport)->result_array();

    // Index by plot_key for fast lookup
    $reportMap = [];
    foreach ($reportResult as $r) {
        $reportMap[$r['plot_key']] = $r;
    }

    // Merge into main data
    foreach ($DataReturn["Data"] as &$row) {
        $key = (int)$row['SupplierID'] . $row['FarmNr'];
        if (isset($reportMap[$key])) {
            $row['ProvinceNameProducer'] = $reportMap[$key]['provincename'] ?: '-';
            $row['ProvinceNamePlot']     = $reportMap[$key]['provincename_plot'] ?: '-';
            $row['DistrictNameProducer']  = $reportMap[$key]['districtname_report'] ?: '-';
            $row['DistrictNamePlot']      = $reportMap[$key]['districtname_plot'] ?: '-';
        } else {
            $row['ProvinceNameProducer'] = '-';
            $row['ProvinceNamePlot']     = '-';
            $row['DistrictNameProducer']  = '-';
            $row['DistrictNamePlot']      = '-';
        }
    }
    unset($row);
}
```

#### b. Fungsi `GetFarmPolygon172()` (kode identik, tapi perhatikan `FarmNrSystem`)

Tambahkan kode berikut di posisi yang sama (setelah query utama, sebelum `return`):

```php
// Enrich farm polygon data with province/district info from reporting DB
if (!empty($DataReturn["Data"])) {
    $ktv_report = $this->load->database('ktv_report', TRUE);

    $plots = [];
    foreach ($DataReturn["Data"] as $row) {
        $farmNrKey = isset($row['FarmNrSystem']) ? $row['FarmNrSystem'] : $row['FarmNr'];
        $plots[] = $ktv_report->escape((int)$row['SupplierID'] . $farmNrKey);
    }
    $plotsIn = implode(',', array_unique($plots));
    $partnerFilter = 172;

    $sqlReport = "SELECT
                    CONCAT(supplierid, farmnr) AS plot_key,
                    provincename,
                    provincename_plot,
                    districtname AS districtname_report,
                    districtname_plot
                  FROM ktv_eudr_summ_dtl_v3
                  WHERE partnerid = {$partnerFilter}
                    AND CONCAT(supplierid, farmnr) IN ({$plotsIn})";

    $reportResult = $ktv_report->query($sqlReport)->result_array();

    $reportMap = [];
    foreach ($reportResult as $r) {
        $reportMap[$r['plot_key']] = $r;
    }

    foreach ($DataReturn["Data"] as &$row) {
        $farmNrKey = isset($row['FarmNrSystem']) ? $row['FarmNrSystem'] : $row['FarmNr'];
        $key = (int)$row['SupplierID'] . $farmNrKey;
        if (isset($reportMap[$key])) {
            $row['ProvinceNameProducer'] = $reportMap[$key]['provincename'] ?: '-';
            $row['ProvinceNamePlot']     = $reportMap[$key]['provincename_plot'] ?: '-';
            $row['DistrictNameProducer']  = $reportMap[$key]['districtname_report'] ?: '-';
            $row['DistrictNamePlot']      = $reportMap[$key]['districtname_plot'] ?: '-';
        } else {
            $row['ProvinceNameProducer'] = '-';
            $row['ProvinceNamePlot']     = '-';
            $row['DistrictNameProducer']  = '-';
            $row['DistrictNamePlot']      = '-';
        }
    }
    unset($row);
}
```

> **Catatan:** Di `GetFarmPolygon172`, kolom `FarmNr` di-rename menjadi alias `FarmNr` (dari `ksfs.FarmNrUser`), sedangkan farm number asli ada di `FarmNrSystem` (dari `ksfs.FarmNr`). Join ke `ktv_eudr_summ_dtl_v3` harus pakai `FarmNrSystem`.

---

### 2. `js/modules/maps/new_map_events.js`

#### a. Buat popup body scrollable

Cari:
```js
bodyPanel   += `<div style="margin:10px">`
```

Ganti menjadi:
```js
bodyPanel   += `<div style="margin:10px; max-height:350px; overflow-y:auto">`
```

#### b. Tambahkan 4 field baru di popup Farm Polygons (tag `isFarmPolygon`)

Cari block `detailList` dalam kondisi `if(isFarmPolygon.includes(tag))`:
```js
detailList = [
    {label: "ID"            , value: data.SupplierDisplayID},
    {label: "Farmer Name"   , value: data.SupplierName},
    ...
    {label: "Date Collection", value: data.DateUpdated},
]
```

Ganti menjadi:
```js
detailList = [
    {label: "ID"            , value: data.SupplierDisplayID},
    {label: "Producer Name" , value: data.SupplierName},
    {label: "Farmer Nr"     , value: data.FarmNr},
    {label: "Farmer Nr User", value: data.FarmNrUser},
    {label: "Revision"      , value: data.PolygonRevision},
    {label: "Ha Survey"     , value: data.FarmArea},
    {label: "Ha Polygon"    , value: data.PolygonFarmArea},
    {label: "Date Collection", value: data.DateUpdated},
    {label: "Province [Producer]", value: data.ProvinceNameProducer || "-"},
    {label: "Province [Plot]"    , value: data.ProvinceNamePlot || "-"},
    {label: "District [Producer]", value: data.DistrictNameProducer || "-"},
    {label: "District [Plot]"    , value: data.DistrictNamePlot || "-"},
]
```

#### c. Tambahkan 4 field baru di popup Farm Polygon Issues

Cari block `detailList` dalam kondisi `farm-polygon-issues-*`:
```js
detailList = [
    {label: "Farmer Nr"     , value: data.FarmNr},
    {label: "Farmer Nr User", value: data.FarmNrUser},
    {label: "Ha Polygon"    , value: data.PolygonFarmArea},
    {label: "Location"      , value: location},
]
```

Ganti menjadi:
```js
detailList = [
    {label: "Farmer Nr"     , value: data.FarmNr},
    {label: "Farmer Nr User", value: data.FarmNrUser},
    {label: "Ha Polygon"    , value: data.PolygonFarmArea},
    {label: "Location"      , value: location},
    {label: "Province [Producer]", value: data.ProvinceNameProducer || "-"},
    {label: "Province [Plot]"    , value: data.ProvinceNamePlot || "-"},
    {label: "District [Producer]", value: data.DistrictNameProducer || "-"},
    {label: "District [Plot]"    , value: data.DistrictNamePlot || "-"},
]
```

---

## Prasyarat
- Database `koltitrace_reporting_data` harus bisa diakses (konfigurasi `ktv_report` di `api/application/config/database.php` sudah ada).
- Tabel `ktv_eudr_summ_dtl_v3` harus memiliki kolom: `supplierid`, `farmnr`, `partnerid`, `provincename`, `provincename_plot`, `districtname`, `districtname_plot`.

## Cara Kerja
1. Backend query utama mengambil farm polygon data dari database default (seperti biasa).
2. Setelah hasil didapat, backend membuat query kedua ke `koltitrace_reporting_data.ktv_eudr_summ_dtl_v3` menggunakan `CONCAT(supplierid, farmnr)` sebagai key penghubung.
3. Hasil enrichment di-merge ke setiap row data polygon sebagai 4 kolom baru.
4. Frontend menampilkan 4 kolom baru tersebut di popup ketika polygon diklik.
5. Popup dibuat scrollable (`max-height: 350px; overflow-y: auto`) supaya konten tidak memanjang keluar layar.
