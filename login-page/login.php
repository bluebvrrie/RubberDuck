<?php
session_start();
$errors=[
    'login'=>$_SESSION['login_error'] ?? '',
    'register'=>$_SESSION['register_error'] ?? ''
];
$activeform=$_SESSION['active_form'] ?? 'login';
session_unset();
function showError($error){
    return !empty($error) ? "<p class='error-message'>$error</p>": '';
}
function isActiveForm($formName,$activeForm){
    return $formName === $activeForm ? 'active': '';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login and Registration</title>
    <link rel="stylesheet" href="login.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    
    <center>
    <div class="container">
        <div class="form-box <?= isActiveForm('login',$activeform); ?>" id="login-form">
            <form action="fullstack.php" method="post">
                <h2>Login</h2>
                <br>
                <input type="email" name="email" placeholder="Email" required>
                <br>
                <div class="icons">
                    <input type="password" name="password" placeholder="password" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" class="pass" required>
                    <i class="fa-regular fa-eye" id="togglePassword"></i>
                </div>
                <br>
                <button type="submit" name="login">Login</button>
                <p>Dont have an account? <a href="#" onclick="showform('register-form')">Register</a> </p>
            </form>    
        </div>

        <div class="form-box <?= isActiveForm('register',$activeform); ?>" id="register-form">
            <form action="fullstack.php" method="post">
                <h2>Register</h2>
                <br>
                <input type="text" name="name" placeholder="Name" required>
                <input type="email" name="email" placeholder="Email" required>
                <br>
                <div class="icons">
                    <input type="password" name="password" placeholder="password" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" class="pass2" required>
                    <i class="fa-regular fa-eye" id="togglePassword2"></i>
                </div>
                <br>
                <select name="role" required>
                    <option value="">--Select Role--</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" name="register">Register</button>
                <p>Already have an account? <a href="#" onclick="showform('login-form')">Login</a> </p>
            </form>    
        </div>
    </div>
    </center>
    <script src="login.js"></script>
</body>
</html>