<?php
//include database connection
require "connect.php";

echo "<h2>📧 Dữ liệu từ bảng incoming_emails</h2>";

// Get all emails from incoming_emails table
$sql = "SELECT * FROM incoming_emails ORDER BY received_time DESC";
$result = mysqli_query($conn, $sql);

if ($result && mysqli_num_rows($result) > 0) {
    echo "<p>📊 Tổng số email: " . mysqli_num_rows($result) . "</p>";
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%; margin-top: 20px;'>";
    echo "<tr style='background-color: #f0f0f0;'>";
    echo "<th style='padding: 10px;'>ID</th>";
    echo "<th style='padding: 10px;'>Thời gian</th>";
    echo "<th style='padding: 10px;'>Người gửi</th>";
    echo "<th style='padding: 10px;'>Người nhận</th>";
    echo "<th style='padding: 10px;'>Tiêu đề</th>";
    echo "<th style='padding: 10px;'>Nội dung</th>";
    echo "<th style='padding: 10px;'>Category</th>";
    echo "<th style='padding: 10px;'>Level</th>";
    echo "<th style='padding: 10px;'>Confidence</th>";
    echo "</tr>";
    
    while ($row = mysqli_fetch_assoc($result)) {
        echo "<tr>";
        echo "<td style='padding: 10px;'>" . $row['id'] . "</td>";
        echo "<td style='padding: 10px;'>" . date('d/m/Y H:i:s', strtotime($row['received_time'])) . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars($row['from_email']) . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars($row['to_email']) . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars($row['title']) . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars(substr($row['content'], 0, 100)) . (strlen($row['content']) > 100 ? '...' : '') . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars($row['category'] ?? 'N/A') . "</td>";
        echo "<td style='padding: 10px;'>" . htmlspecialchars($row['level'] ?? 'N/A') . "</td>";
        echo "<td style='padding: 10px;'>" . ($row['confidence_score'] ?? 'N/A') . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
} else {
    echo "<p>❌ Không có dữ liệu trong bảng incoming_emails</p>";
    echo "<p>Hãy chạy <a href='check_database.php'>check_database.php</a> để thêm dữ liệu test</p>";
}

// Show table structure
echo "<h3>🔍 Cấu trúc bảng incoming_emails</h3>";
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

mysqli_close($conn);
?> 