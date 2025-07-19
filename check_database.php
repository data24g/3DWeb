<?php
//include database connection
require "connect.php";

echo "<h2>🔍 Kiểm tra Database</h2>";

// Check if tables exist
$tables = ['incoming_emails', 'email_done'];

foreach ($tables as $table) {
    $sql = "SHOW TABLES LIKE '$table'";
    $result = mysqli_query($conn, $sql);
    
    if (mysqli_num_rows($result) > 0) {
        echo "✅ Bảng '$table' tồn tại<br>";
        
        // Check table structure
        $structure = mysqli_query($conn, "DESCRIBE $table");
        echo "<strong>Cấu trúc bảng $table:</strong><br>";
        echo "<ul>";
        while ($row = mysqli_fetch_assoc($structure)) {
            echo "<li>{$row['Field']} - {$row['Type']}</li>";
        }
        echo "</ul>";
        
        // Count records
        $count = mysqli_query($conn, "SELECT COUNT(*) as count FROM $table");
        $countRow = mysqli_fetch_assoc($count);
        echo "📊 Số bản ghi: {$countRow['count']}<br><br>";
        
    } else {
        echo "❌ Bảng '$table' KHÔNG tồn tại<br><br>";
    }
}

// Check if email_done table has incoming_email_id column
$checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM email_done LIKE 'incoming_email_id'");
if (mysqli_num_rows($checkColumn) == 0) {
    echo "⚠️ Cột 'incoming_email_id' chưa có trong bảng email_done<br>";
    echo "Chạy lệnh SQL sau để thêm cột:<br>";
    echo "<code>ALTER TABLE email_done ADD COLUMN incoming_email_id int NULL AFTER category;</code><br><br>";
} else {
    echo "✅ Cột 'incoming_email_id' đã tồn tại trong bảng email_done<br><br>";
}

// Check if incoming_emails has data
$incomingCount = mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails");
$incomingRow = mysqli_fetch_assoc($incomingCount);

if ($incomingRow['count'] == 0) {
    echo "⚠️ Bảng incoming_emails chưa có dữ liệu<br>";
    echo "Thêm dữ liệu test vào bảng incoming_emails...<br>";
    
    // Add test data to incoming_emails
    $testEmails = [
        [
            'title' => 'GIẢM GIÁ 90% CHỈ HÔM NAY!!!',
            'content' => 'Click ngay để nhận ưu đãi khủng! Không bỏ lỡ cơ hội này!',
            'from_email' => 'promo@spam.com',
            'to_email' => 'user@example.com',
            'received_time' => date('Y-m-d H:i:s')
        ],
        [
            'title' => 'Tài khoản của bạn sẽ bị khóa',
            'content' => 'Xác minh ngay trong 24 giờ hoặc tài khoản sẽ bị khóa vĩnh viễn',
            'from_email' => 'amaz0n@verification.com',
            'to_email' => 'user@example.com',
            'received_time' => date('Y-m-d H:i:s', strtotime('-1 hour'))
        ],
        [
            'title' => 'Thông báo từ phòng kế toán',
            'content' => 'Kính gửi, vui lòng kiểm tra đính kèm và xác nhận thông tin',
            'from_email' => 'accounting@company.com',
            'to_email' => 'user@example.com',
            'received_time' => date('Y-m-d H:i:s', strtotime('-2 hours'))
        ],
        [
            'title' => 'Thông báo từ trường',
            'content' => 'Kính gửi sinh viên, thông tin quan trọng về lịch học',
            'from_email' => 'info@fpt.edu.vn',
            'to_email' => 'user@example.com',
            'received_time' => date('Y-m-d H:i:s', strtotime('-3 hours'))
        ],
        [
            'title' => 'FREE MIỄN PHÍ 100%!!!',
            'content' => 'Nhận ngay quà tặng miễn phí! Click link bên dưới!',
            'from_email' => 'free@gift.net',
            'to_email' => 'user@example.com',
            'received_time' => date('Y-m-d H:i:s', strtotime('-4 hours'))
        ]
    ];
    
    $insertSql = "INSERT INTO incoming_emails (title, content, from_email, to_email, received_time) VALUES (?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $insertSql);
    
    $insertedCount = 0;
    foreach ($testEmails as $email) {
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "sssss", 
                $email['title'], 
                $email['content'], 
                $email['from_email'], 
                $email['to_email'], 
                $email['received_time']
            );
            
            if (mysqli_stmt_execute($stmt)) {
                $insertedCount++;
            }
        }
    }
    
    if ($stmt) {
        mysqli_stmt_close($stmt);
    }
    
    echo "✅ Đã thêm $insertedCount email test vào bảng incoming_emails<br><br>";
} else {
    echo "✅ Bảng incoming_emails có {$incomingRow['count']} bản ghi<br><br>";
}

// Test email classification
echo "<h3>🧪 Test Email Classification</h3>";

$testEmails = [
    [
        'title' => 'GIẢM GIÁ 90% CHỈ HÔM NAY!!!',
        'content' => 'Click ngay để nhận ưu đãi khủng!',
        'from_email' => 'promo@spam.com'
    ],
    [
        'title' => 'Tài khoản của bạn sẽ bị khóa',
        'content' => 'Xác minh ngay trong 24 giờ',
        'from_email' => 'amaz0n@verification.com'
    ],
    [
        'title' => 'Thông báo từ phòng kế toán',
        'content' => 'Kính gửi, vui lòng kiểm tra đính kèm',
        'from_email' => 'accounting@company.com'
    ],
    [
        'title' => 'Thông báo từ trường',
        'content' => 'Kính gửi sinh viên, thông tin quan trọng',
        'from_email' => 'info@fpt.edu.vn'
    ]
];

// Include classification functions
require "process_emails.php";

foreach ($testEmails as $index => $email) {
    $classification = classifyEmail($email['title'], $email['content'], $email['from_email']);
    echo "<strong>Test $index:</strong><br>";
    echo "Title: {$email['title']}<br>";
    echo "From: {$email['from_email']}<br>";
    echo "Category: {$classification['category']}<br>";
    echo "Confidence: " . round($classification['confidence'] * 100, 1) . "%<br><br>";
}

// Show recent emails from incoming_emails
echo "<h3>📧 Email gần đây từ incoming_emails</h3>";
$recentEmails = mysqli_query($conn, "SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT 5");

if (mysqli_num_rows($recentEmails) > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Thời gian</th><th>Người gửi</th><th>Tiêu đề</th><th>Nội dung</th></tr>";
    
    while ($email = mysqli_fetch_assoc($recentEmails)) {
        echo "<tr>";
        echo "<td>" . date('d/m/Y H:i', strtotime($email['received_time'])) . "</td>";
        echo "<td>" . htmlspecialchars($email['from_email']) . "</td>";
        echo "<td>" . htmlspecialchars($email['title']) . "</td>";
        echo "<td>" . htmlspecialchars(substr($email['content'], 0, 50)) . "...</td>";
        echo "</tr>";
    }
    
    echo "</table>";
} else {
    echo "❌ Không có email nào trong bảng incoming_emails";
}

mysqli_close($conn);
?> 