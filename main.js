// 📁 main.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 Initializing app...");
  loadAllData().then(() => {
    console.log("🚀 Ready for search");
  });

  const input = document.getElementById("searchInput");
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      runSearch();
    }
  });

  document.getElementById("searchButton").addEventListener("click", runSearch);
});

function runSearch() {
  const query = document.getElementById("searchInput").value;
  const results = searchNetwork(query);
  renderResults(results);
}
