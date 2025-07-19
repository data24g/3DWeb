<?php
//include database connection
require "connect.php";
mysqli_set_charset($conn, "utf8mb4");

// --- START OF PHP LOGIC SECTION ---

// Email classification patterns (converted from JavaScript)
$EMAIL_PATTERNS = [
    'spam' => [
        'basic' => [
            'titlePatterns' => [
                '/GIẢM GIÁ.*[0-9]{2,}%/i',
                '/CHỈ.*HÔM NAY/i',
                '/KHUYẾN MÃI.*KHỦNG/i',
                '/💰|🎉|🔥|⭐|💯/',
                '/!!!/',
                '/\$\$\$/',
                '/CLICK.*NGAY/i',
                '/FREE|MIỄN PHÍ.*100%/i'
            ],
            'contentPatterns' => [
                '/giảm giá.*[789][0-9]%/i',
                '/chỉ còn.*[0-9]+.*giờ/i',
                '/click.*ngay.*link/i',
                '/bit\.ly|tinyurl|short\.link/',
                '/!!!|💰💰💰/'
            ],
            'fromDomainPatterns' => [
                '/promo|deals|sale|offer|discount/i',
                '/\d{2,}\.net|\.tk|\.ml/'
            ]
        ]
    ],
    'phishing' => [
        'basic' => [
            'titlePatterns' => [
                '/bảo mật|security/i',
                '/tài khoản.*bị.*khóa/i',
                '/xác (minh|nhận|thực).*khẩn/i',
                '/cập nhật.*ngay/i'
            ],
            'contentPatterns' => [
                '/tài khoản.*sẽ bị.*khóa/i',
                '/xác (minh|nhận).*trong.*[0-9]+.*giờ/i',
                '/click.*link.*xác (minh|nhận)/i',
                '/cập nhật.*thông tin.*bảo mật/i'
            ],
            'fromDomainPatterns' => [
                '/[0-9]/',
                '/-verification|-security|-account/i',
                '/\.tk|\.ml|\.ga|\.cf/'
            ],
            'brandSpoofing' => [
                '/amaz[0o]n/i',
                '/g[0o]{2}gle/i',
                '/micr[0o]soft/i',
                '/payp[a@]l/i',
                '/faceb[0o]{2}k/i'
            ]
        ]
    ],
    'suspicious' => [
        'basic' => [
            'titlePatterns' => [
                '/khẩn|gấp|urgent/i',
                '/hạn chót|deadline/i',
                '/quan trọng.*cập nhật/i'
            ],
            'contentPatterns' => [
                '/vui lòng.*cung cấp/i',
                '/xác nhận.*thông tin/i',
                '/truy cập.*link.*bên dưới/i',
                '/trong vòng.*[0-9]+.*giờ/i'
            ],
            'fromDomainPatterns' => [
                '/\.(info|click|site|online)$/i',
                '/-system|-admin/i'
            ]
        ]
    ],
    'safe' => [
        'requiredPatterns' => [
            'fromDomainPatterns' => [
                '/@fpt\.edu\.vn$/',
                '/@[a-z]+\.edu\.vn$/',
                '/@(gmail|outlook|yahoo)\.com$/',
                '/@[a-z]+(corp|company|university)\.(com|vn|edu)$/'
            ]
        ]
    ]
];

// Email classification function
function classifyEmail($title, $content, $from_email) {
    global $EMAIL_PATTERNS;
    
    // Check for Phishing first (most dangerous)
    $phishingCheck = checkPhishing($title, $content, $from_email);
    if ($phishingCheck['isPhishing']) {
        return [
            'category' => 'Giả mạo',
            'confidence' => $phishingCheck['confidence']
        ];
    }

    // Check for Spam
    $spamCheck = checkSpam($title, $content, $from_email);
    if ($spamCheck['isSpam']) {
        return [
            'category' => 'Spam',
            'confidence' => $spamCheck['confidence']
        ];
    }

    // Check for Suspicious
    $suspiciousCheck = checkSuspicious($title, $content, $from_email);
    if ($suspiciousCheck['isSuspicious']) {
        return [
            'category' => 'Nghi ngờ',
            'confidence' => $suspiciousCheck['confidence']
        ];
    }

    // Check for Safe
    $safeCheck = checkSafe($title, $content, $from_email);
    if ($safeCheck['isSafe']) {
        return [
            'category' => 'An toàn',
            'confidence' => $safeCheck['confidence']
        ];
    }

    // Default to suspicious if unclear
    return [
        'category' => 'Nghi ngờ',
        'confidence' => 0.3
    ];
}

// Phishing detection
function checkPhishing($title, $content, $from_email) {
    global $EMAIL_PATTERNS;
    $patterns = $EMAIL_PATTERNS['phishing']['basic'];
    $matchCount = 0;

    // Check for brand spoofing
    foreach ($patterns['brandSpoofing'] as $brandPattern) {
        if (preg_match($brandPattern, $from_email) || preg_match($brandPattern, $content)) {
            $matchCount += 2;
        }
    }

    // Check for suspicious domains
    $domain = explode('@', $from_email)[1] ?? '';
    foreach ($patterns['fromDomainPatterns'] as $phishDomain) {
        if (preg_match($phishDomain, $domain)) {
            $matchCount += 2;
        }
    }

    // Check for urgency in title
    foreach ($patterns['titlePatterns'] as $pattern) {
        if (preg_match($pattern, $title)) {
            $matchCount++;
        }
    }

    // Check for suspicious content
    foreach ($patterns['contentPatterns'] as $pattern) {
        if (preg_match($pattern, $content)) {
            $matchCount++;
        }
    }

    $confidence = min($matchCount * 0.25, 1);

    return [
        'isPhishing' => $matchCount >= 2,
        'confidence' => $confidence
    ];
}

// Spam detection
function checkSpam($title, $content, $from_email) {
    global $EMAIL_PATTERNS;
    $patterns = $EMAIL_PATTERNS['spam']['basic'];
    $matchCount = 0;

    // Check for basic spam patterns in title
    foreach ($patterns['titlePatterns'] as $pattern) {
        if (preg_match($pattern, $title)) {
            $matchCount++;
        }
    }

    // Check for spam patterns in content
    foreach ($patterns['contentPatterns'] as $pattern) {
        if (preg_match($pattern, $content)) {
            if (preg_match('/bit\.ly|tinyurl/', $content)) {
                $matchCount += 2;
            } else {
                $matchCount++;
            }
        }
    }

    // Check for spam domains
    $domain = explode('@', $from_email)[1] ?? '';
    foreach ($patterns['fromDomainPatterns'] as $pattern) {
        if (preg_match($pattern, $domain)) {
            $matchCount++;
        }
    }

    $confidence = min($matchCount * 0.3, 1);

    return [
        'isSpam' => $matchCount >= 2,
        'confidence' => $confidence
    ];
}

// Suspicious detection
function checkSuspicious($title, $content, $from_email) {
    global $EMAIL_PATTERNS;
    $patterns = $EMAIL_PATTERNS['suspicious']['basic'];
    $matchCount = 0;

    // Check for urgency patterns in title
    foreach ($patterns['titlePatterns'] as $pattern) {
        if (preg_match($pattern, $title)) {
            $matchCount++;
        }
    }

    // Check for suspicious content patterns
    foreach ($patterns['contentPatterns'] as $pattern) {
        if (preg_match($pattern, $content)) {
            $matchCount++;
        }
    }

    // Check for suspicious domains
    $domain = explode('@', $from_email)[1] ?? '';
    foreach ($patterns['fromDomainPatterns'] as $pattern) {
        if (preg_match($pattern, $domain)) {
            $matchCount++;
        }
    }

    $confidence = min($matchCount * 0.35, 1);

    return [
        'isSuspicious' => $matchCount >= 2,
        'confidence' => $confidence
    ];
}

// Safe detection
function checkSafe($title, $content, $from_email) {
    global $EMAIL_PATTERNS;
    $patterns = $EMAIL_PATTERNS['safe']['requiredPatterns'];
    $safeScore = 0;

    // Check for trusted domains
    foreach ($patterns['fromDomainPatterns'] as $pattern) {
        if (preg_match($pattern, $from_email)) {
            $safeScore += 2;
            break;
        }
    }

    // Email is safe if has trusted domain
    $isSafe = $safeScore >= 2;
    $confidence = $isSafe ? min($safeScore * 0.25, 1) : 0;

    return [
        'isSafe' => $isSafe,
        'confidence' => $confidence
    ];
}

// Function to check if column exists in table
function columnExists($conn, $table, $column) {
    $result = mysqli_query($conn, "SHOW COLUMNS FROM $table LIKE '$column'");
    return mysqli_num_rows($result) > 0;
}

// Function to process and classify emails
function processAndClassifyEmails($conn) {
    // Check if incoming_email_id column exists
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    
    // Get emails from incoming_emails that haven't been processed yet
    $sql = "SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT 100";
    $result = mysqli_query($conn, $sql);
    
    $processedCount = 0;
    $processedEmails = [];
    
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Classify the email
            $classification = classifyEmail($row['title'], $row['content'], $row['from_email']);
            $category = $classification['category'];
            $confidence = $classification['confidence'];
            
            // Check if already processed (using different methods based on column existence)
            $alreadyProcessed = false;
            if ($hasIncomingEmailId) {
                // Use incoming_email_id if column exists
                $checkSql = "SELECT COUNT(*) as count FROM email_done WHERE incoming_email_id = ?";
                $checkStmt = mysqli_prepare($conn, $checkSql);
                if ($checkStmt) {
                    mysqli_stmt_bind_param($checkStmt, "i", $row['id']);
                    mysqli_stmt_execute($checkStmt);
                    $checkResult = mysqli_stmt_get_result($checkStmt);
                    $checkRow = mysqli_fetch_assoc($checkResult);
                    $alreadyProcessed = $checkRow['count'] > 0;
                    mysqli_stmt_close($checkStmt);
                }
            } else {
                // Use email content and sender to check for duplicates
                $checkSql = "SELECT COUNT(*) as count FROM email_done WHERE from_email = ? AND title = ? AND content = ?";
                $checkStmt = mysqli_prepare($conn, $checkSql);
                if ($checkStmt) {
                    mysqli_stmt_bind_param($checkStmt, "sss", $row['from_email'], $row['title'], $row['content']);
                    mysqli_stmt_execute($checkStmt);
                    $checkResult = mysqli_stmt_get_result($checkStmt);
                    $checkRow = mysqli_fetch_assoc($checkResult);
                    $alreadyProcessed = $checkRow['count'] > 0;
                    mysqli_stmt_close($checkStmt);
                }
            }
            
            if (!$alreadyProcessed) {
                // Insert into email_done table
                if ($hasIncomingEmailId) {
                    $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, incoming_email_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    $stmt = mysqli_prepare($conn, $insertSql);
                    if ($stmt) {
                        mysqli_stmt_bind_param($stmt, "ssssssi", 
                            $row['title'], 
                            $row['content'], 
                            $row['from_email'], 
                            $row['to_email'], 
                            $row['received_time'], 
                            $category,
                            $row['id']
                        );
                    }
                } else {
                    $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category) VALUES (?, ?, ?, ?, ?, ?)";
                    $stmt = mysqli_prepare($conn, $insertSql);
                    if ($stmt) {
                        mysqli_stmt_bind_param($stmt, "ssssss", 
                            $row['title'], 
                            $row['content'], 
                            $row['from_email'], 
                            $row['to_email'], 
                            $row['received_time'], 
                            $category
                        );
                    }
                }
                
                if ($stmt && mysqli_stmt_execute($stmt)) {
                    $processedCount++;
                    $processedEmails[] = [
                        'id' => $row['id'],
                        'title' => $row['title'],
                        'from_email' => $row['from_email'],
                        'category' => $category,
                        'confidence' => $confidence,
                        'received_time' => $row['received_time']
                    ];
                    mysqli_stmt_close($stmt);
                }
            }
        }
    }
    
    return ['count' => $processedCount, 'emails' => $processedEmails];
}

// --- END OF PHP LOGIC SECTION ---
// --- START HTML OUTPUT ---

// Process emails if requested, store result in a variable
$processing_result = null;
if (isset($_GET['process']) && $_GET['process'] == '1') {
    $processing_result = processAndClassifyEmails($conn);
}

// Start outputting the HTML document
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hệ thống phân loại email</title>
<style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: #333;
    }
    
    .container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    
    .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
    }
    
    .header h1 {
        font-size: 2.5em;
        margin-bottom: 10px;
    }
    
    .header p {
        font-size: 1.1em;
        opacity: 0.9;
    }
    
    .controls {
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    }
    
    .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-2px);
    }
    
    .btn-success {
        background: #28a745;
        color: white;
    }
    
    .btn-success:hover {
        background: #1e7e34;
        transform: translateY(-2px);
    }
    
    .btn-info {
        background: #17a2b8;
        color: white;
    }
    
    .btn-info:hover {
        background: #138496;
        transform: translateY(-2px);
    }
    
    .status {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        display: inline-block;
        font-size: 14px;
    }
    
    .status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .status.processing {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .section {
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
    }
    
    .section h2 {
        color: #333;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.5em;
    }
    
    .table-container {
        overflow-x: auto;
        margin-top: 20px;
    }
    
    .email-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        font-size: 14px;
    }
    
    .email-table th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        text-align: left;
        font-weight: 600;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .email-table td {
        padding: 15px;
        border-bottom: 1px solid #e9ecef;
        vertical-align: top;
        line-height: 1.5;
    }
    
    .email-table tr:hover {
        background: #f8f9fa;
    }
    
    .category-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
    }
    
    .category-phishing {
        background: #dc3545;
        color: white;
    }
    
    .category-spam {
        background: #ffc107;
        color: #212529;
    }
    
    .category-suspicious {
        background: #fd7e14;
        color: white;
    }
    
    .category-safe {
        background: #28a745;
        color: white;
    }
    
    .email-content {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .email-title {
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
    }
    
    .email-sender {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #6c757d;
    }
    
    .timestamp {
        font-size: 0.8em;
        color: #6c757d;
        white-space: nowrap;
    }
    
    .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 20px;
        background: #f8f9fa;
    }
    
    .stat-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .stat-number {
        font-size: 2em;
        font-weight: bold;
        color: #667eea;
        margin-bottom: 5px;
    }
    
    .stat-label {
        color: #6c757d;
        font-size: 0.9em;
    }
    
    .empty-message {
        text-align: center;
        padding: 40px;
        color: #6c757d;
        font-style: italic;
        font-size: 1.1em;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .controls {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .email-table th, 
        .email-table td {
            padding: 10px;
            font-size: 0.8em;
        }
        
        .email-title, 
        .email-content {
            max-width: 150px;
        }
    }
</style>
</head>
<body>

<div class='container'>
    <div class='header'>
        <h1>📧 Hệ thống phân loại email</h1>
        <p>Phân loại email tự động với độ tin cậy cao</p>
    </div>

    <?php
    // Display processing result if it exists
    if ($processing_result) {
        echo "<div class='controls'>";
        echo "<div class='status success'>";
        echo "✅ Đã xử lý và phân loại {$processing_result['count']} email mới!";
        echo "</div>";
        echo "<a href='?' class='btn btn-primary'>🔄 Làm mới</a>";
        echo "<a href='email_dashboard.html' class='btn btn-info'>📊 Dashboard</a>";
        echo "</div>";
    }

    // Statistics Section
    $incomingCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    $processedCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM email_done"))['count'];

    echo "<div class='stats'>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>".number_format($incomingCount)."</div>";
    echo "<div class='stat-label'>Email gốc</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>".number_format($processedCount)."</div>";
    echo "<div class='stat-label'>Đã xử lý</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>".number_format($incomingCount - $processedCount)."</div>";
    echo "<div class='stat-label'>Chưa xử lý</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>".round(($processedCount / max($incomingCount, 1)) * 100)."%</div>";
    echo "<div class='stat-label'>Tỷ lệ xử lý</div>";
    echo "</div>";
    echo "</div>";

    // Controls Section
    echo "<div class='controls'>";
    echo "<div>";
    echo "<a href='?process=1' class='btn btn-primary'>🔄 Xử lý và phân loại email</a>";
    echo "<a href='check_database.php' class='btn btn-info'>🔧 Kiểm tra cơ sở dữ liệu</a>";
    echo "<a href='email_dashboard.html' class='btn btn-success'>📊 Xem bảng điều khiển</a>";
    echo "</div>";
    echo "<div class='status success'>";
    echo "✅ Hệ thống sẵn sàng";
    echo "</div>";
    echo "</div>";

    // Section 1: Incoming Emails (Raw Data)
    echo "<div class='section'>";
    echo "<h2>📥 Email gốc (chưa xử lý)</h2>";

    $sql = "SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT 100";
    $result = mysqli_query($conn, $sql);

    if ($result && mysqli_num_rows($result) > 0) {
        echo "<div class='table-container'>";
        echo "<table class='email-table'>";
        echo "<thead>";
        echo "<tr>";
        echo "<th>ID</th>";
        echo "<th>Thời gian</th>";
        echo "<th>Người gửi</th>";
        echo "<th>Người nhận</th>";
        echo "<th>Tiêu đề</th>";
        echo "<th>Nội dung</th>";
        echo "</tr>";
        echo "</thead>";
        echo "<tbody>";
        
        while ($row = mysqli_fetch_assoc($result)) {
            echo "<tr>";
            echo "<td>".htmlspecialchars($row['id'])."</td>";
            echo "<td class='timestamp'>".date('d/m/Y H:i:s', strtotime($row['received_time']))."</td>";
            echo "<td class='email-sender'>".htmlspecialchars($row['from_email'])."</td>";
            echo "<td class='email-sender'>".htmlspecialchars($row['to_email'])."</td>";
            echo "<td class='email-title'>".htmlspecialchars($row['title'])."</td>";
            echo "<td class='email-content'>".htmlspecialchars(substr($row['content'], 0, 100)).(strlen($row['content']) > 100 ? '...' : '')."</td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
        echo "</div>";
    } else {
        echo "<div class='empty-message'>";
        echo "📭 Không có email nào trong bảng incoming_emails<br>";
        echo "Hãy chạy <a href='check_database.php'>check_database.php</a> để thêm dữ liệu mẫu";
        echo "</div>";
    }
    echo "</div>";

    // Section 2: Processed Emails (Classified Data)
    echo "<div class='section'>";
    echo "<h2>📋 Email đã xử lý (đã phân loại)</h2>";

    $sql = "SELECT * FROM email_done ORDER BY received_time DESC LIMIT 5000";
    $result = mysqli_query($conn, $sql);

    if ($result && mysqli_num_rows($result) > 0) {
        echo "<div class='table-container'>";
        echo "<table class='email-table'>";
        echo "<thead>";
        echo "<tr>";
        echo "<th>ID</th>";
        echo "<th>Thời gian</th>";
        echo "<th>Người gửi</th>";
        echo "<th>Tiêu đề</th>";
        echo "<th>Nội dung</th>";
        echo "<th>Phân loại</th>";
        echo "<th>Độ tin cậy</th>";
        echo "</tr>";
        echo "</thead>";
        echo "<tbody>";
        
        while ($row = mysqli_fetch_assoc($result)) {
            $categoryClass = '';
            switch ($row['category']) {
                case 'Giả mạo': $categoryClass = 'category-phishing'; break;
                case 'Spam': $categoryClass = 'category-spam'; break;
                case 'Nghi ngờ': $categoryClass = 'category-suspicious'; break;
                case 'An toàn': $categoryClass = 'category-safe'; break;
                default: $categoryClass = '';
            }
            
            echo "<tr>";
            echo "<td>".htmlspecialchars($row['id'])."</td>";
            echo "<td class='timestamp'>".date('d/m/Y H:i:s', strtotime($row['received_time']))."</td>";
            echo "<td class='email-sender'>".htmlspecialchars($row['from_email'])."</td>";
            echo "<td class='email-title'>".htmlspecialchars($row['title'])."</td>";
            echo "<td class='email-content'>".htmlspecialchars(substr($row['content'], 0, 100)).(strlen($row['content']) > 100 ? '...' : '')."</td>";
            echo "<td><span class='category-badge $categoryClass'>".htmlspecialchars($row['category'])."</span></td>";
            echo "<td>".($row['confidence'] ? round($row['confidence'] * 100, 1).'%' : 'N/A')."</td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
        echo "</div>";
    } else {
        echo "<div class='empty-message'>";
        echo "📭 Chưa có email nào được xử lý<br>";
        echo "Nhấn vào nút 'Xử lý và phân loại email' để bắt đầu";
        echo "</div>";
    }
    echo "</div>";

    echo "</div>";

    // FIX: Add closing body and html tags
    echo "</body></html>";

    mysqli_close($conn);
    ?>