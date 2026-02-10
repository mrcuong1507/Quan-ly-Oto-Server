const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// --- DÁN THÔNG TIN SUPABASE CỦA BẠN VÀO ĐÂY ---
const SUPABASE_URL = 'https://fzbosmhyujvivdebipql.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ym9zbWh5dWp2aXZkZWJpcHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjgyODUsImV4cCI6MjA4NjMwNDI4NX0.jTQPveZcU-6M8V79HkAZdlqp9knPxCg_b9uWAvCGfSw';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hàm khởi tạo dữ liệu từ cars.json lên Supabase
async function initData() {
    try {
        console.log("⏳ Đang kiểm tra dữ liệu trên Supabase...");
        
        // 1. Kiểm tra xem trong bảng đã có dòng nào chưa
        const { data, error: fetchError } = await supabase.from('CarManager').select('*').limit(1);

        if (fetchError) {
            console.error("❌ Lỗi truy vấn bảng:", fetchError.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log("⚠️ Supabase trống hoàn toàn, đang tạo dòng đầu tiên...");
            const localData = JSON.parse(fs.readFileSync('cars.json', 'utf8'));
            
            // Ép ID = 1 để dễ quản lý
            const { error: insertError } = await supabase
                .from('CarManager')
                .insert([{ id: 1, data_json: localData }]);

            if (insertError) {
                console.error("❌ Lỗi khi Insert:", insertError.message);
                console.log("💡 Gợi ý: Kiểm tra xem bạn đã tạo cột 'data_json' với kiểu 'jsonb' chưa?");
            } else {
                console.log("✅ ĐÃ ĐỒNG BỘ LÊN CLOUD THÀNH CÔNG!");
            }
        } else {
            console.log("✅ KẾT NỐI CLOUD THÀNH CÔNG (Đã có dữ liệu)!");
        }
    } catch (err) {
        console.error("❌ Lỗi ngoại lệ:", err.message);
    }
}
initData();

app.get('/get-data', async (req, res) => {
    const { data } = await supabase.from('CarManager').select('data_json').single();
    res.json(data ? data.data_json : { cars: [], members: [] });
});

app.post('/save-data', async (req, res) => {
    // Cập nhật dòng đầu tiên trong table
    const { error } = await supabase.from('CarManager')
        .update({ data_json: req.body })
        .eq('id', 1); // Giả sử dòng đầu tiên có ID là 1
    
    if (error) res.status(500).json(error);
    else res.json({ message: "Lưu Cloud thành công!" });
});

app.listen(3000, () => console.log("🚀 Server chạy tại port 3000 qua cổng HTTPS"));