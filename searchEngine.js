// 📁 searchEngine.js

function searchNetwork(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

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

  // Match in network rows
  const results = [];
  for (const row of networkData) {
    const source = row.Source;
    const target = row.Target;
    const relation = row.Relation;
    const interaction = row.Interaction || "";
    const pathway = row.Pathway || "";
    const cluster = row["Cluster ID"] || relationToClusterMap[relation] || "-";

    const matchFound =
      matchedNodeIDs.has(source) ||
      matchedNodeIDs.has(target) ||
      String(relation).toLowerCase().includes(q) ||
      String(source).toLowerCase().includes(q) ||
      String(target).toLowerCase().includes(q) ||
      String(interaction).toLowerCase().includes(q) ||
      String(pathway).toLowerCase().includes(q);

    if (matchFound) {
      results.push({
        cluster,
        relation,
        source,
        target,
        interaction,
        pathway,
        reason: buildMatchReason(q, row, matchedNodeIDs)
      });
    }
  }

  return results;
}

function buildMatchReason(q, row, matchedSet) {
  const hits = [];
  if (matchedSet.has(row.Source)) hits.push(`Matched Source Node: ${row.Source}`);
  if (matchedSet.has(row.Target)) hits.push(`Matched Target Node: ${row.Target}`);
  if (String(row.Relation).toLowerCase().includes(q)) hits.push(`Matched Relation ID`);
  if (String(row.Interaction).toLowerCase().includes(q)) hits.push(`Matched Interaction`);
  if (String(row.Pathway).toLowerCase().includes(q)) hits.push(`Matched Pathway`);
  return hits.join("; ");
}
