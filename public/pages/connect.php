<?php
$host = '62.146.236.71';
$port = 3306;
$user = 'trinh';
$pass = 'R4mcP3FsePkz2d3C';
$dbname = 'trinh'; // ← thay bằng tên database thật

// Tạo kết nối
$conn = new mysqli($host, $user, $pass, $dbname, $port);

// Kiểm tra kết nối
if ($conn->connect_error) {
    die("❌ Kết nối thất bại: " . $conn->connect_error);
}
echo "✅ Kết nối thành công!";
?>