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

//check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    //get form data
    $from_email = trim($_POST['from_email']);
    $content = trim($_POST['content']);
    $title = trim($_POST['title']);
    
    // Set default values for required fields
    $to_email = 'default@example.com'; // You can modify this as needed
    $received_time = date('Y-m-d H:i:s');

    // Classify the email
    $classification = classifyEmail($title, $content, $from_email);
    $category = $classification['category'];
    $confidence = $classification['confidence'];

    //insert data into email_done table
    $sql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category) VALUES (?, ?, ?, ?, ?, ?)";
    
    //truyen du lieu vao sql
    $stmt = mysqli_prepare($conn, $sql);
    if($stmt){
        mysqli_stmt_bind_param($stmt, "ssssss", $title, $content, $from_email, $to_email, $received_time, $category);
        if(mysqli_stmt_execute($stmt)){
            echo "✅ Email classified and inserted successfully!<br>";
            echo "Category: " . $category . "<br>";
            echo "Confidence: " . round($confidence * 100, 1) . "%<br>";
            header("refresh:3; url=../index.html");
            exit();
        } else{
            echo "ERROR: " . mysqli_error($conn);
        }
        mysqli_stmt_close($stmt);
    } else{
        echo "ERROR: " . mysqli_error($conn);
    }
}
//close connection
mysqli_close($conn);
?>
