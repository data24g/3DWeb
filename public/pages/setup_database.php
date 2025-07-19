<?php
header('Content-Type: text/html; charset=utf-8');
require 'connect.php';

echo "<h1>Thiết lập Cơ sở dữ liệu</h1>";

// --- SQL to create the table ---
// We use TEXT for content to allow for long emails.
// We use VARCHAR(255) for sender and subject.
$sql = "
CREATE TABLE IF NOT EXISTS reported_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    classification VARCHAR(50) NOT NULL,
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
";

// --- Execute the query ---
if (mysqli_query($conn, $sql)) {
    echo "<p style='color: green; font-weight: bold;'>✅ Bảng `reported_emails` đã được tạo thành công hoặc đã tồn tại.</p>";
    echo "<p>Bây giờ bạn đã sẵn sàng để lưu các báo cáo.</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>❌ Lỗi khi tạo bảng: " . mysqli_error($conn) . "</p>";
}

mysqli_close($conn);

echo "<hr>";
echo "<a href='XacMinh.html'>Quay lại trang Kiểm tra Email</a>";
?> 