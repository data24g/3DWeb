// ===== SHARED JAVASCRIPT FUNCTIONS =====

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add animation on scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all feature cards and tip cards
    document.querySelectorAll('.feature-card, .tip-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Form validation
function initFormValidation() {
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
                this.classList.add('success');
            }
        });
    });
}

// Security badge animation
function initSecurityBadge() {
    const securityBadge = document.querySelector('.security-badge');
    if (securityBadge) {
        securityBadge.addEventListener('click', function() {
            this.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    }
}

// ===== EMAIL CHECK FORM SPECIFIC FUNCTIONS =====

// Email analysis function
function analyzeEmail() {
    const senderEmail = document.getElementById('senderEmail').value;
    const senderName = document.getElementById('senderName').value;
    const subject = document.getElementById('subject').value;
    const content = document.getElementById('emailContent').value;
    const urgency = document.getElementById('urgency').value;
    const requestType = document.getElementById('requestType').value;

    // Analysis logic
    let riskScore = 0;
    let riskFactors = [];
    let resultType = 'safe';
    let resultMessage = 'Email này có vẻ an toàn.';
    let resultDescription = 'Không phát hiện dấu hiệu lừa đảo rõ ràng.';

    // Check sender email
    if (senderEmail.includes('@gmail.com') && !senderEmail.includes('support') && !senderEmail.includes('noreply')) {
        riskScore += 20;
        riskFactors.push({
            level: 'medium',
            text: 'Địa chỉ email người gửi có thể giả mạo',
            icon: 'fas fa-user-secret'
        });
    }

    // Check for urgency
    if (urgency === 'high') {
        riskScore += 30;
        riskFactors.push({
            level: 'high',
            text: 'Email tạo cảm giác khẩn cấp - dấu hiệu lừa đảo',
            icon: 'fas fa-exclamation-triangle'
        });
    }

    // Check for suspicious keywords
    const suspiciousKeywords = ['mật khẩu', 'password', 'tài khoản', 'account', 'xác minh', 'verify', 'khẩn cấp', 'urgent', 'thanh toán', 'payment'];
    let foundKeywords = [];
    
    suspiciousKeywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword) || subject.toLowerCase().includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });

    if (foundKeywords.length > 0) {
        riskScore += foundKeywords.length * 15;
        riskFactors.push({
            level: 'medium',
            text: `Phát hiện từ khóa đáng ngờ: ${foundKeywords.join(', ')}`,
            icon: 'fas fa-search'
        });
    }

    // Check for financial requests
    if (requestType === 'payment') {
        riskScore += 40;
        riskFactors.push({
            level: 'high',
            text: 'Email yêu cầu thông tin thanh toán - rất đáng ngờ',
            icon: 'fas fa-dollar-sign'
        });
    }

    // Check for personal information requests
    if (requestType === 'personal') {
        riskScore += 35;
        riskFactors.push({
            level: 'high',
            text: 'Email yêu cầu thông tin cá nhân - cần thận trọng',
            icon: 'fas fa-id-card'
        });
    }

    // Determine result type
    if (riskScore >= 70) {
        resultType = 'danger';
        resultMessage = '⚠️ CẢNH BÁO: Email này có dấu hiệu lừa đảo cao!';
        resultDescription = 'Email này có nhiều dấu hiệu lừa đảo. Không nên trả lời hoặc cung cấp thông tin.';
    } else if (riskScore >= 40) {
        resultType = 'warning';
        resultMessage = '⚠️ CẢNH BÁO: Email này có dấu hiệu đáng ngờ';
        resultDescription = 'Email này có một số dấu hiệu đáng ngờ. Hãy thận trọng trước khi trả lời.';
    } else {
        resultType = 'safe';
        resultMessage = '✅ Email này có vẻ an toàn';
        resultDescription = 'Không phát hiện dấu hiệu lừa đảo rõ ràng. Tuy nhiên vẫn nên thận trọng.';
    }

    // Update UI
    updateResultUI(resultType, resultMessage, resultDescription, riskFactors);
}

// Update result UI
function updateResultUI(type, title, description, factors) {
    const resultCard = document.getElementById('resultCard');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultDescription = document.getElementById('resultDescription');
    const riskFactors = document.getElementById('riskFactors');

    if (!resultCard) return;

    // Update result card
    resultCard.className = `result-card ${type}`;
    
    // Update icon
    const iconClass = type === 'safe' ? 'fas fa-shield-check' : 
                    type === 'warning' ? 'fas fa-exclamation-triangle' : 
                    'fas fa-times-circle';
    resultIcon.className = `result-icon ${type}`;
    resultIcon.innerHTML = `<i class="${iconClass}"></i>`;
    
    // Update text
    resultTitle.textContent = title;
    resultDescription.textContent = description;
    
    // Update risk factors
    riskFactors.innerHTML = '';
    factors.forEach(factor => {
        const factorElement = document.createElement('div');
        factorElement.className = `risk-factor ${factor.level}`;
        factorElement.innerHTML = `
            <div class="risk-icon">
                <i class="${factor.icon}"></i>
            </div>
            <div>${factor.text}</div>
        `;
        riskFactors.appendChild(factorElement);
    });
}

// Report phishing function
function reportPhishing() {
    alert('Cảm ơn bạn đã báo cáo! Thông tin này sẽ được gửi đến đội ngũ bảo mật để xử lý.');
}

// Save report function
function saveReport() {
    alert('Báo cáo đã được lưu thành công!');
}

// Reset form function
function resetForm() {
    const form = document.getElementById('emailCheckForm');
    const resultsSection = document.getElementById('resultsSection');
    const loading = document.getElementById('loading');
    
    if (form) form.reset();
    if (resultsSection) resultsSection.classList.remove('show');
    if (loading) loading.classList.remove('show');
}

// Initialize email check form
function initEmailCheckForm() {
    const form = document.getElementById('emailCheckForm');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading
        if (loading) loading.classList.add('show');
        if (resultsSection) resultsSection.classList.remove('show');
        
        // Simulate analysis (replace with actual API call)
        setTimeout(() => {
            analyzeEmail();
            if (loading) loading.classList.remove('show');
            if (resultsSection) resultsSection.classList.add('show');
        }, 2000);
    });
}

// ===== HOMEPAGE SPECIFIC FUNCTIONS =====

// Initialize homepage specific functions
function initHomepage() {
    // Add click event for report button
    const reportButton = document.querySelector('a[href="#report"]');
    if (reportButton) {
        reportButton.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Tính năng báo cáo lừa đảo sẽ được triển khai sớm. Vui lòng liên hệ hotline 1900-1234 để báo cáo ngay!');
        });
    }
}

// ===== INITIALIZATION =====

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize shared functions
    initSmoothScrolling();
    initScrollAnimations();
    initFormValidation();
    initSecurityBadge();

    // Initialize page-specific functions
    if (document.getElementById('emailCheckForm')) {
        // Email check page
        initEmailCheckForm();
    } else {
        // Homepage
        initHomepage();
        initSlideshow();
    }
});

// ===== SLIDESHOW FUNCTIONS =====

let currentSlideIndex = 0;
let slideshowInterval;

// Initialize slideshow
function initSlideshow() {
    const slideshowTrack = document.querySelector('.slideshow-track');
    const dots = document.querySelectorAll('.dot');
    
    if (!slideshowTrack) return;
    
    const slideCards = document.querySelectorAll('.slide-card');
    const totalSlides = slideCards.length;
    const slidesPerView = Math.floor(1200 / 320); // Approximate card width + gap
    
    // Auto slide every 5 seconds
    slideshowInterval = setInterval(() => {
        changeSlide(1);
    }, 5000);
    
    // Pause auto-slide on hover
    slideshowTrack.addEventListener('mouseenter', () => {
        clearInterval(slideshowInterval);
    });
    
    slideshowTrack.addEventListener('mouseleave', () => {
        slideshowInterval = setInterval(() => {
            changeSlide(1);
        }, 5000);
    });
    
    // Add click events to slide cards
    slideCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            // Navigate to article (simulate)
            alert(`Đang chuyển đến bài viết: ${card.querySelector('h3').textContent}`);
        });
    });
}

// Change slide function
function changeSlide(direction) {
    const slideshowTrack = document.querySelector('.slideshow-track');
    const dots = document.querySelectorAll('.dot');
    const slideCards = document.querySelectorAll('.slide-card');
    
    if (!slideshowTrack) return;
    
    const totalSlides = slideCards.length;
    const slidesPerView = Math.floor(1200 / 320);
    const maxIndex = totalSlides - slidesPerView;
    
    if (direction === 1) {
        currentSlideIndex = (currentSlideIndex + 1) % (maxIndex + 1);
    } else {
        currentSlideIndex = currentSlideIndex === 0 ? maxIndex : currentSlideIndex - 1;
    }
    
    updateSlideshow();
}

// Go to specific slide
function currentSlide(index) {
    currentSlideIndex = index - 1;
    updateSlideshow();
}

// Update slideshow display
function updateSlideshow() {
    const slideshowTrack = document.querySelector('.slideshow-track');
    const dots = document.querySelectorAll('.dot');
    const slideCards = document.querySelectorAll('.slide-card');
    
    if (!slideshowTrack) return;
    
    const totalSlides = slideCards.length;
    const slidesPerView = Math.floor(1200 / 320);
    const maxIndex = totalSlides - slidesPerView;
    
    // Update track position
    const translateX = -(currentSlideIndex * 320); // 300px card + 20px gap
    slideshowTrack.style.transform = `translateX(${translateX}px)`;
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === currentSlideIndex) {
            dot.classList.add('active');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.style.opacity = currentSlideIndex === 0 ? '0.5' : '1';
        prevBtn.style.pointerEvents = currentSlideIndex === 0 ? 'none' : 'auto';
    }
    
    if (nextBtn) {
        nextBtn.style.opacity = currentSlideIndex === maxIndex ? '0.5' : '1';
        nextBtn.style.pointerEvents = currentSlideIndex === maxIndex ? 'none' : 'auto';
    }
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSmoothScrolling,
        initScrollAnimations,
        initFormValidation,
        initSecurityBadge,
        analyzeEmail,
        updateResultUI,
        reportPhishing,
        saveReport,
        resetForm,
        initEmailCheckForm,
        initHomepage,
        initSlideshow,
        changeSlide,
        currentSlide,
        updateSlideshow,
        debounce,
        throttle
    };
} 