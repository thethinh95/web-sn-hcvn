import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ Fix icon mặc định không hiển thị khi build (production)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ⚠️ Đổi URL này cho đúng với backend FastAPI bạn đã chạy
const API_URL = "https://web-sn-hcvn-production.up.railway.app";

export default function App() {
  const [tinhList, setTinhList] = useState([]);
  const [selectedTinh, setSelectedTinh] = useState(null);
  const [xaList, setXaList] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/tinh`)
      .then((res) => res.json())
      .then(setTinhList)
      .catch((err) => console.error("Lỗi tải danh sách tỉnh:", err));
  }, []);

  const handleSelectTinh = (mahc) => {
    const tinh = tinhList.find((t) => String(t.mahc) === String(mahc));
    setSelectedTinh(tinh);

    fetch(`${API_URL}/xa/${mahc}`)
      .then((res) => res.json())
      .then(setXaList)
      .catch((err) => console.error("Lỗi tải danh sách xã:", err));
  };

  const columns = [
    { name: "Xã/Phường", selector: (row) => row.ten, sortable: true, wrap: true },
    { name: "Loại", selector: (row) => row.loai, sortable: true },
    { name: "Trước sáp nhập", selector: (row) => row.truocsapnhap, wrap: true },
    { name: "Diện tích (km²)", selector: (row) => row.dientich_km2, sortable: true },
    { name: "Dân số", selector: (row) => row.dan_so, sortable: true },
    { name: "Trung tâm HC", selector: (row) => row.trungtam_hc, wrap: true },
  ];

  // Biểu đồ cơ cấu loại xã/phường/thị trấn
  const loaiCount = xaList.reduce((acc, x) => {
    acc[x.loai] = (acc[x.loai] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(loaiCount).map(([name, value]) => ({
    name,
    value,
  }));

  // Biểu đồ top 10 xã/phường đông dân
  const topDanSo = [...xaList]
    .filter((x) => !isNaN(Number(x.dan_so)))
    .sort((a, b) => Number(b.dan_so) - Number(a.dan_so))
    .slice(0, 10);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-600">
        🌍 Tra cứu đơn vị hành chính Việt Nam
      </h1>

      {/* Chọn tỉnh */}
      <div className="flex justify-center">
        <select
          className="border p-2 rounded w-80"
          onChange={(e) => handleSelectTinh(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            -- Chọn tỉnh/thành phố --
          </option>
          {tinhList.map((t) => (
            <option key={t.mahc} value={t.mahc}>
              {t.ten}
            </option>
          ))}
        </select>
      </div>

      {/* Thông tin tỉnh */}
      {selectedTinh && (
        <div className="p-4 bg-gray-100 rounded shadow-md">
          <h2 className="text-2xl font-semibold">{selectedTinh.ten}</h2>
          <p>📊 Dân số: {selectedTinh.dan_so}</p>
          <p>📐 Diện tích: {selectedTinh.dientich_km2} km²</p>
          <p>🏢 Trung tâm HC: {selectedTinh.trungtam_hc}</p>
        </div>
      )}

      {/* Bảng dữ liệu xã/phường */}
      <DataTable
        title="📋 Danh sách xã/phường"
        columns={columns}
        data={xaList}
        pagination
        highlightOnHover
        striped
      />

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded shadow-md">
          <h3 className="font-semibold text-lg mb-2">Cơ cấu loại đơn vị</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={["#8884d8", "#82ca9d", "#ffc658"][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 border rounded shadow-md">
          <h3 className="font-semibold text-lg mb-2">
            Top 10 xã/phường đông dân
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDanSo}>
              <XAxis dataKey="ten" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="dan_so" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bản đồ Leaflet */}
      {selectedTinh && selectedTinh.vido && selectedTinh.kinhdo && (
        <div className="p-4 border rounded shadow-md">
          <h3 className="font-semibold text-lg mb-2">🗺️ Bản đồ vị trí</h3>
          <MapContainer
            center={[selectedTinh.vido, selectedTinh.kinhdo]}
            zoom={8}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[selectedTinh.vido, selectedTinh.kinhdo]}>
              <Popup>{selectedTinh.ten}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}
