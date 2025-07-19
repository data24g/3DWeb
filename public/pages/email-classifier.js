const { EMAIL_PATTERNS } = require('./email-patterns');

/**
 * Phân loại email dựa trên các dấu hiệu nhận biết
 * @param {Object} email - Email cần phân loại
 * @param {string} email.title - Tiêu đề email
 * @param {string} email.content - Nội dung email
 * @param {string} email.from_email - Email người gửi
 * @returns {Object} Kết quả phân loại với category và indicators
 */
function classifyEmail(email) {
    const { title, content, from_email } = email;

    // Khởi tạo kết quả với giá trị mặc định
    const result = {
        category: 'An toàn',
        confidence: 0,
        indicators: [],
        level: 'basic'
    };

    // Kiểm tra từng loại email theo thứ tự ưu tiên
    // 1. Kiểm tra Phishing trước (nguy hiểm nhất)
    const phishingCheck = checkPhishing(title, content, from_email);
    if (phishingCheck.isPhishing) {
        return {
            category: 'Giả mạo',
            confidence: phishingCheck.confidence,
            indicators: phishingCheck.indicators,
            level: phishingCheck.level
        };
    }

    // 2. Kiểm tra Spam
    const spamCheck = checkSpam(title, content, from_email);
    if (spamCheck.isSpam) {
        return {
            category: 'Spam',
            confidence: spamCheck.confidence,
            indicators: spamCheck.indicators,
            level: spamCheck.level
        };
    }

    // 3. Kiểm tra Nghi ngờ
    const suspiciousCheck = checkSuspicious(title, content, from_email);
    if (suspiciousCheck.isSuspicious) {
        return {
            category: 'Nghi ngờ',
            confidence: suspiciousCheck.confidence,
            indicators: suspiciousCheck.indicators,
            level: suspiciousCheck.level
        };
    }

    // 4. Kiểm tra An toàn
    const safeCheck = checkSafe(title, content, from_email);
    if (safeCheck.isSafe) {
        return {
            category: 'An toàn',
            confidence: safeCheck.confidence,
            indicators: ['Email từ nguồn tin cậy', 'Không có dấu hiệu đáng ngờ'],
            level: 'basic'
        };
    }

    // Nếu không rõ ràng, mặc định là Nghi ngờ với confidence thấp
    return {
        category: 'Nghi ngờ',
        confidence: 0.3,
        indicators: ['Không thể xác định rõ ràng'],
        level: 'basic'
    };
}

/**
 * Kiểm tra email Phishing (Giả mạo)
 */
function checkPhishing(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.phishing;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // Kiểm tra domain giả mạo trong email gửi
    const domain = from_email.split('@')[1] || '';

    // Kiểm tra brand spoofing (ví dụ: Amaz0n, G00gle)
    for (const brandPattern of patterns.basic.brandSpoofing) {
        if (brandPattern.test(from_email) || brandPattern.test(content)) {
            indicators.push('Giả mạo thương hiệu với ký tự số thay chữ');
            matchCount += 2; // Trọng số cao cho brand spoofing
        }
    }

    // Kiểm tra phishing domains (.tk, .ml, .ga, .cf)
    for (const phishDomain of patterns.basic.fromDomainPatterns) {
        if (phishDomain.test(domain)) {
            indicators.push(`Domain đáng ngờ: ${domain}`);
            matchCount += 2;
        }
    }

    // Kiểm tra title patterns
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tiêu đề có dấu hiệu phishing');
            matchCount++;
        }
    }

    // Kiểm tra content patterns  
    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            indicators.push('Nội dung yêu cầu xác minh khẩn cấp');
            matchCount++;
        }
    }

    // Kiểm tra advanced patterns nếu có
    if (patterns.advanced && matchCount < 3) {
        level = 'advanced';
        // Kiểm tra các dấu hiệu tinh vi hơn
        if (/phòng.*kế.*toán/i.test(from_email) || /accounting/i.test(from_email)) {
            indicators.push('Giả danh phòng ban nội bộ');
            matchCount++;
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

/**
 * Kiểm tra email Spam
 */
function checkSpam(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.spam;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // Kiểm tra basic spam patterns
    // 1. Title với giảm giá, viết hoa, emoji
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            if (/[0-9]{2,}%/i.test(title)) {
                indicators.push('Quảng cáo giảm giá lớn');
            } else if (/!!!/i.test(title)) {
                indicators.push('Sử dụng nhiều dấu chấm than');
            } else if (/💰|🎉|🔥/.test(title)) {
                indicators.push('Sử dụng emoji spam');
            }
            matchCount++;
        }
    }

    // 2. Content patterns
    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            if (/bit\.ly|tinyurl/.test(content)) {
                indicators.push('Chứa link rút gọn đáng ngờ');
                matchCount += 2; // Trọng số cao cho shortened links
            } else {
                indicators.push('Nội dung spam điển hình');
                matchCount++;
            }
        }
    }

    // 3. From domain patterns
    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push('Domain spam thương mại');
            matchCount++;
        }
    }

    // Kiểm tra advanced spam (marketing tinh vi)
    if (patterns.advanced && matchCount < 2) {
        level = 'advanced';
        for (const pattern of patterns.advanced.contentPatterns) {
            if (pattern.test(content)) {
                indicators.push('Marketing email với trigger tâm lý');
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

/**
 * Kiểm tra email Nghi ngờ
 */
function checkSuspicious(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.suspicious;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    // 1. Kiểm tra title patterns (khẩn, gấp, urgent)
    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tạo áp lực thời gian trong tiêu đề');
            matchCount++;
        }
    }

    // 2. Kiểm tra content patterns
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

    // 3. Kiểm tra domain patterns
    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push(`Domain không chính thức: ${domain}`);
            matchCount++;
        }
    }

    // 4. Kiểm tra lỗi chính tả (spelling errors)
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

    const confidence = Math.min(matchCount * 0.35, 1);

    return {
        isSuspicious: matchCount >= 2,
        confidence,
        indicators,
        level
    };
}

/**
 * Kiểm tra email An toàn
 */
function checkSafe(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.safe;
    let safeScore = 0;

    // 1. Kiểm tra domain tin cậy
    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.requiredPatterns.fromDomainPatterns) {
        if (pattern.test(from_email)) {
            safeScore += 2; // Domain tin cậy có trọng số cao
            break;
        }
    }

    // 2. Kiểm tra lời chào chuyên nghiệp
    for (const pattern of patterns.requiredPatterns.professionalGreetings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    // 3. Kiểm tra lời kết chuyên nghiệp
    for (const pattern of patterns.requiredPatterns.professionalClosings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    // 4. Đảm bảo KHÔNG có các từ nghi ngờ
    let hasSuspiciousWords = false;
    for (const pattern of patterns.mustNotHave.suspiciousWords) {
        if (pattern.test(content) || pattern.test(title)) {
            hasSuspiciousWords = true;
            break;
        }
    }

    // Email an toàn nếu:
    // - Có domain tin cậy (score >= 2) VÀ
    // - Không có từ nghi ngờ VÀ
    // - Có ít nhất 1 yếu tố chuyên nghiệp khác
    const isSafe = safeScore >= 3 && !hasSuspiciousWords;
    const confidence = isSafe ? Math.min(safeScore * 0.25, 1) : 0;

    return {
        isSafe,
        confidence
    };
}

// Helper function: Phân tích chi tiết một email
function analyzeEmail(email) {
    console.log('\n=== PHÂN TÍCH EMAIL ===');
    console.log('Tiêu đề:', email.title);
    console.log('Từ:', email.from_email);
    console.log('---');

    const result = classifyEmail(email);

    console.log('KẾT QUẢ PHÂN LOẠI:');
    console.log('- Loại:', result.category);
    console.log('- Độ tin cậy:', (result.confidence * 100).toFixed(0) + '%');
    console.log('- Level:', result.level);
    console.log('- Dấu hiệu nhận biết:');
    result.indicators.forEach(indicator => {
        console.log('  •', indicator);
    });
    console.log('======================\n');

    return result;
}

module.exports = {
    classifyEmail,
    analyzeEmail,
    // Export các hàm check riêng lẻ nếu cần
    checkPhishing,
    checkSpam,
    checkSuspicious,
    checkSafe
};