<?php
require_once 'db_config.php';

// Include Composer autoloader
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json');

session_start();

$action = isset($_GET['action']) ? $_GET['action'] : 'submit';

// Require authentication for admin actions
if (in_array($action, ['fetch', 'update_status', 'delete'])) {
    if (!isset($_SESSION['sumadhura_admin_logged_in']) || $_SESSION['sumadhura_admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

if ($action === 'submit') {
    // Handle new lead submission
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $bhk = isset($_POST['interestedIn']) ? trim($_POST['interestedIn']) : 'Not Specified';
        $message = isset($_POST['message']) ? trim($_POST['message']) : '';
        $source = isset($_POST['source']) ? trim($_POST['source']) : 'Website Form';
        $honeypot = isset($_POST['website_url']) ? trim($_POST['website_url']) : '';

        // 1. Honeypot Check (Bots)
        if (!empty($honeypot)) {
            echo json_encode(['success' => false, 'message' => 'Spam detected.']);
            exit;
        }

        // Basic validation
        if (empty($name) || empty($phone)) {
            echo json_encode(['success' => false, 'message' => 'Name and Phone are required.']);
            exit;
        }

        // 2. Email format & MX Record Verification
        if (!empty($email)) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
                exit;
            }
            $domain = substr(strrchr($email, "@"), 1);
            if (!checkdnsrr($domain, 'MX')) {
                echo json_encode(['success' => false, 'message' => 'Email domain is invalid or does not exist.']);
                exit;
            }
        }

        // 3. VPN / Proxy Check via ip-api.com
        $ip = $_SERVER['REMOTE_ADDR'];
        if ($ip !== '127.0.0.1' && $ip !== '::1') { // Skip localhost testing
            $api_url = "http://ip-api.com/json/{$ip}?fields=status,proxy,hosting";
            $ch = curl_init($api_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3); // 3s timeout to fail open
            $response = curl_exec($ch);
            curl_close($ch);

            if ($response) {
                $geo = json_decode($response, true);
                if (isset($geo['status']) && $geo['status'] === 'success') {
                    if ((isset($geo['proxy']) && $geo['proxy'] === true) || 
                        (isset($geo['hosting']) && $geo['hosting'] === true)) {
                        echo json_encode(['success' => false, 'message' => 'VPNs and Proxies are not allowed to submit leads.']);
                        exit;
                    }
                }
            }
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO leads (name, phone, email, bhk, message, source, status) VALUES (:name, :phone, :email, :bhk, :message, :source, 'New')");
            $stmt->execute([
                ':name' => $name,
                ':phone' => $phone,
                ':email' => $email,
                ':bhk' => $bhk,
                ':message' => $message,
                ':source' => $source
            ]);

            // Send email notification via SMTP (PHPMailer)
            $to_emails = getenv('ADMIN_EMAIL');
            $subject = getenv('EMAIL_SUBJECT');
            $emailBody = "New Lead from Sumadhura Edition:\n\nName: $name\nPhone: $phone\nEmail: $email\nInterest: $bhk\nSource: $source\nMessage:\n$message";

            if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                $mail = new PHPMailer(true);
                try {
                    // Server settings
                    $mail->isSMTP();
                    $mail->Host       = getenv('SMTP_HOST');
                    $mail->SMTPAuth   = true;
                    $mail->Username   = getenv('SMTP_USER');
                    $mail->Password   = getenv('SMTP_PASS');
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                    $mail->Port       = getenv('SMTP_PORT') ?: 587;

                    // Recipients
                    $mail->setFrom(getenv('SMTP_USER'), 'Sumadhura Edition');
                    
                    // Support multiple comma-separated emails
                    $recipients = explode(',', $to_emails);
                    foreach ($recipients as $recipient) {
                        $mail->addAddress(trim($recipient));
                    }

                    // Content
                    $mail->isHTML(false);
                    $mail->Subject = $subject;
                    $mail->Body    = $emailBody;

                    $mail->send();
                } catch (\Exception $e) {
                    // Silently fail so user still sees success message (lead is in DB)
                    error_log("Mailer Error: {$mail->ErrorInfo}");
                }
            } else {
                // Fallback to basic mail if Composer isn't run yet
                $headers = "From: " . getenv('SMTP_USER');
                @mail($to_emails, $subject, $emailBody, $headers);
            }

            echo json_encode(['success' => true, 'message' => 'Thank you! Our expert will contact you within 2 hours.']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    }
} elseif ($action === 'fetch') {
    // Fetch all leads for admin dashboard
    try {
        $stmt = $pdo->query("SELECT * FROM leads ORDER BY timestamp DESC LIMIT 2000");
        $leads = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $leads]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error.']);
    }
} elseif ($action === 'update_status') {
    // Update lead status
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $status = isset($_POST['status']) ? trim($_POST['status']) : '';

        if ($id > 0 && !empty($status)) {
            try {
                $stmt = $pdo->prepare("UPDATE leads SET status = :status WHERE id = :id");
                $stmt->execute([':status' => $status, ':id' => $id]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid parameters.']);
        }
    }
} elseif ($action === 'delete') {
    // Delete a lead
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

        if ($id > 0) {
            try {
                $stmt = $pdo->prepare("DELETE FROM leads WHERE id = :id");
                $stmt->execute([':id' => $id]);
                echo json_encode(['success' => true]);
            } catch(PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid parameters.']);
        }
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}
?>
