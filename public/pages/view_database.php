<?php
// --- SETUP ---
header('Content-Type: text/html; charset=utf-8');
// Always include connection and set charset first.
require 'connect.php';
mysqli_set_charset($conn, "utf8mb4");

// --- DATA FETCHING LOGIC ---

// 1. Get all table names from the database.
$tables_result = mysqli_query($conn, "SHOW TABLES");
$all_tables = [];
if ($tables_result) {
    while ($row = mysqli_fetch_row($tables_result)) {
        $all_tables[] = $row[0];
    }
}

// 2. Check if user has selected a table to view.
$selected_table = null;
$table_data = [];
$table_headers = [];
$total_rows = 0;

if (isset($_GET['table']) && in_array($_GET['table'], $all_tables)) {
    $selected_table = $_GET['table'];
    $escaped_table = mysqli_real_escape_string($conn, $selected_table);

    // 3. Get the total number of rows in the selected table.
    $count_query = "SELECT COUNT(*) as total FROM `{$escaped_table}`";
    $count_result = mysqli_query($conn, $count_query);
    if ($count_result) {
        $total_rows = mysqli_fetch_assoc($count_result)['total'];
    }

    // 4. Get the first 100 rows of data from the selected table.
    $data_query = "SELECT * FROM `{$escaped_table}` LIMIT 100";
    $data_result = mysqli_query($conn, $data_query);
    
    if ($data_result && mysqli_num_rows($data_result) > 0) {
        $table_headers = array_keys(mysqli_fetch_assoc($data_result));
        mysqli_data_seek($data_result, 0); // Reset pointer to start
        while ($row = mysqli_fetch_assoc($data_result)) {
            $table_data[] = $row;
        }
    }
}

// --- HTML PAGE RENDERING ---
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trình xem Database</title>
    <style>
        :root {
            --primary-color: #007bff;
            --secondary-color: #28a745;
            --background-gradient: linear-gradient(135deg, #e0f7fa 0%, #d4eaf7 100%);
            --header-gradient: linear-gradient(135deg, var(--primary-color) 0%, #0056b3 100%);
            --table-header-gradient: linear-gradient(135deg, var(--secondary-color) 0%, #1e7e34 100%);
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 2rem;
            background: var(--background-gradient);
            color: #343a40;
        }
        .container {
            max-width: 1500px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        .header {
            background: var(--header-gradient);
            color: white;
            padding: 2.5rem;
            text-align: center;
        }
        .header h1 { font-size: 2.2rem; margin: 0; }
        .content-wrapper { padding: 2rem; }
        .section { margin-bottom: 2rem; }
        .section h2 { border-bottom: 2px solid #dee2e6; padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--primary-color); }
        .table-list { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0; list-style: none; }
        .table-list-item a {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.2rem;
            background: #e9ecef;
            border-radius: 6px;
            text-decoration: none;
            color: #495057;
            font-weight: 500;
            transition: all 0.2s ease-in-out;
        }
        .table-list-item a:hover, .table-list-item a.active {
            background: var(--primary-color);
            color: white;
            transform: scale(1.05);
        }
        .table-info {
            background-color: #f8f9fa;
            border-left: 4px solid var(--primary-color);
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 4px;
        }
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #dee2e6; }
        .data-table th {
            background: var(--table-header-gradient);
            color: white;
            font-weight: 600;
        }
        .data-table tr:nth-child(even) { background-color: #f8f9fa; }
        .data-table tr:hover { background-color: #e9ecef; }
        .empty-state { text-align: center; padding: 3rem; color: #6c757d; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>📊 Trình xem Database</h1>
    </div>

    <div class="content-wrapper">
        <div class="section">
            <h2>Chọn một bảng để phân tích</h2>
            <?php if (!empty($all_tables)): ?>
                <ul class="table-list">
                    <?php foreach ($all_tables as $table): ?>
                        <li class="table-list-item">
                            <a href="?table=<?= htmlspecialchars($table) ?>" class="<?= $selected_table === $table ? 'active' : '' ?>">
                                📋 <?= htmlspecialchars($table) ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p class="empty-state">⚠️ Không tìm thấy bảng nào.</p>
            <?php endif; ?>
        </div>

        <?php if ($selected_table): ?>
        <div class="section">
            <h2>Dữ liệu từ bảng: `<?= htmlspecialchars($selected_table) ?>`</h2>
            
            <div class="table-info">
                Hiển thị <strong><?= count($table_data) ?></strong> dòng (trong tổng số <strong><?= number_format($total_rows) ?></strong> dòng).
            </div>

            <?php if (!empty($table_data)): ?>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <?php foreach ($table_headers as $header): ?>
                                    <th><?= htmlspecialchars($header) ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($table_data as $data_row): ?>
                                <tr>
                                    <?php foreach ($data_row as $cell): ?>
                                        <td><?= htmlspecialchars((string)$cell, ENT_QUOTES, 'UTF-8') ?></td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php else: ?>
                <p class="empty-state">Bảng này không có dữ liệu để hiển thị.</p>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

</body>
</html>
<?php
mysqli_close($conn);
?> 