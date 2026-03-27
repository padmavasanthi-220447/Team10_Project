const API_BASE = "/api";

async function loadAdminData(){

try{

const response = await fetch(`${API_BASE}/admin/stats`);
const data = await response.json();

// ✅ UPDATE CARDS
document.getElementById("totalUsers").textContent = data.totalUsers;
document.getElementById("activeUsers").textContent = data.activeUsers;

// ✅ UPDATE TABLE
const table = document.getElementById("userTable");
table.innerHTML = "";

data.users.forEach(user=>{

const row = table.insertRow();

row.innerHTML = `
<td>${user.email}</td>
<td>${user.loginCount || 0}</td>
<td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td>
`;

});

}catch(error){

console.log(error);

}

}

document.addEventListener("DOMContentLoaded", loadAdminData);