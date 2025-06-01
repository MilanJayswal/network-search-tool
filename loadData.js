// 📁 loadData.js

const fileUrls = {
  networkMain: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/T2DM%20KEGG%20REACTOME%20INDEPENDENT%20RELATION_Merged_By_RelationID_Formatted.xlsx",
  networkClustered: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Merged_Cluster_Relations.xlsx",
  keggNodes: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/T2DM_KEGG_Recursive_Nodes.xlsx",
  reactomeNodes: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/T2DM%20Reactome%20Recursive%20Nodes.xlsx",
  keggPathways: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/KEGG_Pathway_Metadata.xlsx",
  reactomePathways: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Reactome_Pathway_IDs_Names_Genes.xlsx",
  interactions: "https://raw.githubusercontent.com/MilanJayswal/network-search-tool/main/data/Reactome_Interaction_IDs_Names.xlsx"
};

// Global storage
let networkData = [];
let nodeMetadata = {};
let pathwayMetadata = {};
let interactionMetadata = {};
let relationToClusterMap = {};

async function fetchExcel(url, sheetName = null) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const sheets = sheetName ? [sheetName] : wb.SheetNames;
  let all = [];
  sheets.forEach(name => {
    const json = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
    all = all.concat(json);
  });
  return all;
}

async function loadAllData() {
  const [
    mainNet,
    clusteredNet,
    kegg,
    reactome1,
    reactome2,
    reactome3,
    keggPath,
    reactomePath,
    interactions
  ] = await Promise.all([
    fetchExcel(fileUrls.networkMain),
    fetchExcel(fileUrls.networkClustered),
    fetchExcel(fileUrls.keggNodes),
    fetchExcel(fileUrls.reactomeNodes, "Chebi Node ID"),
    fetchExcel(fileUrls.reactomeNodes, "UniProt NodeID Reactome"),
    fetchExcel(fileUrls.reactomeNodes, "Reactome NodeID Merged"),
    fetchExcel(fileUrls.keggPathways),
    fetchExcel(fileUrls.reactomePathways),
    fetchExcel(fileUrls.interactions)
  ]);

  // Merge both network files
  const clusterMap = {};
  clusteredNet.forEach(row => {
    clusterMap[row.Relation] = row["Cluster ID"];
  });

  networkData = mainNet.map(row => ({
    ...row,
    "Cluster ID": clusterMap[row.Relation] || "-"
  }));

  // Index node metadata
  [kegg, reactome1, reactome2, reactome3].flat().forEach(row => {
    const key = row["Node ID"] || row["Node id for mapping"];
    if (key) {
      if (!nodeMetadata[key]) nodeMetadata[key] = {};
      Object.assign(nodeMetadata[key], row);
    }
  });

  // Index pathway metadata
  keggPath.forEach(r => {
    pathwayMetadata[r["KEGG_ID"]] = r;
  });
  reactomePath.forEach(r => {
    pathwayMetadata[r["Unique_Reactome_Pathway_ID"]] = r;
  });

  // Index interaction metadata
  interactions.forEach(r => {
    interactionMetadata[r["Unique_Reactome_Interaction_ID"]] = r;
  });

  // Index for cluster fallback
  relationToClusterMap = clusterMap;

  console.log("✅ All data loaded");
}
