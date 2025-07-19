// Email patterns for backend processing
const EMAIL_PATTERNS = {
    // Pattern cho email SPAM (category_id = 2)
    spam: {
        basic: {
            titlePatterns: [
                /GIẢM GIÁ.*[0-9]{2,}%/i,
                /CHỈ.*HÔM NAY/i,
                /KHUYẾN MÃI.*KHỦNG/i,
                /💰|🎉|🔥|⭐|💯/,
                /!!!/,
                /\$\$\$/,
                /CLICK.*NGAY/i,
                /FREE|MIỄN PHÍ.*100%/i
            ],
            contentPatterns: [
                /giảm giá.*[789][0-9]%/i,
                /chỉ còn.*[0-9]+.*giờ/i,
                /click.*ngay.*link/i,
                /bit\.ly|tinyurl|short\.link/,
                /!!!|💰💰💰/
            ],
            fromDomainPatterns: [
                /promo|deals|sale|offer|discount/i,
                /\d{2,}\.net|\.tk|\.ml/
            ]
        },
        advanced: {
            titlePatterns: [
                /ưu đãi.*đặc biệt/i,
                /thông báo.*khuyến mãi/i,
                /cơ hội.*hiếm/i
            ],
            contentPatterns: [
                /số lượng có hạn/i,
                /đăng ký ngay để nhận/i,
                /ưu đãi dành riêng cho bạn/i
            ],
            fromDomainPatterns: [
                /marketing@/i,
                /newsletter@/i
            ]
        }
    },
    // Pattern cho email PHISHING (category_id = 3)
    phishing: {
        basic: {
            titlePatterns: [
                /bảo mật|security/i,
                /tài khoản.*bị.*khóa/i,
                /xác (minh|nhận|thực).*khẩn/i,
                /cập nhật.*ngay/i
            ],
            contentPatterns: [
                /tài khoản.*sẽ bị.*khóa/i,
                /xác (minh|nhận).*trong.*[0-9]+.*giờ/i,
                /click.*link.*xác (minh|nhận)/i,
                /cập nhật.*thông tin.*bảo mật/i
            ],
            fromDomainPatterns: [
                /[0-9]/, // Có số trong tên miền (amaz0n)
                /-verification|-security|-account/i,
                /\.tk|\.ml|\.ga|\.cf/
            ],
            brandSpoofing: [
                /amaz[0o]n/i,
                /g[0o]{2}gle/i,
                /micr[0o]soft/i,
                /payp[a@]l/i,
                /faceb[0o]{2}k/i
            ]
        },
        advanced: {
            titlePatterns: [
                /thông báo từ.*phòng.*kế toán/i,
                /yêu cầu xác nhận.*thanh toán/i
            ],
            contentPatterns: [
                /vui lòng kiểm tra.*đính kèm/i,
                /xác nhận.*giao dịch/i,
                /để tiếp tục.*vui lòng/i
            ],
            fromDomainPatterns: [
                /no-?reply@.*\.(info|online|site)/i
            ]
        }
    },
    // Pattern cho email NGHI NGỜ (category_id = 1)
    suspicious: {
        basic: {
            titlePatterns: [
                /khẩn|gấp|urgent/i,
                /hạn chót|deadline/i,
                /quan trọng.*cập nhật/i
            ],
            contentPatterns: [
                /vui lòng.*cung cấp/i,
                /xác nhận.*thông tin/i,
                /truy cập.*link.*bên dưới/i,
                /trong vòng.*[0-9]+.*giờ/i
            ],
            fromDomainPatterns: [
                /\.(info|click|site|online)$/i,
                /-system|-admin/i
            ],
            spellingErrors: [
                /recieve/i, // receive
                /occured/i, // occurred
                /loose/i,   // lose
                /there account/i // their account
            ]
        },
        advanced: {
            subtleIndicators: [
                /vui lòng phản hồi sớm/i,
                /thông tin này là bảo mật/i,
                /không chia sẻ email này/i
            ]
        }
    },
    // Pattern cho email AN TOÀN (category_id = 0)
    safe: {
        requiredPatterns: {
            fromDomainPatterns: [
                /@fpt\.edu\.vn$/,
                /@[a-z]+\.edu\.vn$/,
                /@(gmail|outlook|yahoo)\.com$/,
                /@[a-z]+(corp|company|university)\.(com|vn|edu)$/
            ],
            professionalGreetings: [
                /^kính (gửi|chào)/i,
                /^thân gửi/i,
                /^dear/i
            ],
            professionalClosings: [
                /trân trọng/i,
                /best regards/i,
                /thân ái/i,
                /kính thư/i
            ]
        },
        mustNotHave: {
            suspiciousWords: [
                /click.*here|nhấp.*vào đây/i,
                /verify.*account|xác minh.*tài khoản/i,
                /suspended|bị treo/i,
                /act now|hành động ngay/i
            ]
        }
    }
};

// Advanced email classification function
function classifyEmailAdvanced(email) {
    const { title, content, from_email } = email;

    // Check for Phishing first (most dangerous)
    const phishingCheck = checkPhishingAdvanced(title, content, from_email);
    if (phishingCheck.isPhishing) {
        return {
            category: 'Giả mạo',
            confidence: phishingCheck.confidence,
            indicators: phishingCheck.indicators,
            level: phishingCheck.level
        };
    }

    // Check for Spam
    const spamCheck = checkSpamAdvanced(title, content, from_email);
    if (spamCheck.isSpam) {
        return {
            category: 'Spam',
            confidence: spamCheck.confidence,
            indicators: spamCheck.indicators,
            level: spamCheck.level
        };
    }

    // Check for Suspicious
    const suspiciousCheck = checkSuspiciousAdvanced(title, content, from_email);
    if (suspiciousCheck.isSuspicious) {
        return {
            category: 'Nghi ngờ',
            confidence: suspiciousCheck.confidence,
            indicators: suspiciousCheck.indicators,
            level: suspiciousCheck.level
        };
    }

    // Check for Safe
    const safeCheck = checkSafeAdvanced(title, content, from_email);
    if (safeCheck.isSafe) {
        return {
            category: 'An toàn',
            confidence: safeCheck.confidence,
            indicators: ['Email từ nguồn tin cậy', 'Không có dấu hiệu đáng ngờ'],
            level: 'basic'
        };
    }

    // Default to suspicious if unclear
    return {
        category: 'Nghi ngờ',
        confidence: 0.3,
        indicators: ['Không thể xác định rõ ràng'],
        level: 'basic'
    };
}

// Advanced phishing detection
function checkPhishingAdvanced(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.phishing;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // Check for brand spoofing
    for (const brandPattern of patterns.basic.brandSpoofing) {
        if (brandPattern.test(from_email) || brandPattern.test(content)) {
            indicators.push('Giả mạo thương hiệu với ký tự số thay chữ');
            matchCount += 2; // High weight for brand spoofing
        }
    }

    // Check for suspicious domains
    const domain = from_email.split('@')[1] || '';
    for (const phishDomain of patterns.basic.fromDomainPatterns) {
        if (phishDomain.test(domain)) {
            indicators.push(`Domain đáng ngờ: ${domain}`);
            matchCount += 2;
        }
    }

    // Check for urgency in title
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tiêu đề có dấu hiệu phishing');
            matchCount++;
        }
    }

    // Check for suspicious content
    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            indicators.push('Nội dung yêu cầu xác minh khẩn cấp');
            matchCount++;
        }
    }

    // Check for advanced patterns if basic patterns don't match enough
    if (patterns.advanced && matchCount < 3) {
        level = 'advanced';
        // Check for sophisticated indicators
        if (/phòng.*kế.*toán/i.test(from_email) || /accounting/i.test(from_email)) {
            indicators.push('Giả danh phòng ban nội bộ');
            matchCount++;
        }
        
        // Check advanced content patterns
        for (const pattern of patterns.advanced.contentPatterns) {
            if (pattern.test(content)) {
                indicators.push('Nội dung phishing tinh vi');
                matchCount++;
            }
        }
    }

    const confidence = Math.min(matchCount * 0.25, 1);

    return {
        isPhishing: matchCount >= 2,
        confidence,
        indicators,
        level
    };
}

// Advanced spam detection
function checkSpamAdvanced(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.spam;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // Check for basic spam patterns in title
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            if (/[0-9]{2,}%/i.test(title)) {
                indicators.push('Quảng cáo giảm giá lớn');
            } else if (/!!!/i.test(title)) {
                indicators.push('Sử dụng nhiều dấu chấm than');
            } else if (/💰|🎉|🔥/.test(title)) {
                indicators.push('Sử dụng emoji spam');
            } else {
                indicators.push('Tiêu đề spam điển hình');
            }
            matchCount++;
        }
    }

    // Check for spam patterns in content
    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            if (/bit\.ly|tinyurl/.test(content)) {
                indicators.push('Chứa link rút gọn đáng ngờ');
                matchCount += 2; // High weight for shortened links
            } else {
                indicators.push('Nội dung spam điển hình');
                matchCount++;
            }
        }
    }

    // Check for spam domains
    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push('Domain spam thương mại');
            matchCount++;
        }
    }

    // Check for advanced spam (sophisticated marketing)
    if (patterns.advanced && matchCount < 2) {
        level = 'advanced';
        for (const pattern of patterns.advanced.contentPatterns) {
            if (pattern.test(content)) {
                indicators.push('Marketing email với trigger tâm lý');
                matchCount++;
            }
        }
        
        // Check advanced domain patterns
        for (const pattern of patterns.advanced.fromDomainPatterns) {
            if (pattern.test(domain)) {
                indicators.push('Domain marketing chuyên nghiệp');
                matchCount++;
            }
        }
    }

    const confidence = Math.min(matchCount * 0.3, 1);

    return {
        isSpam: matchCount >= 2,
        confidence,
        indicators,
        level
    };
}

// Advanced suspicious detection
function checkSuspiciousAdvanced(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.suspicious;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // Check for urgency patterns in title
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tạo áp lực thời gian trong tiêu đề');
            matchCount++;
        }
    }

    // Check for suspicious content patterns
    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            if (/trong vòng.*[0-9]+.*giờ/i.test(content)) {
                indicators.push('Yêu cầu hành động trong thời gian ngắn');
            } else if (/vui lòng.*cung cấp/i.test(content)) {
                indicators.push('Yêu cầu cung cấp thông tin');
            } else {
                indicators.push('Nội dung có dấu hiệu đáng ngờ');
            }
            matchCount++;
        }
    }

    // Check for suspicious domains
    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push(`Domain không chính thức: ${domain}`);
            matchCount++;
        }
    }

    // Check for spelling errors
    if (patterns.basic.spellingErrors) {
        const fullText = title + ' ' + content;
        for (const errorPattern of patterns.basic.spellingErrors) {
            if (errorPattern.test(fullText)) {
                indicators.push('Có lỗi chính tả đáng ngờ');
                matchCount++;
                break;
            }
        }
    }

    // Check for advanced subtle indicators
    if (patterns.advanced && matchCount < 2) {
        level = 'advanced';
        for (const pattern of patterns.advanced.subtleIndicators) {
            if (pattern.test(content)) {
                indicators.push('Email trông chuyên nghiệp nhưng có dấu hiệu nhỏ');
                matchCount++;
            }
        }
    }

    const confidence = Math.min(matchCount * 0.35, 1);

    return {
        isSuspicious: matchCount >= 2,
        confidence,
        indicators,
        level
    };
}

// Advanced safe detection
function checkSafeAdvanced(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.safe;
    let safeScore = 0;

    // Check for trusted domains
    for (const pattern of patterns.requiredPatterns.fromDomainPatterns) {
        if (pattern.test(from_email)) {
            safeScore += 2; // High weight for trusted domains
            break;
        }
    }

    // Check for professional greetings
    for (const pattern of patterns.requiredPatterns.professionalGreetings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    // Check for professional closings
    for (const pattern of patterns.requiredPatterns.professionalClosings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    // Check for suspicious words that should NOT be present
    let hasSuspiciousWords = false;
    for (const pattern of patterns.mustNotHave.suspiciousWords) {
        if (pattern.test(content) || pattern.test(title)) {
            hasSuspiciousWords = true;
            break;
        }
    }

    // Email is safe if:
    // - Has trusted domain (score >= 2) AND
    // - No suspicious words AND
    // - Has at least 1 other professional element
    const isSafe = safeScore >= 3 && !hasSuspiciousWords;
    const confidence = isSafe ? Math.min(safeScore * 0.25, 1) : 0;

    return {
        isSafe,
        confidence
    };
}

// Helper functions for result conversion
function getResultType(category) {
    switch (category) {
        case 'Giả mạo': return 'danger';
        case 'Spam': return 'warning';
        case 'Nghi ngờ': return 'warning';
        case 'An toàn': return 'safe';
        default: return 'warning';
    }
}

function getResultMessage(category, confidence) {
    const confidencePercent = Math.round(confidence * 100);
    switch (category) {
        case 'Giả mạo':
            return `⚠️ CẢNH BÁO: Email này có dấu hiệu lừa đảo cao! (${confidencePercent}%)`;
        case 'Spam':
            return `⚠️ CẢNH BÁO: Email này có dấu hiệu spam! (${confidencePercent}%)`;
        case 'Nghi ngờ':
            return `⚠️ CẢNH BÁO: Email này có dấu hiệu đáng ngờ (${confidencePercent}%)`;
        case 'An toàn':
            return `✅ Email này có vẻ an toàn (${confidencePercent}%)`;
        default:
            return `⚠️ Email này cần được kiểm tra thêm`;
    }
}

function getResultDescription(category) {
    switch (category) {
        case 'Giả mạo':
            return 'Email này có nhiều dấu hiệu lừa đảo. Không nên trả lời hoặc cung cấp thông tin.';
        case 'Spam':
            return 'Email này có dấu hiệu spam. Nên xóa và không trả lời.';
        case 'Nghi ngờ':
            return 'Email này có một số dấu hiệu đáng ngờ. Hãy thận trọng trước khi trả lời.';
        case 'An toàn':
            return 'Không phát hiện dấu hiệu lừa đảo rõ ràng. Tuy nhiên vẫn nên thận trọng.';
        default:
            return 'Không thể xác định rõ ràng. Vui lòng kiểm tra thêm.';
    }
}

function getRiskLevel(category) {
    switch (category) {
        case 'Giả mạo': return 'high';
        case 'Spam': return 'medium';
        case 'Nghi ngờ': return 'medium';
        case 'An toàn': return 'low';
        default: return 'medium';
    }
}

function getRiskIcon(category) {
    switch (category) {
        case 'Giả mạo': return 'fas fa-user-secret';
        case 'Spam': return 'fas fa-ban';
        case 'Nghi ngờ': return 'fas fa-question-circle';
        case 'An toàn': return 'fas fa-shield-check';
        default: return 'fas fa-exclamation-triangle';
    }
}

// Main email analysis function for backend
function analyzeEmailBackend(emailData) {
    const { senderEmail, senderName, subject, content, urgency, requestType, suspiciousElements } = emailData;

    // Create email object for classification
    const email = {
        title: subject,
        content: content,
        from_email: senderEmail
    };

    // Use advanced email classification
    const classificationResult = classifyEmailAdvanced(email);
    
    // Convert classification result to UI format
    const resultType = getResultType(classificationResult.category);
    const resultMessage = getResultMessage(classificationResult.category, classificationResult.confidence);
    const resultDescription = getResultDescription(classificationResult.category);
    
    // Convert indicators to risk factors
    const riskFactors = classificationResult.indicators.map(indicator => ({
        level: getRiskLevel(classificationResult.category),
        text: indicator,
        icon: getRiskIcon(classificationResult.category)
    }));

    // Add additional factors based on form inputs
    if (urgency === 'high') {
        riskFactors.push({
            level: 'high',
            text: 'Email được đánh dấu khẩn cấp - dấu hiệu lừa đảo',
            icon: 'fas fa-exclamation-triangle'
        });
    }

    if (requestType === 'payment') {
        riskFactors.push({
            level: 'high',
            text: 'Email yêu cầu thông tin thanh toán - rất đáng ngờ',
            icon: 'fas fa-dollar-sign'
        });
    }

    if (requestType === 'personal') {
        riskFactors.push({
            level: 'high',
            text: 'Email yêu cầu thông tin cá nhân - cần thận trọng',
            icon: 'fas fa-id-card'
        });
    }

    return {
        success: true,
        data: {
            senderEmail,
            senderName,
            subject,
            content,
            urgency,
            requestType,
            suspiciousElements,
            classification: {
                category: classificationResult.category,
                confidence: classificationResult.confidence,
                level: classificationResult.level,
                indicators: classificationResult.indicators
            },
            result: {
                type: resultType,
                message: resultMessage,
                description: resultDescription,
                riskFactors: riskFactors
            },
            timestamp: new Date().toISOString()
        }
    };
}

module.exports = {
    EMAIL_PATTERNS,
    classifyEmailAdvanced,
    checkPhishingAdvanced,
    checkSpamAdvanced,
    checkSuspiciousAdvanced,
    checkSafeAdvanced,
    getResultType,
    getResultMessage,
    getResultDescription,
    getRiskLevel,
    getRiskIcon,
    analyzeEmailBackend
}; 