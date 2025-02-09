// JavaScript to toggle the profile popup
function togglePopup() {
  const popup = document.getElementById("profile-popup");
  popup.style.display =
    popup.style.display === "none" || popup.style.display === ""
      ? "block"
      : "none";
}

// Close the popup if clicked outside
document.addEventListener("click", function (event) {
  const popup = document.getElementById("profile-popup");
  const profilePic = document.querySelector(".action-item");

  if (!popup.contains(event.target) && !profilePic.contains(event.target)) {
    popup.style.display = "none";
  }
});
