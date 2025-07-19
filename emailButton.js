const EMAIL_PATTERNS = {
    // Pattern cho email SPAM (category_id = 2)
    spam: {
        // Pattern cơ bản (dễ nhận biết)
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
        // Pattern nâng cao (khó nhận biết hơn)
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
    suspicious: {basic: {
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
        // Email trông chuyên nghiệp nhưng có dấu hiệu nhỏ
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
    // Không có các pattern nghi ngờ
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

module.exports = { EMAIL_PATTERNS };