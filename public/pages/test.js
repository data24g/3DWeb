const {analyzeEmail} = require('./email-classifier');

const email = {
    title: "Lịch họp nhóm - Dự án ABC tuần này",
    content: "Chào Sơn, Mình đã gửi lịch họp nhóm cho dự án ABC tuần này. Vui lòng kiểm tra và xác nhận thời gian nhé. Cảm ơn!",
    from_email: "nguyenvan.a@abc-corp.vn",
}

const analysisResult = analyzeEmail(email);
console.log(analysisResult)