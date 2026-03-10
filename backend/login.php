<?php

include "db.php";

$email = $_POST['email'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE email='$email'";
$result = $conn->query($sql);

if($result->num_rows == 1){

    $user = $result->fetch_assoc();

    if(password_verify($password,$user['password'])){
        header("Location: ../../dashboard.html");
    }else{
        echo "Invalid password";
    }

}else{
    echo "User not found";
}

?>