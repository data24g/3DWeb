<?php
//include database connection
require "connect.php";

echo "✅ Kết nối thành công!<br><br>";

// Check if tables exist
$tables = ['incoming_emails', 'email_done'];

foreach ($tables as $table) {
    $result = mysqli_query($conn, "SHOW TABLES LIKE '$table'");
    if (mysqli_num_rows($result) > 0) {
        echo "✅ Bảng $table tồn tại<br>";
    } else {
        echo "❌ Bảng $table không tồn tại<br>";
    }
}

echo "<br>";

// Check and create incoming_emails table if not exists
$createIncomingTable = "CREATE TABLE IF NOT EXISTS incoming_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    received_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) DEFAULT NULL,
    level VARCHAR(50) DEFAULT NULL,
    confidence_score DECIMAL(5,2) DEFAULT NULL
)";

if (mysqli_query($conn, $createIncomingTable)) {
    echo "✅ Bảng incoming_emails đã được tạo hoặc đã tồn tại<br>";
} else {
    echo "❌ Lỗi tạo bảng incoming_emails: " . mysqli_error($conn) . "<br>";
}

// Check and create email_done table if not exists
$createEmailDoneTable = "CREATE TABLE IF NOT EXISTS email_done (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    received_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,2) DEFAULT NULL
)";

if (mysqli_query($conn, $createEmailDoneTable)) {
    echo "✅ Bảng email_done đã được tạo hoặc đã tồn tại<br>";
} else {
    echo "❌ Lỗi tạo bảng email_done: " . mysqli_error($conn) . "<br>";
}

// Check if incoming_email_id column exists in email_done table
$checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM email_done LIKE 'incoming_email_id'");
if (mysqli_num_rows($checkColumn) == 0) {
    // Add incoming_email_id column
    $addColumn = "ALTER TABLE email_done ADD COLUMN incoming_email_id INT DEFAULT NULL";
    if (mysqli_query($conn, $addColumn)) {
        echo "✅ Đã thêm cột incoming_email_id vào bảng email_done<br>";
    } else {
        echo "❌ Lỗi thêm cột incoming_email_id: " . mysqli_error($conn) . "<br>";
    }
} else {
    echo "✅ Cột incoming_email_id đã tồn tại trong bảng email_done<br>";
}

echo "<br>";

// Check if incoming_emails table has data
$result = mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails");
$row = mysqli_fetch_assoc($result);

if ($row['count'] == 0) {
    echo "📝 Bảng incoming_emails trống, đang thêm dữ liệu test...<br>";
    
    // Insert test data
    $testEmails = [
        [
            'from_email' => 'spam@promo123.net',
            'to_email' => 'user@example.com',
            'title' => 'GIẢM GIÁ 90% CHỈ HÔM NAY!!! 💰💰💰',
            'content' => 'Chỉ còn 2 giờ để nhận ưu đãi giảm giá 90%! Click ngay link bên dưới để mua hàng với giá cực rẻ! bit.ly/sale123'
        ],
        [
            'from_email' => 'security@amaz0n-verification.com',
            'to_email' => 'user@example.com',
            'title' => 'Tài khoản Amazon của bạn bị khóa - Cần xác minh khẩn',
            'content' => 'Tài khoản Amazon của bạn đã bị khóa do hoạt động bất thường. Vui lòng xác minh thông tin trong vòng 24 giờ để tránh bị xóa vĩnh viễn.'
        ],
        [
            'from_email' => 'admin@fpt.edu.vn',
            'to_email' => 'student@fpt.edu.vn',
            'title' => 'Thông báo lịch học tuần tới',
            'content' => 'Kính gửi sinh viên, Lịch học tuần tới sẽ có một số thay đổi. Vui lòng kiểm tra email để biết thêm chi tiết.'
        ],
        [
            'from_email' => 'urgent@system-admin.info',
            'to_email' => 'user@example.com',
            'title' => 'Cập nhật thông tin quan trọng - Hạn chót',
            'content' => 'Vui lòng cung cấp thông tin xác nhận trong vòng 6 giờ. Truy cập link bên dưới để cập nhật thông tin bảo mật.'
        ],
        [
            'from_email' => 'gmail@gmail.com',
            'to_email' => 'user@example.com',
            'title' => 'Xác nhận đăng ký tài khoản',
            'content' => 'Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác nhận email này để hoàn tất quá trình đăng ký.'
        ]
    ];
    
    $insertSql = "INSERT INTO incoming_emails (from_email, to_email, title, content) VALUES (?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $insertSql);
    
    $insertedCount = 0;
    foreach ($testEmails as $email) {
        mysqli_stmt_bind_param($stmt, "ssss", 
            $email['from_email'], 
            $email['to_email'], 
            $email['title'], 
            $email['content']
        );
        if (mysqli_stmt_execute($stmt)) {
            $insertedCount++;
        }
    }
    
    echo "✅ Đã thêm $insertedCount email test vào bảng incoming_emails<br>";
    mysqli_stmt_close($stmt);
} else {
    echo "📊 Bảng incoming_emails có {$row['count']} email<br>";
}

echo "<br>";

// Show table structures
echo "<h3>📋 Cấu trúc bảng incoming_emails:</h3>";
$structure = mysqli_query($conn, "DESCRIBE incoming_emails");
if ($structure) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background-color: #f0f0f0;'>";
    echo "<th style='padding: 10px;'>Field</th>";
    echo "<th style='padding: 10px;'>Type</th>";
    echo "<th style='padding: 10px;'>Null</th>";
    echo "<th style='padding: 10px;'>Key</th>";
    echo "<th style='padding: 10px;'>Default</th>";
    echo "<th style='padding: 10px;'>Extra</th>";
    echo "</tr>";
    
    while ($row = mysqli_fetch_assoc($structure)) {
        echo "<tr>";
        echo "<td style='padding: 10px;'>" . $row['Field'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Type'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Null'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Key'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Default'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

echo "<br>";

echo "<h3>📋 Cấu trúc bảng email_done:</h3>";
$structure = mysqli_query($conn, "DESCRIBE email_done");
if ($structure) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background-color: #f0f0f0;'>";
    echo "<th style='padding: 10px;'>Field</th>";
    echo "<th style='padding: 10px;'>Type</th>";
    echo "<th style='padding: 10px;'>Null</th>";
    echo "<th style='padding: 10px;'>Key</th>";
    echo "<th style='padding: 10px;'>Default</th>";
    echo "<th style='padding: 10px;'>Extra</th>";
    echo "</tr>";
    
    while ($row = mysqli_fetch_assoc($structure)) {
        echo "<tr>";
        echo "<td style='padding: 10px;'>" . $row['Field'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Type'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Null'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Key'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Default'] . "</td>";
        echo "<td style='padding: 10px;'>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

echo "<br>";
echo "<a href='view_incoming_emails.php' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>📧 Xem Email Incoming</a> ";
echo "<a href='email_dashboard.html' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>📊 Dashboard</a>";

mysqli_close($conn);
?> 