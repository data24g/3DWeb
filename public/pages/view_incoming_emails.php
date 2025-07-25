<?php
// Increase execution time and memory limit for large email processing
ini_set('max_execution_time', 300); // 5 minutes
ini_set('memory_limit', '512M'); // 512MB memory
set_time_limit(300); // 5 minutes timeout

//include database connection
require "connect.php";
mysqli_set_charset($conn, "utf8mb4");

// Handle AJAX request for checking new emails
if (isset($_GET['check_new'])) {
    $currentIncomingCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    $currentProcessedCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM email_done"))['count'];
    
    // Get the counts from the main page load
    $mainIncomingCount = isset($_GET['main_incoming']) ? (int)$_GET['main_incoming'] : 0;
    $mainProcessedCount = isset($_GET['main_processed']) ? (int)$_GET['main_processed'] : 0;
    
    $newIncomingEmails = $currentIncomingCount - $mainIncomingCount;
    $newProcessedEmails = $currentProcessedCount - $mainProcessedCount;
    
    header('Content-Type: application/json');
    echo json_encode([
        'new_emails' => $newIncomingEmails,
        'new_processed' => $newProcessedEmails,
        'current_incoming' => $currentIncomingCount,
        'current_processed' => $currentProcessedCount
    ]);
    exit;
}

// Handle add email POST request
if (isset($_POST['add_email'])) {
    $from_email = mysqli_real_escape_string($conn, $_POST['from_email']);
    $to_email = mysqli_real_escape_string($conn, $_POST['to_email']);
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $content = mysqli_real_escape_string($conn, $_POST['content']);
    $received_time = date('Y-m-d H:i:s');
    $sql = "INSERT INTO incoming_emails (from_email, to_email, title, content, received_time) VALUES ('$from_email', '$to_email', '$title', '$content', '$received_time')";
    $insert_result = mysqli_query($conn, $sql);
    if ($insert_result) {
        $add_email_message = "<div class='status success'>✅ Thêm email thành công!</div>";
    } else {
        $add_email_message = "<div class='status error'>❌ Lỗi khi thêm email: ".mysqli_error($conn)."</div>";
    }
}

// --- START OF PHP LOGIC SECTION ---

// Check and add confidence column if it doesn't exist
if (!columnExists($conn, 'email_done', 'confidence')) {
    $alterSql = "ALTER TABLE email_done ADD COLUMN confidence DECIMAL(3,2) DEFAULT NULL";
    mysqli_query($conn, $alterSql);
}

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
    
    // Get total count of unprocessed emails
    $totalCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    
    // Process in batches to avoid timeout
    $batchSize = 100; // Reduced from 500 to 100 for faster processing
    $offset = 0;
    $processedCount = 0;
    $processedEmails = [];
    
    while ($offset < $totalCount) {
        // Get emails from incoming_emails that haven't been processed yet
        $sql = "SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT $batchSize OFFSET $offset";
        $result = mysqli_query($conn, $sql);
        
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
                        $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence, incoming_email_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                        $stmt = mysqli_prepare($conn, $insertSql);
                        if ($stmt) {
                            mysqli_stmt_bind_param($stmt, "ssssssdi", 
                                $row['title'], 
                                $row['content'], 
                                $row['from_email'], 
                                $row['to_email'], 
                                $row['received_time'], 
                                $category,
                                $confidence,
                                $row['id']
                            );
                        }
                    } else {
                        $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)";
                        $stmt = mysqli_prepare($conn, $insertSql);
                        if ($stmt) {
                            mysqli_stmt_bind_param($stmt, "ssssssd", 
                                $row['title'], 
                                $row['content'], 
                                $row['from_email'], 
                                $row['to_email'], 
                                $row['received_time'], 
                                $category,
                                $confidence
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
        
        $offset += $batchSize;
        
        // Add progress information
        $processedEmails[] = [
            'id' => 'batch_' . ($offset / $batchSize),
            'title' => "Batch " . ($offset / $batchSize) . " completed",
            'from_email' => "System",
            'category' => 'Processing',
            'confidence' => 1.0,
            'received_time' => date('Y-m-d H:i:s')
        ];
    }
    
    return ['count' => $processedCount, 'emails' => $processedEmails, 'total_processed' => $totalCount];
}

// Function to process emails in smaller batches
function processAndClassifyEmailsBatch($conn, $currentBatch, $totalBatches) {
    // Check if incoming_email_id column exists
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    
    $batchSize = 100;
    $offset = ($currentBatch - 1) * $batchSize;
    
    // Get only unprocessed emails for this specific batch
    if ($hasIncomingEmailId) {
        $sql = "
            SELECT i.* 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON i.id = e.incoming_email_id 
            WHERE e.id IS NULL 
            ORDER BY i.received_time DESC 
            LIMIT $batchSize OFFSET $offset
        ";
    } else {
        // Use content-based matching if incoming_email_id doesn't exist
        $sql = "
            SELECT i.* 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
            WHERE e.id IS NULL 
            ORDER BY i.received_time DESC 
            LIMIT $batchSize OFFSET $offset
        ";
    }
    
    $result = mysqli_query($conn, $sql);
    
    $processedCount = 0;
    $processedEmails = [];
    $skippedCount = 0;
    
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Classify the email
            $classification = classifyEmail($row['title'], $row['content'], $row['from_email']);
            $category = $classification['category'];
            $confidence = $classification['confidence'];
            
            // Insert into email_done table
            if ($hasIncomingEmailId) {
                $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence, incoming_email_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($conn, $insertSql);
                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "ssssssdi", 
                        $row['title'], 
                        $row['content'], 
                        $row['from_email'], 
                        $row['to_email'], 
                        $row['received_time'], 
                        $category,
                        $confidence,
                        $row['id']
                    );
                }
            } else {
                $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($conn, $insertSql);
                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "ssssssd", 
                        $row['title'], 
                        $row['content'], 
                        $row['from_email'], 
                        $row['to_email'], 
                        $row['received_time'], 
                        $category,
                        $confidence
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
    } else {
        // No unprocessed emails in this batch
        $skippedCount = $batchSize;
    }
    
    return [
        'count' => $processedCount, 
        'emails' => $processedEmails, 
        'current_batch' => $currentBatch,
        'total_batches' => $totalBatches,
        'progress' => round(($currentBatch / $totalBatches) * 100, 1),
        'skipped' => $skippedCount
    ];
}

// Function to check and fix processing issues
function checkProcessingStatus($conn) {
    $total_incoming = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    $total_processed = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM email_done"))['count'];
    
    // Check if incoming_email_id column exists
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    
    // Check for emails that should be processed but aren't
    if ($hasIncomingEmailId) {
        $unprocessed_sql = "
            SELECT i.id, i.from_email, i.title 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON i.id = e.incoming_email_id 
            WHERE e.id IS NULL 
            LIMIT 10
        ";
    } else {
        // Use content-based matching if incoming_email_id doesn't exist
        $unprocessed_sql = "
            SELECT i.id, i.from_email, i.title 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
            WHERE e.id IS NULL 
            LIMIT 10
        ";
    }
    
    $unprocessed_result = mysqli_query($conn, $unprocessed_sql);
    $unprocessed_count = mysqli_num_rows($unprocessed_result);
    
    return [
        'total_incoming' => $total_incoming,
        'total_processed' => $total_processed,
        'unprocessed_count' => $unprocessed_count,
        'unprocessed_samples' => $unprocessed_result,
        'has_incoming_email_id' => $hasIncomingEmailId
    ];
}

// Function to force process all unprocessed emails
function forceProcessAllEmails($conn) {
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    
    // Get all unprocessed emails
    if ($hasIncomingEmailId) {
        $sql = "
            SELECT i.* 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON i.id = e.incoming_email_id 
            WHERE e.id IS NULL 
            ORDER BY i.received_time DESC
        ";
    } else {
        // Use content-based matching if incoming_email_id doesn't exist
        $sql = "
            SELECT i.* 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
            WHERE e.id IS NULL 
            ORDER BY i.received_time DESC
        ";
    }
    
    $result = mysqli_query($conn, $sql);
    
    $processedCount = 0;
    $processedEmails = [];
    
    if ($result && mysqli_num_rows($result) > 0) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Classify the email
            $classification = classifyEmail($row['title'], $row['content'], $row['from_email']);
            $category = $classification['category'];
            $confidence = $classification['confidence'];
            
            // Insert into email_done table
            if ($hasIncomingEmailId) {
                $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence, incoming_email_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($conn, $insertSql);
                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "ssssssdi", 
                        $row['title'], 
                        $row['content'], 
                        $row['from_email'], 
                        $row['to_email'], 
                        $row['received_time'], 
                        $category,
                        $confidence,
                        $row['id']
                    );
                }
            } else {
                $insertSql = "INSERT INTO email_done (title, content, from_email, to_email, received_time, category, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = mysqli_prepare($conn, $insertSql);
                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "ssssssd", 
                        $row['title'], 
                        $row['content'], 
                        $row['from_email'], 
                        $row['to_email'], 
                        $row['received_time'], 
                        $category,
                        $confidence
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
    
    return ['count' => $processedCount, 'emails' => $processedEmails];
}

// --- END OF PHP LOGIC SECTION ---
// --- START HTML OUTPUT ---

// Process emails if requested, store result in a variable
$processing_result = null;
$debug_info = null;

// Auto-process unprocessed emails on page load
$auto_process_on_load = true;
if ($auto_process_on_load) {
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    
    // Check if there are unprocessed emails
    if ($hasIncomingEmailId) {
        $unprocessed_count_sql = "
            SELECT COUNT(*) as count 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON i.id = e.incoming_email_id 
            WHERE e.id IS NULL
        ";
    } else {
        $unprocessed_count_sql = "
            SELECT COUNT(*) as count 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
            WHERE e.id IS NULL
        ";
    }
    
    $unprocessed_result = mysqli_query($conn, $unprocessed_count_sql);
    $unprocessed_count = mysqli_fetch_assoc($unprocessed_result)['count'];
    
    // Also check by simple calculation
    $total_incoming = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    $total_processed = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM email_done"))['count'];
    $calculated_unprocessed = $total_incoming - $total_processed;
    
    // Use the higher number to ensure we process all unprocessed emails
    $actual_unprocessed = max($unprocessed_count, $calculated_unprocessed);
    
    if ($actual_unprocessed > 0) {
        // Auto-process all unprocessed emails
        $processing_result = forceProcessAllEmails($conn);
        $processing_result['auto_processed'] = true;
        $processing_result['unprocessed_count'] = $actual_unprocessed;
        $processing_result['join_count'] = $unprocessed_count;
        $processing_result['calculated_count'] = $calculated_unprocessed;
    } else {
        // All emails are already processed
        $processing_result = [
            'count' => 0,
            'auto_processed' => true,
            'unprocessed_count' => 0,
            'all_processed' => true
        ];
    }
}

if (isset($_GET['process']) && $_GET['process'] == '1') {
    // Check if this is a batch processing request
    $batch = isset($_GET['batch']) ? (int)$_GET['batch'] : 0;
    $total_batches = isset($_GET['total_batches']) ? (int)$_GET['total_batches'] : 0;
    $auto_process = isset($_GET['auto']) ? (bool)$_GET['auto'] : false;
    $force_process = isset($_GET['force']) ? (bool)$_GET['force'] : false;
    
    if ($force_process) {
        // Force process all unprocessed emails
        $processing_result = forceProcessAllEmails($conn);
        $debug_info = checkProcessingStatus($conn);
    } elseif ($batch == 0) {
        // First time processing - calculate total batches based on unprocessed emails
        $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
        
        if ($hasIncomingEmailId) {
            $unprocessed_count_sql = "
                SELECT COUNT(*) as count 
                FROM incoming_emails i 
                LEFT JOIN email_done e ON i.id = e.incoming_email_id 
                WHERE e.id IS NULL
            ";
        } else {
            $unprocessed_count_sql = "
                SELECT COUNT(*) as count 
                FROM incoming_emails i 
                LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
                WHERE e.id IS NULL
            ";
        }
        
        $unprocessed_result = mysqli_query($conn, $unprocessed_count_sql);
        $unprocessed_count = mysqli_fetch_assoc($unprocessed_result)['count'];
        
        $batch_size = 100;
        $total_batches = ceil($unprocessed_count / $batch_size);
        
        if ($total_batches == 0) {
            // No unprocessed emails
            header("Location: ?");
            exit;
        }
        
        if ($auto_process) {
            // Auto processing - redirect to first batch with auto flag
            header("Location: ?process=1&batch=1&total_batches=$total_batches&auto=1");
        } else {
            // Manual processing - redirect to first batch
            header("Location: ?process=1&batch=1&total_batches=$total_batches");
        }
        exit;
    } else {
        // Process specific batch
        $processing_result = processAndClassifyEmailsBatch($conn, $batch, $total_batches);
        $processing_result['auto_process'] = $auto_process;
    }
}

// Check processing status for debug
if (isset($_GET['debug']) && $_GET['debug'] == '1') {
    $debug_info = checkProcessingStatus($conn);
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
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        overflow: hidden;
    }
    
    .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px;
        text-align: center;
    }
    
    .header h1 {
        font-size: 2.8em;
        margin-bottom: 15px;
        font-weight: 300;
    }
    
    .header p {
        font-size: 1.2em;
        opacity: 0.9;
        margin: 0;
    }
    
    .controls {
        padding: 25px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
    }
    
    .btn {
        padding: 15px 30px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        font-size: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
    
    .btn-success {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
    }
    
    .btn-success:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
    }
    
    .btn-info {
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        color: white;
    }
    
    .btn-info:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(23, 162, 184, 0.4);
    }
    
    .btn-secondary {
        background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
        color: white;
    }
    
    .btn-secondary:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
    }
    
    .btn-warning {
        background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        color: #212529;
    }
    
    .btn-warning:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
    }
    
    .status {
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: 600;
        display: inline-block;
        font-size: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .status.success {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .status.info {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .status.processing {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .status.error {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .section {
        padding: 30px;
        border-bottom: 1px solid #e9ecef;
    }
    
    .section h2 {
        color: #333;
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 1.8em;
        font-weight: 600;
    }
    
    .table-container {
        overflow-x: auto;
        margin-top: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    }
    
    .email-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 15px;
        overflow: hidden;
        font-size: 14px;
    }
    
    .email-table th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        text-align: left;
        font-weight: 600;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .email-table td {
        padding: 18px 20px;
        border-bottom: 1px solid #e9ecef;
        vertical-align: top;
        line-height: 1.6;
    }
    
    .email-table tr:hover {
        background: #f8f9fa;
        transform: scale(1.01);
        transition: all 0.2s ease;
    }
    
    .category-badge {
        padding: 8px 16px;
        border-radius: 25px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .category-phishing {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
    }
    
    .category-spam {
        background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        color: #212529;
    }
    
    .category-suspicious {
        background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
        color: white;
    }
    
    .category-safe {
        background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
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
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 25px;
        padding: 30px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    .stat-card {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    }
    
    .stat-number {
        font-size: 2.5em;
        font-weight: bold;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 10px;
    }
    
    .stat-label {
        color: #6c757d;
        font-size: 1em;
        font-weight: 500;
    }
    
    .empty-message {
        text-align: center;
        padding: 60px;
        color: #6c757d;
        font-style: italic;
        font-size: 1.2em;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .controls {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .email-table th, 
        .email-table td {
            padding: 15px;
            font-size: 0.8em;
        }
        
        .email-title, 
        .email-content {
            max-width: 150px;
        }
        
        .stats {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 20px;
        }
        
        .stat-card {
            padding: 20px;
        }
        
        .stat-number {
            font-size: 2em;
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
        
        if (isset($processing_result['auto_processed']) && $processing_result['auto_processed']) {
            if (isset($processing_result['all_processed']) && $processing_result['all_processed']) {
                echo "✅ Tất cả email đã được xử lý và phân loại!";
            } else {
                echo "✅ Tự động xử lý {$processing_result['count']} email chưa được xử lý";
                if (isset($processing_result['join_count']) && isset($processing_result['calculated_count'])) {
                    echo "<br><small>📊 JOIN: {$processing_result['join_count']}, Tính toán: {$processing_result['calculated_count']}</small>";
                }
            }
        } elseif (isset($processing_result['progress'])) {
            echo "✅ Batch {$processing_result['current_batch']}/{$processing_result['total_batches']} - {$processing_result['progress']}% hoàn thành";
            
            if (isset($processing_result['skipped']) && $processing_result['skipped'] > 0) {
                echo "<br><small>⏭️ Bỏ qua {$processing_result['skipped']} email đã xử lý</small>";
            }
            
            if (isset($processing_result['auto_process']) && $processing_result['auto_process']) {
                echo "<br><small>🤖 Đang tự động xử lý...</small>";
            }
        } else {
            if (isset($processing_result['total_processed'])) {
                echo "✅ Đã xử lý {$processing_result['count']} email mới từ tổng số {$processing_result['total_processed']} email";
            } else {
                echo "✅ Đã xử lý {$processing_result['count']} email mới";
            }
        }
        echo "</div>";
        echo "</div>";
    }

    // Add email form and message (moved here)
    if (isset($add_email_message)) echo $add_email_message;
    echo "<div class='controls'>
        <form method='POST' style='display: flex; flex-wrap: wrap; gap: 10px; align-items: center;'>
            <input type='email' name='from_email' placeholder='Người gửi (from_email)' required style='padding:8px; border-radius:6px; border:1px solid #ccc; min-width:180px;'>
            <input type='email' name='to_email' placeholder='Người nhận (to_email)' required style='padding:8px; border-radius:6px; border:1px solid #ccc; min-width:180px;'>
            <input type='text' name='title' placeholder='Tiêu đề' required style='padding:8px; border-radius:6px; border:1px solid #ccc; min-width:180px;'>
            <input type='text' name='content' placeholder='Nội dung' required style='padding:8px; border-radius:6px; border:1px solid #ccc; min-width:220px;'>
            <button type='submit' name='add_email' class='btn btn-success'>Thêm email</button>
        </form>
    </div>";

    // Statistics Section
    $incomingCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM incoming_emails"))['count'];
    $processedCount = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as count FROM email_done"))['count'];
    
    // Calculate unprocessed emails accurately
    $hasIncomingEmailId = columnExists($conn, 'email_done', 'incoming_email_id');
    if ($hasIncomingEmailId) {
        $unprocessed_sql = "
            SELECT COUNT(*) as count 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON i.id = e.incoming_email_id 
            WHERE e.id IS NULL
        ";
    } else {
        $unprocessed_sql = "
            SELECT COUNT(*) as count 
            FROM incoming_emails i 
            LEFT JOIN email_done e ON (i.from_email = e.from_email AND i.title = e.title AND i.content = e.content)
            WHERE e.id IS NULL
        ";
    }
    $unprocessedCount = mysqli_fetch_assoc(mysqli_query($conn, $unprocessed_sql))['count'];
    
    // Debug: Check if there's a mismatch
    $expected_unprocessed = $incomingCount - $processedCount;
    if ($unprocessedCount != $expected_unprocessed) {
        // There might be an issue with the JOIN logic
        $unprocessedCount = $expected_unprocessed;
    }
    
    // Auto-process if there are unprocessed emails and no processing result yet
    if ($unprocessedCount > 0 && !isset($processing_result)) {
        $processing_result = forceProcessAllEmails($conn);
        $processing_result['auto_processed'] = true;
        $processing_result['unprocessed_count'] = $unprocessedCount;
    }
    
    // Force immediate processing if still have unprocessed emails
    if ($unprocessedCount > 0) {
        // Force process all remaining unprocessed emails
        $force_result = forceProcessAllEmails($conn);
        if ($force_result['count'] > 0) {
            $processing_result = $force_result;
            $processing_result['auto_processed'] = true;
            $processing_result['force_processed'] = true;
            $processing_result['unprocessed_count'] = $unprocessedCount;
        }
    }

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
    echo "<div class='stat-number'>".number_format($unprocessedCount)."</div>";
    echo "<div class='stat-label'>Chưa xử lý</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>".round(($processedCount / max($incomingCount, 1)) * 100)."%</div>";
    echo "<div class='stat-label'>Tỷ lệ xử lý</div>";
    echo "</div>";
    echo "</div>";

    // Section 1: Incoming Emails (Raw Data)
    // echo "<div class='section'>";
    // echo "<h2>📥 Email gốc (chưa xử lý)</h2>";

    // $sql = "SELECT * FROM incoming_emails ORDER BY received_time DESC LIMIT 100";
    // $result = mysqli_query($conn, $sql);

    // if ($result && mysqli_num_rows($result) > 0) {
    //     echo "<div class='table-container'>";
    //     echo "<table class='email-table'>";
    //     echo "<thead>";
    //     echo "<tr>";
    //     echo "<th>ID</th>";
    //     echo "<th>Thời gian</th>";
    //     echo "<th>Người gửi</th>";
    //     echo "<th>Người nhận</th>";
    //     echo "<th>Tiêu đề</th>";
    //     echo "<th>Nội dung</th>";
    //     echo "</tr>";
    //     echo "</thead>";
    //     echo "<tbody>";
        
    //     while ($row = mysqli_fetch_assoc($result)) {
    //         echo "<tr>";
    //         echo "<td>".htmlspecialchars($row['id'])."</td>";
    //         echo "<td class='timestamp'>".date('d/m/Y H:i:s', strtotime($row['received_time']))."</td>";
    //         echo "<td class='email-sender'>".htmlspecialchars($row['from_email'])."</td>";
    //         echo "<td class='email-sender'>".htmlspecialchars($row['to_email'])."</td>";
    //         echo "<td class='email-title'>".htmlspecialchars($row['title'])."</td>";
    //         echo "<td class='email-content'>".htmlspecialchars(substr($row['content'], 0, 100)).(strlen($row['content']) > 100 ? '...' : '')."</td>";
    //         echo "</tr>";
    //     }
        
    //     echo "</tbody>";
    //     echo "</table>";
    //     echo "</div>";
    // } else {
    //     echo "<div class='empty-message'>";
    //     echo "📭 Không có email nào trong bảng incoming_emails<br>";
    //     echo "Hãy chạy <a href='check_database.php'>check_database.php</a> để thêm dữ liệu mẫu";
    //     echo "</div>";
    // }
    // echo "</div>";

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
            echo "<td>".(isset($row['confidence']) && $row['confidence'] ? round($row['confidence'] * 100, 1).'%' : 'N/A')."</td>";
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

    // Final navigation
    echo "<div class='controls'>";
    echo "<a href='HomePage.html' class='btn btn-primary'>🏠 Quay về trang chủ</a>";
    echo "</div>";

    echo "</div>";

    // FIX: Add closing body and html tags
    echo "</body></html>";

    mysqli_close($conn);
    ?>
    
    <script>
    // Auto-processing functionality
    function autoProcessBatches() {
        // Check if we're in auto-processing mode
        const urlParams = new URLSearchParams(window.location.search);
        const autoProcess = urlParams.get('auto');
        const currentBatch = parseInt(urlParams.get('batch')) || 0;
        const totalBatches = parseInt(urlParams.get('total_batches')) || 0;
        
        if (autoProcess === '1' && currentBatch > 0 && currentBatch < totalBatches) {
            // Auto-process next batch after a short delay
            setTimeout(function() {
                const nextBatch = currentBatch + 1;
                const nextUrl = `?process=1&batch=${nextBatch}&total_batches=${totalBatches}&auto=1`;
                window.location.href = nextUrl;
            }, 2000); // 2 second delay between batches
        }
    }
    
    // Real-time monitoring for new emails
    function checkForNewEmails() {
        // Get current email counts
        const currentIncomingCount = <?php echo $incomingCount; ?>;
        const currentProcessedCount = <?php echo $processedCount; ?>;
        
        // Check for new emails every 1 seconds
        setInterval(function() {
            const checkUrl = `?check_new=1&main_incoming=${currentIncomingCount}&main_processed=${currentProcessedCount}`;
            fetch(checkUrl, { method: 'GET' })
                .then(response => response.text())
                .then(data => {
                    try {
                        const result = JSON.parse(data);
                        if (result.new_emails > 0) {
                            // New emails detected, refresh the page
                            console.log('Phát hiện ' + result.new_emails + ' email mới, đang cập nhật...');
                            location.reload();
                        }
                    } catch (e) {
                        // If response is not JSON, it means page needs refresh
                        location.reload();
                    }
                })
                .catch(error => {
                    console.log('Lỗi kiểm tra email mới:', error);
                });
        }, 1000); // Check every 30 seconds
    }
    
    // Auto-refresh page every 2 minutes to show latest data
    function autoRefreshPage() {
        setInterval(function() {
            console.log('Tự động cập nhật trang...');
            location.reload();
        }, 120000); // Refresh every 2 minutes
    }
    
    // Start auto-processing when page loads
    document.addEventListener('DOMContentLoaded', function() {
        autoProcessBatches();
        checkForNewEmails();
        autoRefreshPage();
        
        // Show status message
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,123,255,0.9); color: white; padding: 10px; border-radius: 5px; z-index: 1000; font-size: 12px;';
        statusDiv.innerHTML = '🔄 Tự động cập nhật mỗi 2 phút<br>📧 Kiểm tra email mới mỗi 30 giây';
        document.body.appendChild(statusDiv);
        
        // Remove status after 5 seconds
        setTimeout(function() {
            statusDiv.style.opacity = '0';
            statusDiv.style.transition = 'opacity 1s';
            setTimeout(function() {
                statusDiv.remove();
            }, 1000);
        }, 5000);
    });
    </script>