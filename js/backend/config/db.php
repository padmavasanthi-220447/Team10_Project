<?php

$host = "localhost";
$user = "root";
$password = "Hrdss@15";
$database = "smart_expense";

$conn = new mysqli($host,$user,$password,$database);

if($conn->connect_error){
    die("Connection failed");
}

?>