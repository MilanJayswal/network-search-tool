const fileUrls = {
  network: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Merged_Cluster_Relations.xlsx",
  keggNodes: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/T2DM_KEGG_Recursive_Nodes.xlsx",
  reactomeNodes: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/T2DM%20Reactome%20Recursive%20Nodes.xlsx",
  keggPathways: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/KEGG_Pathway_Metadata.xlsx",
  reactomePathways: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Reactome_Pathway_IDs_Names_Genes.xlsx",
  interactions: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Reactome_Interaction_IDs_Names.xlsx"
};

const resultsDiv = document.getElementById("results");
const popup = document.getElementById("popup");
const popupDetails = document.getElementById("popupDetails");

let networkData = [];
let nodeMetadata = {};
let relationMetadata = {};
let pathwayMetadata = {};
let interactionMetadata = {};

async function fetchExcel(url, sheetName = null) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const sheets = sheetName ? [sheetName] : wb.SheetNames;
  let combined = [];
  sheets.forEach(name => {
    const json = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
    combined = combined.concat(json);
  });
  return combined;
}

async function loadAllData() {
  const [network, kegg, reactome1, reactome2, reactome3, keggPath, reactomePath, interactions] = await Promise.all([
    fetchExcel(fileUrls.network),
    fetchExcel(fileUrls.keggNodes),
    fetchExcel(fileUrls.reactomeNodes, "Chebi Node ID"),
    fetchExcel(fileUrls.reactomeNodes, "UniProt NodeID Reactome"),
    fetchExcel(fileUrls.reactomeNodes, "Reactome NodeID Merged"),
    fetchExcel(fileUrls.keggPathways),
    fetchExcel(fileUrls.reactomePathways),
    fetchExcel(fileUrls.interactions)
  ]);

  networkData = network;

  // Merge node metadata by Node ID
  [kegg, reactome1, reactome2, reactome3].flat().forEach(row => {
    const key = row["Node ID"] || row["Node id for mapping"];
    if (key) {
      if (!nodeMetadata[key]) nodeMetadata[key] = {};
      Object.assign(nodeMetadata[key], row);
    }
  });

  // Pathway
  keggPath.forEach(r => pathwayMetadata[r["KEGG_ID"]] = r);
  reactomePath.forEach(r => pathwayMetadata[r["Unique_Reactome_Pathway_ID"]] = r);

  // Interaction
  interactions.forEach(r => interactionMetadata[r["Unique_Reactome_Interaction_ID"]] = r);

  console.log("✅ All files loaded");
}

function search() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!q) return;

  resultsDiv.innerHTML = "";
  const matchedNodeIDs = Object.entries(nodeMetadata)
    .filter(([_, meta]) => Object.values(meta).some(v => String(v).toLowerCase().includes(q)))
    .map(([id]) => id);

  const matches = networkData.filter(row =>
    matchedNodeIDs.includes(row.Source) || matchedNodeIDs.includes(row.Target)
  );

  if (matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matches found.</p>";
    return;
  }

  const table = document.createElement("table");
  const header = table.insertRow();
  ["Cluster ID", "Relation", "Source", "Target", "Interaction", "Pathway"].forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    header.appendChild(th);
  });

  matches.forEach(row => {
    const tr = table.insertRow();
    [row["Cluster ID"], row.Relation, row.Source, row.Target, row.Interaction, row.Pathway].forEach((val, i) => {
      const td = tr.insertCell();
      td.innerHTML = `<a href='#' onclick='showDetails(${JSON.stringify(JSON.stringify(row))})'>${val}</a>`;
    });

    const reasonRow = table.insertRow();
    const reasonCell = reasonRow.insertCell();
    reasonCell.colSpan = 6;
    reasonCell.innerHTML = `<div class='match-reason'>Matched node metadata for ID(s): ${
      [row.Source, row.Target].filter(id => matchedNodeIDs.includes(id)).join(", ")
    }</div>`;
  });

  resultsDiv.appendChild(table);
}

function showDetails(rawStr) {
  const row = JSON.parse(rawStr);
  const sourceMeta = nodeMetadata[row.Source] || {};
  const targetMeta = nodeMetadata[row.Target] || {};
  const pathwayMeta = pathwayMetadata[row.Pathway] || {};
  const interactionID = extractInteractionID(row.Interaction);
  const interactionMeta = interactionMetadata[interactionID] || {};

  popupDetails.innerHTML = `
    <h2>🧬 Relation ${row.Relation}</h2>
    <p><strong>Cluster:</strong> ${row["Cluster ID"]}</p>
    <p><strong>Interaction:</strong><br/>${row.Interaction.replaceAll("\\n", "<br/>")}</p>
    <p><strong>Pathway:</strong> ${row.Pathway} — ${pathwayMeta.Pathway_Name || ""}</p>
    <hr/>
    <h3>🔹 Source: ${row.Source}</h3>
    <pre>${JSON.stringify(sourceMeta, null, 2)}</pre>
    <h3>🔹 Target: ${row.Target}</h3>
    <pre>${JSON.stringify(targetMeta, null, 2)}</pre>
    ${interactionID ? `<h3>🔹 Interaction ID: ${interactionID}</h3><pre>${JSON.stringify(interactionMeta, null, 2)}</pre>` : ""}
  `;
  popup.classList.remove("hidden");
}

function extractInteractionID(raw) {
  const match = String(raw).match(/R-[A-Z]+-[0-9]+/g);
  return match ? match[0] : null;
}

function closePopup() {
  popup.classList.add("hidden");
}

// Auto-load everything
loadAllData();
