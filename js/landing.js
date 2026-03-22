const API_BASE = "http://localhost:5000/api";

async function loadLandingStats(){

try{

const response = await fetch(`${API_BASE}/admin/stats`);
const data = await response.json();

// UPDATE VALUES
document.getElementById("totalUsers").textContent = data.totalUsers;
document.getElementById("activeUsers").textContent = data.activeUsers;
var inactiveCount = data.totalUsers - data.activeUsers;
document.getElementById("inactiveUsers").textContent = inactiveCount || 0;

// OPTIONAL: inactive users


}catch(error){

console.log(error);

}

}

document.addEventListener("DOMContentLoaded", loadLandingStats);