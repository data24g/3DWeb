<?php
// Set headers to allow requests from any origin and to specify JSON content type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database connection
require 'connect.php';

// Get the raw POST data from the request
$data = json_decode(file_get_contents("php://input"));

// --- Basic Validation ---
// Check if data is not empty and has the required fields
if (
    !empty($data->sender_email) &&
    !empty($data->subject) &&
    !empty($data->content) &&
    !empty($data->classification)
) {
    // Sanitize the input data
    $sender_email = htmlspecialchars(strip_tags($data->sender_email));
    $subject = htmlspecialchars(strip_tags($data->subject));
    $content = htmlspecialchars(strip_tags($data->content));
    $classification = htmlspecialchars(strip_tags($data->classification));

    // --- Prepare and Execute SQL Query ---
    $query = "INSERT INTO reported_emails (sender_email, subject, content, classification) VALUES (?, ?, ?, ?)";
    
    $stmt = mysqli_prepare($conn, $query);

    if ($stmt) {
        // Bind parameters to the prepared statement
        mysqli_stmt_bind_param($stmt, "ssss", $sender_email, $subject, $content, $classification);
        
        // Execute the statement
        if (mysqli_stmt_execute($stmt)) {
            // Set response code - 201 created
            http_response_code(201);
            // Send success response
            echo json_encode(array("message" => "Báo cáo đã được lưu thành công."));
        } else {
            // Set response code - 503 service unavailable
            http_response_code(503);
            // Send error response
            echo json_encode(array("message" => "Không thể lưu báo cáo. Lỗi khi thực thi: " . mysqli_stmt_error($stmt)));
        }
        mysqli_stmt_close($stmt);
    } else {
        // Set response code - 503 service unavailable
        http_response_code(503);
        echo json_encode(array("message" => "Không thể chuẩn bị câu lệnh. Lỗi: " . mysqli_error($conn)));
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    // Send error response for incomplete data
    echo json_encode(array("message" => "Không thể lưu báo cáo. Dữ liệu không đầy đủ."));
}

// Close connection
mysqli_close($conn);
?> 