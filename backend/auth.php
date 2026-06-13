<?php
require_once 'db_config.php';

// Enable CORS if needed (adjust based on deployment)
header('Content-Type: application/json');

session_start();

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $user = isset($_POST['username']) ? trim($_POST['username']) : '';
        $pass = isset($_POST['password']) ? trim($_POST['password']) : '';

        $envUser = getenv('ADMIN_USER');
        $envPass = getenv('ADMIN_PASS');

        if ($user === $envUser && $pass === $envPass) {
            $_SESSION['sumadhura_admin_logged_in'] = true;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
} elseif ($action === 'check') {
    if (isset($_SESSION['sumadhura_admin_logged_in']) && $_SESSION['sumadhura_admin_logged_in'] === true) {
        echo json_encode(['success' => true, 'logged_in' => true]);
    } else {
        echo json_encode(['success' => true, 'logged_in' => false]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
