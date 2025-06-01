const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const popup = document.getElementById("popup");
const popupDetails = document.getElementById("popupDetails");

// TODO: Replace with actual Excel loading later
const mockData = [
  {
    cluster: "CR00001",
    relation: "R000010",
    source: "N001115",
    target: "N000686",
    interaction: "Type: compound\nMode: ECrel",
    pathway: "ko00230",
    matchReason: "Matched keyword 'insulin' in node metadata for N001115"
  }
];

function search() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  resultsDiv.innerHTML = ""; // clear old results

  // Simulate filtering
  const matched = mockData.filter(row =>
    row.matchReason.toLowerCase().includes(query)
  );

  if (matched.length === 0) {
    resultsDiv.innerHTML = "<p>No matches found.</p>";
    return;
  }

  // Create table
  const table = document.createElement("table");
  const header = table.insertRow();
  ["Cluster ID", "Relation", "Source", "Target", "Interaction", "Pathway"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    header.appendChild(th);
  });

  matched.forEach(row => {
    const tr = table.insertRow();
    [row.cluster, row.relation, row.source, row.target, row.interaction, row.pathway].forEach((val, i) => {
      const td = tr.insertCell();
      td.innerHTML = `<a href='#' onclick='showDetails(${JSON.stringify(row)})'>${val}</a>`;
    });

    const reasonRow = table.insertRow();
    const reasonCell = reasonRow.insertCell();
    reasonCell.colSpan = 6;
    reasonCell.innerHTML = `<div class='match-reason'>🔍 ${row.matchReason}</div>`;
  });

  resultsDiv.appendChild(table);
}

function showDetails(data) {
  popupDetails.innerHTML = `
    <h3>📘 Details for ${data.relation}</h3>
    <p><strong>Cluster:</strong> ${data.cluster}</p>
    <p><strong>Source Node:</strong> ${data.source}</p>
    <p><strong>Target Node:</strong> ${data.target}</p>
    <p><strong>Interaction:</strong><br/>${data.interaction.replace(/\\n/g, \"<br/>\")}</p>
    <p><strong>Pathway:</strong> ${data.pathway}</p>
    <hr/>
    <p><em>${data.matchReason}</em></p>
  `;
  popup.classList.remove(\"hidden\");
}

function closePopup() {
  popup.classList.add(\"hidden\");
}
