<?php
//include database connection
require "connect.php";

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

// Function to process unclassified emails
function processUnclassifiedEmails($conn) {
    // Get emails from incoming_emails that haven't been processed yet
    $sql = "SELECT * FROM incoming_emails WHERE id NOT IN (SELECT DISTINCT incoming_email_id FROM email_done WHERE incoming_email_id IS NOT NULL) ORDER BY received_time DESC";
    $result = mysqli_query($conn, $sql);
    
    $processedCount = 0;
    
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Classify the email
            $classification = classifyEmail($row['title'], $row['content'], $row['from_email']);
            $category = $classification['category'];
            $confidence = $classification['confidence'];
            
            // Insert into email_done table
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
                
                if (mysqli_stmt_execute($stmt)) {
                    $processedCount++;
                }
                mysqli_stmt_close($stmt);
            }
        }
    }
    
    return $processedCount;
}

// Function to get processed emails for display
function getProcessedEmails($conn, $limit = 50) {
    $sql = "SELECT * FROM email_done ORDER BY received_time DESC LIMIT ?";
    $stmt = mysqli_prepare($conn, $sql);
    
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "i", $limit);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        $emails = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $emails[] = $row;
        }
        
        mysqli_stmt_close($stmt);
        return $emails;
    }
    
    return [];
}

// Process emails if this is a POST request
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    header('Content-Type: application/json');
    $processedCount = processUnclassifiedEmails($conn);
    echo json_encode(['success' => true, 'processed' => $processedCount]);
    exit();
}

// Get processed emails for display (GET request)
$processedEmails = getProcessedEmails($conn);

// Generate HTML table for display
?>
<tbody id="emailTableBody">
    <?php if (empty($processedEmails)): ?>
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px; color: #6c757d;">
                📭 Chưa có email nào được xử lý
            </td>
        </tr>
    <?php else: ?>
        <?php foreach ($processedEmails as $email): ?>
            <tr>
                <td class="timestamp">
                    <?php echo date('d/m/Y H:i', strtotime($email['received_time'])); ?>
                </td>
                <td class="email-sender">
                    <?php echo htmlspecialchars($email['from_email']); ?>
                </td>
                <td class="email-title">
                    <?php echo htmlspecialchars($email['title']); ?>
                </td>
                <td class="email-content">
                    <?php echo htmlspecialchars(substr($email['content'], 0, 100)) . (strlen($email['content']) > 100 ? '...' : ''); ?>
                </td>
                <td>
                    <?php
                    $categoryClass = '';
                    switch ($email['category']) {
                        case 'Giả mạo':
                            $categoryClass = 'category-phishing';
                            break;
                        case 'Spam':
                            $categoryClass = 'category-spam';
                            break;
                        case 'Nghi ngờ':
                            $categoryClass = 'category-suspicious';
                            break;
                        case 'An toàn':
                            $categoryClass = 'category-safe';
                            break;
                        default:
                            $categoryClass = 'category-suspicious';
                    }
                    ?>
                    <span class="category-badge <?php echo $categoryClass; ?>">
                        <?php echo htmlspecialchars($email['category']); ?>
                    </span>
                </td>
            </tr>
        <?php endforeach; ?>
    <?php endif; ?>
</tbody>

<?php
//close connection
mysqli_close($conn);
?> 