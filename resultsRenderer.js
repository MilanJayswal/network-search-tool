// 📁 resultsRenderer.js

function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = "<p>No matches found.</p>";
    return;
  }

  const table = document.createElement("table");
  const header = table.insertRow();
  ["Cluster ID", "Relation", "Source", "Target", "Interaction", "Pathway"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    header.appendChild(th);
  });

  results.forEach(row => {
    const tr = table.insertRow();
    const values = [
      row.cluster || "-",
      row.relation || "-",
      row.source || "-",
      row.target || "-",
      row.interaction || "-",
      row.pathway || "-"
    ];

    values.forEach(val => {
      const td = tr.insertCell();
      td.innerHTML = `<a href='#' onclick='showDetails(${JSON.stringify(JSON.stringify(row))})'>${val}</a>`;
    });

    const reasonRow = table.insertRow();
    const reasonCell = reasonRow.insertCell();
    reasonCell.colSpan = 6;
    reasonCell.innerHTML = `<div class='match-reason'>🔍 ${row.reason}</div>`;
  });

  container.appendChild(table);
}
