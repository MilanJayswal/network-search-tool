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
let pathwayMetadata = {};
let interactionMetadata = {};
let allRelationToClusterMap = {};

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

  // Index cluster IDs
  network.forEach(r => {
    if (r.Relation) {
      allRelationToClusterMap[r.Relation] = r["Cluster ID"] || "-";
    }
  });

  // Merge node metadata
  [kegg, reactome1, reactome2, reactome3].flat().forEach(row => {
    const key = row["Node ID"] || row["Node id for mapping"];
    if (key) {
      if (!nodeMetadata[key]) nodeMetadata[key] = {};
      Object.assign(nodeMetadata[key], row);
    }
  });

  // Pathways
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
  let matchedNodeIDs = new Set();

  // Match in node metadata
  for (const [nodeID, meta] of Object.entries(nodeMetadata)) {
    for (const val of Object.values(meta)) {
      if (String(val).toLowerCase().includes(q)) {
        matchedNodeIDs.add(nodeID);
        break;
      }
    }
  }

  // Match in network directly by raw ID/text
  const results = [];
  for (const row of networkData) {
    const source = row.Source;
    const target = row.Target;
    const relation = row.Relation;
    const pathway = row.Pathway || "";
    const interaction = row.Interaction || "";
    const cluster = allRelationToClusterMap[relation] || "-";

    const matchFound = (
      matchedNodeIDs.has(source) ||
      matchedNodeIDs.has(target) ||
      String(relation).toLowerCase().includes(q) ||
      String(source).toLowerCase().includes(q) ||
      String(target).toLowerCase().includes(q) ||
      String(interaction).toLowerCase().includes(q) ||
      String(pathway).toLowerCase().includes(q)
    );

    if (matchFound) {
      results.push({
        cluster,
        relation,
        source,
        target,
        interaction,
        pathway,
        reason: buildReason(q, row, matchedNodeIDs)
      });
    }
  }

  renderResults(results);
}

function buildReason(q, row, matchedSet) {
  const hits = [];
  if (matchedSet.has(row.Source)) hits.push(`Matched Source Node: ${row.Source}`);
  if (matchedSet.has(row.Target)) hits.push(`Matched Target Node: ${row.Target}`);
  if (String(row.Relation).toLowerCase().includes(q)) hits.push(`Matched Relation ID`);
  if (String(row.Interaction).toLowerCase().includes(q)) hits.push(`Matched Interaction`);
  if (String(row.Pathway).toLowerCase().includes(q)) hits.push(`Matched Pathway`);
  return hits.join("; ");
}

function renderResults(rows) {
  if (rows.length === 0) {
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

  rows.forEach(row => {
    const tr = table.insertRow();
    [row.cluster, row.relation, row.source, row.target, row.interaction, row.pathway].forEach(val => {
      const td = tr.insertCell();
      td.innerHTML = `<a href='#' onclick='showDetails(${JSON.stringify(JSON.stringify(row))})'>${val || "-"}</a>`;
    });

    const reasonRow = table.insertRow();
    const reasonCell = reasonRow.insertCell();
    reasonCell.colSpan = 6;
    reasonCell.innerHTML = `<div class='match-reason'>🔍 ${row.reason}</div>`;
  });

  resultsDiv.appendChild(table);
}

function showDetails(rawStr) {
  const row = JSON.parse(rawStr);
  const sourceMeta = nodeMetadata[row.source] || {};
  const targetMeta = nodeMetadata[row.target] || {};
  const pathwayMeta = pathwayMetadata[row.pathway] || {};
  const interactionID = extractInteractionID(row.interaction);
  const interactionMeta = interactionID ? (interactionMetadata[interactionID] || {}) : {};

  popupDetails.innerHTML = `
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
  popup.classList.remove("hidden");
}

function extractInteractionID(raw) {
  const match = String(raw).match(/R-[A-Z]+-[0-9]+/g);
  return match ? match[0] : null;
}

function closePopup() {
  popup.classList.add("hidden");
}

// Load everything at start
loadAllData();
