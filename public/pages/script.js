// --- Start of email classification logic ---

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
                /there account/i, // their account
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

function classifyEmail(email) {
    const { title, content, from_email } = email;

    const phishingCheck = checkPhishing(title, content, from_email);
    if (phishingCheck.isPhishing) {
        return {
            category: 'Giả mạo',
            confidence: phishingCheck.confidence,
            indicators: phishingCheck.indicators,
            level: phishingCheck.level
        };
    }

    const spamCheck = checkSpam(title, content, from_email);
    if (spamCheck.isSpam) {
        return {
            category: 'Spam',
            confidence: spamCheck.confidence,
            indicators: spamCheck.indicators,
            level: spamCheck.level
        };
    }

    const suspiciousCheck = checkSuspicious(title, content, from_email);
    if (suspiciousCheck.isSuspicious) {
        return {
            category: 'Nghi ngờ',
            confidence: suspiciousCheck.confidence,
            indicators: suspiciousCheck.indicators,
            level: suspiciousCheck.level
        };
    }

    const safeCheck = checkSafe(title, content, from_email);
    if (safeCheck.isSafe) {
        return {
            category: 'An toàn',
            confidence: safeCheck.confidence,
            indicators: ['Email từ nguồn tin cậy', 'Không có dấu hiệu đáng ngờ'],
            level: 'basic'
        };
    }

    return {
        category: 'Nghi ngờ',
        confidence: 0.3,
        indicators: ['Không thể xác định rõ ràng, hãy cẩn trọng'],
        level: 'basic'
    };
}

function checkPhishing(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.phishing;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';
    const domain = from_email.split('@')[1] || '';

    for (const brandPattern of patterns.basic.brandSpoofing) {
        if (brandPattern.test(from_email) || brandPattern.test(content)) {
            indicators.push('Giả mạo thương hiệu với ký tự số thay chữ');
            matchCount += 2;
        }
    }

    for (const phishDomain of patterns.basic.fromDomainPatterns) {
        if (phishDomain.test(domain)) {
            indicators.push(`Domain đáng ngờ: ${domain}`);
            matchCount += 2;
        }
    }

    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tiêu đề có dấu hiệu phishing');
            matchCount++;
        }
    }

    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            indicators.push('Nội dung yêu cầu xác minh khẩn cấp');
            matchCount++;
        }
    }

    if (patterns.advanced && matchCount < 3) {
        level = 'advanced';
        if (/phòng.*kế.*toán/i.test(from_email) || /accounting/i.test(from_email)) {
            indicators.push('Giả danh phòng ban nội bộ');
            matchCount++;
        }
    }

    const confidence = Math.min(matchCount * 0.25, 1);
    return { isPhishing: matchCount >= 2, confidence, indicators, level };
}

function checkSpam(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.spam;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            if (/[0-9]{2,}%/i.test(title)) indicators.push('Quảng cáo giảm giá lớn');
            else if (/!!!/i.test(title)) indicators.push('Sử dụng nhiều dấu chấm than');
            else if (/💰|🎉|🔥/.test(title)) indicators.push('Sử dụng emoji spam');
            matchCount++;
        }
    }

    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            if (/bit\.ly|tinyurl/.test(content)) {
                indicators.push('Chứa link rút gọn đáng ngờ');
                matchCount += 2;
            } else {
                indicators.push('Nội dung spam điển hình');
                matchCount++;
            }
        }
    }

    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push('Domain spam thương mại');
            matchCount++;
        }
    }

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
    return { isSpam: matchCount >= 2, confidence, indicators, level };
}

function checkSuspicious(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.suspicious;
    const indicators = [];
    let matchCount = 0;
    let level = 'basic';

    for (const pattern of patterns.basic.titlePatterns) {
        if (pattern.test(title)) {
            indicators.push('Tạo áp lực thời gian trong tiêu đề');
            matchCount++;
        }
    }

    for (const pattern of patterns.basic.contentPatterns) {
        if (pattern.test(content)) {
            if (/trong vòng.*[0-9]+.*giờ/i.test(content)) indicators.push('Yêu cầu hành động trong thời gian ngắn');
            else if (/vui lòng.*cung cấp/i.test(content)) indicators.push('Yêu cầu cung cấp thông tin');
            else indicators.push('Nội dung có dấu hiệu đáng ngờ');
            matchCount++;
        }
    }

    const domain = from_email.split('@')[1] || '';
    for (const pattern of patterns.basic.fromDomainPatterns) {
        if (pattern.test(domain)) {
            indicators.push(`Domain không chính thức: ${domain}`);
            matchCount++;
        }
    }

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
    return { isSuspicious: matchCount >= 2, confidence, indicators, level };
}

function checkSafe(title, content, from_email) {
    const patterns = EMAIL_PATTERNS.safe;
    let safeScore = 0;
    const domain = from_email.split('@')[1] || '';

    for (const pattern of patterns.requiredPatterns.fromDomainPatterns) {
        if (pattern.test(from_email)) {
            safeScore += 2;
            break;
        }
    }

    for (const pattern of patterns.requiredPatterns.professionalGreetings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    for (const pattern of patterns.requiredPatterns.professionalClosings) {
        if (pattern.test(content)) {
            safeScore++;
            break;
        }
    }

    let hasSuspiciousWords = false;
    for (const pattern of patterns.mustNotHave.suspiciousWords) {
        if (pattern.test(content) || pattern.test(title)) {
            hasSuspiciousWords = true;
            break;
        }
    }

    const isSafe = safeScore >= 3 && !hasSuspiciousWords;
    const confidence = isSafe ? Math.min(safeScore * 0.25, 1) : 0;
    return { isSafe, confidence };
}


// --- Start of Frontend Logic ---

document.addEventListener('DOMContentLoaded', function () {
    // --- Logic for HomePage.html ---
    const slideshowTrack = document.querySelector('.slideshow-track');
    if (slideshowTrack) {
        const slides = Array.from(slideshowTrack.children);
        const nextButton = document.querySelector('.next-btn');
        const prevButton = document.querySelector('.prev-btn');
        const dotsContainer = document.querySelector('.slideshow-dots');

        slides.forEach(slide => slideshowTrack.appendChild(slide.cloneNode(true)));

        let currentIndex = 0;
        const totalSlides = slides.length;
        const slideWidth = slides[0].getBoundingClientRect().width + 20;

        function updateDots(index) {
            dotsContainer.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));
            if (dotsContainer.children[index % totalSlides]) {
                dotsContainer.children[index % totalSlides].classList.add('active');
            }
        }

        function moveToSlide(index) {
            slideshowTrack.style.transition = 'transform 0.5s ease-in-out';
            slideshowTrack.style.transform = `translateX(-${index * slideWidth}px)`;
            updateDots(index);
        }

        nextButton.addEventListener('click', () => {
            currentIndex++;
            moveToSlide(currentIndex);
            if (currentIndex >= totalSlides) {
                setTimeout(() => {
                    slideshowTrack.style.transition = 'none';
                    currentIndex = 0;
                    slideshowTrack.style.transform = `translateX(0)`;
                }, 500);
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentIndex === 0) {
                slideshowTrack.style.transition = 'none';
                currentIndex = totalSlides;
                slideshowTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            }
            setTimeout(() => {
                currentIndex--;
                moveToSlide(currentIndex);
            }, 50);
        });

        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.addEventListener('click', () => {
                currentIndex = i;
                moveToSlide(currentIndex);
            });
            dotsContainer.appendChild(dot);
        }
        updateDots(0);
    }

    const comingSoonLinks = document.querySelectorAll('.coming-soon');
    comingSoonLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const popup = document.createElement('div');
            popup.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:15px 30px; background:linear-gradient(45deg, #ff6b6b, #c44569); color:white; border-radius:10px; z-index:1001; box-shadow:0 10px 30px rgba(0,0,0,0.3); font-size:1.1rem; font-weight:bold; opacity:0; transition:opacity 0.3s ease, top 0.3s ease;';
            popup.innerText = 'Tính năng sẽ sớm ra mắt!';
            document.body.appendChild(popup);
            setTimeout(() => { popup.style.opacity = '1'; popup.style.top = '30px'; }, 10);
            setTimeout(() => {
                popup.style.opacity = '0';
                popup.style.top = '20px';
                setTimeout(() => document.body.removeChild(popup), 300);
            }, 3000);
        });
    });

    // --- Logic for XacMinh.html ---
    const emailCheckForm = document.getElementById('emailCheckForm');
    if (emailCheckForm) {
        initEmailCheckForm();
    }

    // --- Logic for DoanhNghiep.html ---
    const emailTableBody = document.getElementById('emailTableBody');
    if (emailTableBody) {
        initBusinessDashboard();
    }

    // Scroll spy for navigation
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    if (sections.length > 0 && navLinks.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 100) { // 100 is the header height offset
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        });
    }
});


function initBusinessDashboard() {
    const emailSearch = document.getElementById('emailSearch');
    const statusFilter = document.getElementById('statusFilter');
    const emailTableBody = document.getElementById('emailTableBody');

    function populateTable(data) {
        emailTableBody.innerHTML = '';
        if (!data || data.length === 0) {
            emailTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Không có dữ liệu hoặc không tìm thấy kết quả.</td></tr>';
            return;
        }
        data.forEach(email => {
            let statusClass = '';
            let statusText = email.status || 'Chưa xác định';
            switch (statusText) {
                case 'An toàn': statusClass = 'status-safe'; break;
                case 'Nghi ngờ': statusClass = 'status-suspicious'; break;
                case 'Spam': statusClass = 'status-spam'; break;
                case 'Giả mạo': statusClass = 'status-phishing'; break;
            }

            const row = `
                <tr>
                    <td>${email.from_email || 'N/A'}</td>
                    <td>${email.title || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${email.date || 'N/A'}</td>
                    <td><button class="action-btn">Xem Chi Tiết</button></td>
                </tr>
            `;
            emailTableBody.innerHTML += row;
        });
    }

    async function fetchData() {
        const searchTerm = emailSearch.value;
        const statusValue = statusFilter.value;
        const apiUrl = `api/get_emails.php?search=${encodeURIComponent(searchTerm)}&status=${encodeURIComponent(statusValue)}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Lỗi mạng: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`Lỗi từ server: ${data.error}`);
            }
            populateTable(data);
        } catch (error) {
            console.error('Không thể lấy dữ liệu:', error);
            emailTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ff6b6b;">${error.message}</td></tr>`;
        }
    }

    // Debounce function to limit API calls while typing
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    emailSearch.addEventListener('input', debounce(fetchData, 500));
    statusFilter.addEventListener('change', fetchData);

    // Initial data load
    fetchData();
}


function initEmailCheckForm() {
    const form = document.getElementById('emailCheckForm');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        loading.classList.add('show');
        resultsSection.classList.remove('show');

        setTimeout(() => {
            const email = {
                from_email: document.getElementById('senderEmail').value,
                title: document.getElementById('subject').value,
                content: document.getElementById('emailContent').value,
            };
            const result = classifyEmail(email);
            updateResultUI(result);
            loading.classList.remove('show');
            resultsSection.classList.add('show');
        }, 1500);
    });
}

function updateResultUI(result) {
    const resultCard = document.getElementById('resultCard');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDescription = document.getElementById('resultDescription');
    const riskFactorsContainer = document.getElementById('riskFactors');

    let resultType = 'safe';
    let iconClass = 'fas fa-shield-alt';
    let descriptionText = 'Email này có vẻ an toàn. Tuy nhiên, hãy luôn cẩn trọng.';

    switch (result.category) {
        case 'Giả mạo':
            resultType = 'danger';
            iconClass = 'fas fa-times-circle';
            descriptionText = 'Email này có nhiều dấu hiệu lừa đảo cao. KHÔNG nên trả lời hoặc cung cấp thông tin.';
            break;
        case 'Spam':
        case 'Nghi ngờ':
            resultType = 'warning';
            iconClass = 'fas fa-exclamation-triangle';
            descriptionText = 'Email này có một số dấu hiệu đáng ngờ. Hãy xem xét kỹ các yếu tố bên dưới.';
            break;
    }

    resultCard.className = `result-card ${resultType}`;
    resultIcon.className = `result-icon ${resultType}`;
    resultIcon.innerHTML = `<i class="${iconClass}"></i>`;
    resultTitle.textContent = `${result.category} (Độ tin cậy: ${(result.confidence * 100).toFixed(0)}%)`;
    resultDescription.textContent = descriptionText;

    riskFactorsContainer.innerHTML = '';
    if (result.indicators && result.indicators.length > 0) {
        result.indicators.forEach(indicator => {
            const factorElement = document.createElement('div');
            let levelClass = 'low';
            if (resultType === 'danger') levelClass = 'high';
            if (resultType === 'warning') levelClass = 'medium';
            factorElement.className = `risk-factor ${levelClass}`;
            factorElement.innerHTML = `<div class="risk-icon"><i class="fas fa-search-dollar"></i></div><div>${indicator}</div>`;
            riskFactorsContainer.appendChild(factorElement);
        });
    }
}

function reportPhishing() {
    alert('Cảm ơn bạn đã báo cáo! Thông tin này sẽ giúp chúng tôi cải thiện hệ thống.');
}

function saveReport() {
    alert('Báo cáo đã được lưu! (Tính năng mô phỏng)');
}

function resetForm() {
    const form = document.getElementById('emailCheckForm');
    if (form) form.reset();
    document.getElementById('resultsSection').classList.remove('show');
    document.getElementById('loading').classList.remove('show');
} 