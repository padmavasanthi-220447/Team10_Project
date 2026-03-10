<?php

include "db.php";

$fullname = $_POST['fullname'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$password = $_POST['password'];
$confirm = $_POST['confirm-password'];

# check password match
if($password != $confirm){
    echo "Passwords do not match";
    exit();
}

# check email already exists
$check = "SELECT * FROM users WHERE email='$email'";
$result = $conn->query($check);

if($result->num_rows > 0){
    echo "Email already registered";
    exit();
}

# hash password (secure)
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

# insert user
$sql = "INSERT INTO users(fullname,email,phone,password)
VALUES('$fullname','$email','$phone','$hashedPassword')";

if($conn->query($sql)){
    header("Location: ../../login.html");
}else{
    echo "Registration failed";
}

?>