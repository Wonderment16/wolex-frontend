console.log("Reset password script loaded");

const form = document.getElementById("reset-form");
const message = document.getElementById("reset-message");

const params = new URLSearchParams(window.location.search);
let uid = params.get("uid");
let token = params.get("token");

// Clean the strings if they start with '3D'
if (uid && uid.startsWith('3D')) uid = uid.substring(2);
if (token && token.startsWith('3D')) token = token.substring(2);

console.log("Extracted UID:", uid);
console.log("Extracted Token:", token);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Basic password validation
  if (password.length < 8) {
    message.style.color = "red";
    message.textContent = "Password must be at least 8 characters long.";
    return;
  }

  if (password !== confirmPassword) {
    message.style.color = "red";
    message.textContent = "Passwords do not match.";
    return;
  }

  if (!uid || !token) {
  message.style.color = "red";
  message.textContent = "Invalid or broken reset link.";
  return;
}

console.log("Sending reset request:", { uid, token, password });

  try {
    const response = await fetch("https://wolex.onrender.com/api/auth/password-reset/confirm/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        token,
        new_password: password
      })
    });

    const data = await response.json();

console.log("Response status:", response.status);
console.log("Response data:", data);


    if (response.ok) {
      message.style.color = "green";
      message.textContent = "Password reset successful.";

      setTimeout(() => {
        window.location.href = "/pages/login.html";
      }, 2000);
    } else {
      message.style.color = "red";
      message.textContent = data.error || data.errors || "Reset failed.";
    }
  } catch (error) {
    message.style.color = "red";
    message.textContent = "Something went wrong.";
  }
});






