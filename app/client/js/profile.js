async function getProfileData() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      displayProfile(data.user);
    } else {
      const error = await response.json();
      alert(
        `Failed to fetch profile data: ${error.message || "Unknown error"}`,
      );
    }
  } catch (error) {
    console.error("Error fetching profile", error);
    alert("An error occurred while fetching profile data");
  }
}

function displayProfile(data) {
  const section = document.querySelector("section");

  section.innerHTML = `
    <div class="profile-container">
      <h1>Account Settings</h1>

      <div class="profile-section">
        <h2>Account Information</h2>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="text"
            id="email"
            value="${data.email || ""}"
            disabled
            class="disabled-input"
          />
          <small class="muted-text">This is the email associated with your account</small>
        </div>
      </div>

      <div class="profile-section">
        <h2>Change Password</h2>
        <form id="password-change-form">
          <div class="form-group">
            <label for="current-password">Current Password</label>
            <input
              type="password"
              id="current-password"
              name="currentPassword"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div class="form-group">
            <label for="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              placeholder="Enter your new password"
              required
              minlength="8"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              placeholder="Confirm your new password"
              required
            />
          </div>

          <button type="submit" class="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
    <a href="/dashboard"><- Back to dashboard</a>
  `;

  document
    .getElementById("password-change-form")
    .addEventListener("submit", handlePasswordChange);
}

async function handlePasswordChange(e) {
  // Need to implement
  alert(
    "Made it! However, nothing changed because it still needs to be implemented.",
  );
}

document.addEventListener("DOMContentLoaded", getProfileData);
