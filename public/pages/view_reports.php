<?php
header('Content-Type: text/html; charset=utf-8');
require 'connect.php';

// --- PHP LOGIC: Fetch all reported emails ---
$reports = [];
$sql = "SELECT id, sender_email, subject, content, classification, report_time FROM reported_emails ORDER BY report_time DESC LIMIT 200";
$result = mysqli_query($conn, $sql);

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $reports[] = $row;
    }
}

// --- HTML OUTPUT ---
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xem các Báo cáo Email</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 2rem;
            background-color: #f4f7f9;
            color: #333;
        }
        .container {
            max-width: 1600px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #3c8ce7 0%, #00eaff 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 2rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.2rem; margin: 0; }
        .table-container {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.07);
            overflow-x: auto;
        }
        .reports-table {
            width: 100%;
            border-collapse: collapse;
        }
        .reports-table th, .reports-table td {
            padding: 1rem 1.2rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .reports-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .reports-table tr:hover {
            background-color: #f1f3f5;
        }
        .badge {
            padding: 0.3em 0.7em;
            border-radius: 10em;
            font-size: 0.8em;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
        }
        .badge.phishing { background-color: #dc3545; }
        .badge.spam { background-color: #ffc107; color: #333; }
        .badge.suspicious { background-color: #fd7e14; }
        .badge.safe { background-color: #28a745; }
        .empty-message { text-align: center; padding: 4rem; color: #6c757d; }
        .content-cell { max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .back-link { display: inline-block; margin-bottom: 1rem; font-weight: 600; text-decoration: none; color: #007bff; }
    </style>
</head>
<body>

<div class="container">
    <a href="XacMinh.html" class="back-link"><i class="fas fa-arrow-left"></i> Quay lại trang Kiểm tra</a>
    <div class="header">
        <h1><i class="fas fa-flag"></i> Danh sách Email đã được Báo cáo</h1>
    </div>

    <div class="table-container">
        <?php if (!empty($reports)): ?>
            <table class="reports-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Thời gian Báo cáo</th>
                        <th>Phân loại</th>
                        <th>Người gửi</th>
                        <th>Tiêu đề</th>
                        <th>Nội dung (tóm tắt)</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($reports as $report): ?>
                        <tr>
                            <td><?= htmlspecialchars($report['id']) ?></td>
                            <td><?= htmlspecialchars(date('d/m/Y H:i:s', strtotime($report['report_time']))) ?></td>
                            <td>
                                <?php 
                                    $class = strtolower($report['classification']);
                                    // Handle Vietnamese accents for class names
                                    if ($class === 'giả mạo') $class = 'phishing';
                                    if ($class === 'nghi ngờ') $class = 'suspicious';
                                    if ($class === 'an toàn') $class = 'safe';
                                ?>
                                <span class="badge <?= htmlspecialchars($class) ?>">
                                    <?= htmlspecialchars($report['classification']) ?>
                                </span>
                            </td>
                            <td><?= htmlspecialchars($report['sender_email']) ?></td>
                            <td><?= htmlspecialchars($report['subject']) ?></td>
                            <td class="content-cell" title="<?= htmlspecialchars($report['content']) ?>">
                                <?= htmlspecialchars($report['content']) ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p class="empty-message">Chưa có báo cáo nào được lưu.</p>
        <?php endif; ?>
    </div>
</div>

</body>
</html>
<?php
mysqli_close($conn);
?> 