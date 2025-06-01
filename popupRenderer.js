// 📁 popupRenderer.js

function showDetails(rawStr) {
  const row = JSON.parse(rawStr);
  const sourceMeta = nodeMetadata[row.source] || {};
  const targetMeta = nodeMetadata[row.target] || {};
  const pathwayMeta = pathwayMetadata[row.pathway] || {};
  const interactionID = extractInteractionID(row.interaction);
  const interactionMeta = interactionID ? (interactionMetadata[interactionID] || {}) : {};

  const html = `
    <h2>🧩 Relation: ${row.relation}</h2>
    <p><strong>Cluster:</strong> ${row.cluster}</p>
    <p><strong>Interaction:</strong><br/>${row.interaction.replaceAll("\\n", "<br/>")}</p>
    <p><strong>Pathway:</strong> ${row.pathway} — ${pathwayMeta.Pathway_Name || "N/A"}</p>
    <hr/>
    <h3>🔹 Source Node: ${row.source}</h3>
    <pre>${JSON.stringify(sourceMeta, null, 2)}</pre>
    <h3>🔹 Target Node: ${row.target}</h3>
    <pre>${JSON.stringify(targetMeta, null, 2)}</pre>
    ${interactionID ? `<h3>🔹 Interaction ID: ${interactionID}</h3><pre>${JSON.stringify(interactionMeta, null, 2)}</pre>` : ""}
  `;

  document.getElementById("popupDetails").innerHTML = html;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

function extractInteractionID(raw) {
  const match = String(raw).match(/R-[A-Z]+-[0-9]+/g);
  return match ? match[0] : null;
}
