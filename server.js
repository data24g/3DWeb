const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, executeQuery, closePool } = require('./database-config');
const { analyzeEmailBackend } = require('./email-classifier');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Test database connection on startup
app.get('/api/test-connection', async (req, res) => {
    try {
        const isConnected = await testConnection();
        if (isConnected) {
            res.json({ 
                success: true, 
                message: 'Database connected successfully!',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Database connection failed!',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint để phân tích và lưu email check
app.post('/api/analyze-email', async (req, res) => {
    try {
        const { 
            senderEmail, 
            senderName, 
            subject, 
            content, 
            urgency, 
            requestType, 
            suspiciousElements 
        } = req.body;

        // Phân tích email sử dụng logic backend
        const analysisResult = analyzeEmailBackend({
            senderEmail,
            senderName,
            subject,
            content,
            urgency,
            requestType,
            suspiciousElements
        });

        if (!analysisResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to analyze email'
            });
        }

        const analysisData = analysisResult.data;

        // Lưu vào database
        const sql = `
            INSERT INTO email_done (
                sender_email, 
                sender_name, 
                subject, 
                content, 
                urgency, 
                request_type, 
                suspicious_elements,
                category,
                confidence,
                level,
                indicators,
                result_type,
                result_message,
                result_description,
                risk_factors,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const params = [
            analysisData.senderEmail,
            analysisData.senderName,
            analysisData.subject,
            analysisData.content,
            analysisData.urgency,
            analysisData.requestType,
            analysisData.suspiciousElements,
            analysisData.classification.category,
            analysisData.classification.confidence,
            analysisData.classification.level,
            JSON.stringify(analysisData.classification.indicators),
            analysisData.result.type,
            analysisData.result.message,
            analysisData.result.description,
            JSON.stringify(analysisData.result.riskFactors)
        ];

        const dbResult = await executeQuery(sql, params);
        
        if (dbResult.success) {
            res.json({ 
                success: true, 
                message: 'Email analyzed and saved successfully!',
                id: dbResult.data.insertId,
                analysis: analysisData
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save email analysis',
                error: dbResult.error,
                analysis: analysisData
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// API endpoint để lưu thông tin email check (legacy)
app.post('/api/save-email-check', async (req, res) => {
    try {
        const { 
            senderEmail, 
            senderName, 
            subject, 
            content, 
            urgency, 
            requestType, 
            suspiciousElements,
            resultType,
            resultMessage,
            riskFactors 
        } = req.body;

        const sql = `
            INSERT INTO email_checks (
                sender_email, 
                sender_name, 
                subject, 
                content, 
                urgency, 
                request_type, 
                suspicious_elements,
                result_type,
                result_message,
                risk_factors,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const params = [
            senderEmail,
            senderName,
            subject,
            content,
            urgency,
            requestType,
            suspiciousElements,
            resultType,
            resultMessage,
            JSON.stringify(riskFactors)
        ];

        const result = await executeQuery(sql, params);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Email check saved successfully!',
                id: result.data.insertId
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save email check',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// API endpoint để lấy lịch sử email checks từ bảng email_done
app.get('/api/email-checks', async (req, res) => {
    try {
        const sql = `
            SELECT * FROM email_done 
            ORDER BY created_at DESC 
            LIMIT 50
        `;

        const result = await executeQuery(sql);
        
        if (result.success) {
            res.json({ 
                success: true, 
                data: result.data 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch email checks',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// API endpoint để lấy thống kê từ bảng email_done
app.get('/api/email-statistics', async (req, res) => {
    try {
        const stats = {};

        // Tổng số email checks
        const emailCountResult = await executeQuery('SELECT COUNT(*) as total FROM email_done');
        if (emailCountResult.success) {
            stats.totalEmailChecks = emailCountResult.data[0].total;
        }

        // Email checks theo loại
        const emailTypeResult = await executeQuery(`
            SELECT category, COUNT(*) as count 
            FROM email_done 
            GROUP BY category
        `);
        if (emailTypeResult.success) {
            stats.emailTypes = emailTypeResult.data;
        }

        // Email checks theo confidence level
        const confidenceResult = await executeQuery(`
            SELECT 
                CASE 
                    WHEN confidence >= 0.8 THEN 'High'
                    WHEN confidence >= 0.5 THEN 'Medium'
                    ELSE 'Low'
                END as confidence_level,
                COUNT(*) as count
            FROM email_done 
            GROUP BY confidence_level
        `);
        if (confidenceResult.success) {
            stats.confidenceLevels = confidenceResult.data;
        }

        // Email checks theo ngày
        const dailyResult = await executeQuery(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM email_done 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        if (dailyResult.success) {
            stats.dailyStats = dailyResult.data;
        }

        res.json({ 
            success: true, 
            data: stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// API endpoint để lưu báo cáo lừa đảo
app.post('/api/save-report', async (req, res) => {
    try {
        const { 
            reportType, 
            description, 
            contactInfo, 
            evidence 
        } = req.body;

        const sql = `
            INSERT INTO scam_reports (
                report_type, 
                description, 
                contact_info, 
                evidence,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, 'pending', NOW())
        `;

        const params = [
            reportType,
            description,
            contactInfo,
            evidence
        ];

        const result = await executeQuery(sql, params);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Report saved successfully!',
                id: result.data.insertId
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save report',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// API endpoint để lấy thống kê
app.get('/api/statistics', async (req, res) => {
    try {
        const stats = {};

        // Tổng số email checks
        const emailCountResult = await executeQuery('SELECT COUNT(*) as total FROM email_checks');
        if (emailCountResult.success) {
            stats.totalEmailChecks = emailCountResult.data[0].total;
        }

        // Tổng số báo cáo
        const reportCountResult = await executeQuery('SELECT COUNT(*) as total FROM scam_reports');
        if (reportCountResult.success) {
            stats.totalReports = reportCountResult.data[0].total;
        }

        // Email checks theo loại
        const emailTypeResult = await executeQuery(`
            SELECT result_type, COUNT(*) as count 
            FROM email_checks 
            GROUP BY result_type
        `);
        if (emailTypeResult.success) {
            stats.emailTypes = emailTypeResult.data;
        }

        // Báo cáo theo loại
        const reportTypeResult = await executeQuery(`
            SELECT report_type, COUNT(*) as count 
            FROM scam_reports 
            GROUP BY report_type
        `);
        if (reportTypeResult.success) {
            stats.reportTypes = reportTypeResult.data;
        }

        res.json({ 
            success: true, 
            data: stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'HomePage.html'));
});

app.get('/business', (req, res) => {
    res.sendFile(path.join(__dirname, 'BusinessPage.html'));
});

app.get('/email-check', (req, res) => {
    res.sendFile(path.join(__dirname, 'XacMinh.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    closePool();
    process.exit(0);
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
}); 