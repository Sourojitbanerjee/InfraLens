import { DBSCANCluster, Issue, Severity } from '../types/infrastructure';
import { GisEngine } from './gisEngine';

export interface ClusteringOptions {
  epsilonMeters?: number; // default 400m
  minPoints?: number;     // default 3
}

export class ClusteringEngine {
  /**
   * Run DBSCAN spatial clustering over an array of issues.
   * Issues that already carry a pre-assigned clusterId are preserved
   * and synthesized into DBSCANCluster records even when geographic
   * DBSCAN wouldn't reach minPoints — this ensures mock data with
   * known cluster IDs (CL-001 through CL-005) always produces
   * matching cluster objects visible in the GIS map and demo tour.
   */
  static clusterIssues(
    issues: Issue[],
    options: ClusteringOptions = {}
  ): { clusters: DBSCANCluster[]; updatedIssues: Issue[] } {
    const eps = options.epsilonMeters ?? 400;
    const minPts = options.minPoints ?? 3;

    // ── Phase 1: honour pre-assigned cluster IDs ────────────────────────
    const preGrouped = new Map<string, Issue[]>();
    const unassigned: Issue[] = [];
    for (const issue of issues) {
      if (issue.clusterId) {
        const group = preGrouped.get(issue.clusterId) ?? [];
        group.push(issue);
        preGrouped.set(issue.clusterId, group);
      } else {
        unassigned.push(issue);
      }
    }

    const preClusters: DBSCANCluster[] = [];
    const preClusterMap = new Map<string, string>(); // issueId → clusterId

    for (const [clusterId, members] of preGrouped) {
      const avgLat =
        members.reduce((acc, m) => acc + m.location.latitude, 0) / members.length;
      const avgLon =
        members.reduce((acc, m) => acc + m.location.longitude, 0) / members.length;

      let maxRadius = 0;
      for (const m of members) {
        const dist = GisEngine.calculateDistanceMeters(
          avgLat, avgLon,
          m.location.latitude, m.location.longitude
        );
        if (dist > maxRadius) maxRadius = dist;
      }
      // Respect original clusterRadiusMeters when specified
      const representativeRadius = Math.max(
        eps,
        maxRadius,
        members[0].clusterRadiusMeters ?? 0
      );

      const maxSeverityScore = Math.max(...members.map((m) => m.severityScore));
      let dominantSeverity: Severity = 'moderate';
      if (maxSeverityScore > 80) dominantSeverity = 'critical';
      else if (maxSeverityScore > 60) dominantSeverity = 'high';
      else if (maxSeverityScore <= 30) dominantSeverity = 'healthy';

      const catCounts: Record<string, number> = {};
      for (const m of members) {
        catCounts[m.category] = (catCounts[m.category] || 0) + 1;
      }
      let dominantCat = members[0].category;
      let highestCatCount = 0;
      for (const [cat, count] of Object.entries(catCounts)) {
        if (count > highestCatCount) {
          highestCatCount = count;
          dominantCat = cat as any;
        }
      }

      const clusterObj: DBSCANCluster = {
        clusterId,
        name: `${members[0].location.address} Cluster`,
        issueType: dominantCat,
        reportCount: members.reduce((acc, m) => acc + (m.clusterCount || 1), 0),
        radiusMeters: Math.round(representativeRadius),
        center: {
          latitude: Number(avgLat.toFixed(5)),
          longitude: Number(avgLon.toFixed(5)),
        },
        severityScore: maxSeverityScore,
        dominantSeverity,
        status: members.some((m) => m.status === 'in_progress')
          ? 'in_progress'
          : members.some((m) => m.status === 'resolved')
          ? 'resolved'
          : 'detected',
        issueIds: members.map((m) => m.id),
      };

      preClusters.push(clusterObj);
      members.forEach((m) => preClusterMap.set(m.id, clusterId));
    }

    // ── Phase 2: DBSCAN over unassigned issues ───────────────────────────
    const visited = new Set<string>();
    const clustered = new Set<string>();
    const dynamicClusters: DBSCANCluster[] = [];

    const getNeighbors = (target: Issue): Issue[] =>
      unassigned.filter(
        (other) =>
          GisEngine.calculateDistanceMeters(
            target.location.latitude,
            target.location.longitude,
            other.location.latitude,
            other.location.longitude
          ) <= eps
      );

    // Start counter beyond pre-cluster range so IDs don't collide
    let clusterCounter = preGrouped.size + 1;

    for (const issue of unassigned) {
      if (visited.has(issue.id)) continue;
      visited.add(issue.id);

      const neighbors = getNeighbors(issue);

      if (neighbors.length >= minPts) {
        const clusterId = `CL-${String(clusterCounter).padStart(3, '0')}`;
        clusterCounter++;

        const clusterMembers: Issue[] = [issue];
        clustered.add(issue.id);

        const queue = [...neighbors.filter((n) => n.id !== issue.id)];

        while (queue.length > 0) {
          const current = queue.shift()!;
          if (!visited.has(current.id)) {
            visited.add(current.id);
            const currentNeighbors = getNeighbors(current);
            if (currentNeighbors.length >= minPts) {
              for (const cn of currentNeighbors) {
                if (!queue.some((q) => q.id === cn.id) && !clustered.has(cn.id)) {
                  queue.push(cn);
                }
              }
            }
          }

          if (!clustered.has(current.id)) {
            clustered.add(current.id);
            clusterMembers.push(current);
          }
        }

        const avgLat =
          clusterMembers.reduce((acc, m) => acc + m.location.latitude, 0) /
          clusterMembers.length;
        const avgLon =
          clusterMembers.reduce((acc, m) => acc + m.location.longitude, 0) /
          clusterMembers.length;

        let maxRadius = eps;
        for (const m of clusterMembers) {
          const dist = GisEngine.calculateDistanceMeters(
            avgLat, avgLon,
            m.location.latitude, m.location.longitude
          );
          if (dist > maxRadius) maxRadius = dist;
        }

        const maxSeverityScore = Math.max(...clusterMembers.map((m) => m.severityScore));
        let dominantSeverity: Severity = 'moderate';
        if (maxSeverityScore > 80) dominantSeverity = 'critical';
        else if (maxSeverityScore > 60) dominantSeverity = 'high';
        else if (maxSeverityScore <= 30) dominantSeverity = 'healthy';

        const catCounts: Record<string, number> = {};
        for (const m of clusterMembers) {
          catCounts[m.category] = (catCounts[m.category] || 0) + 1;
        }
        let dominantCat = clusterMembers[0].category;
        let highestCatCount = 0;
        for (const [cat, count] of Object.entries(catCounts)) {
          if (count > highestCatCount) {
            highestCatCount = count;
            dominantCat = cat as any;
          }
        }

        const clusterObj: DBSCANCluster = {
          clusterId,
          name: `${clusterMembers[0].location.address} Cluster`,
          issueType: dominantCat,
          reportCount: clusterMembers.reduce((acc, m) => acc + (m.clusterCount || 1), 0),
          radiusMeters: Math.round(maxRadius),
          center: {
            latitude: Number(avgLat.toFixed(5)),
            longitude: Number(avgLon.toFixed(5)),
          },
          severityScore: maxSeverityScore,
          dominantSeverity,
          status: clusterMembers.some((m) => m.status === 'in_progress')
            ? 'in_progress'
            : clusterMembers.some((m) => m.status === 'resolved')
            ? 'resolved'
            : 'detected',
          issueIds: clusterMembers.map((m) => m.id),
        };

        dynamicClusters.push(clusterObj);
        clusterMembers.forEach((m) => preClusterMap.set(m.id, clusterId));
      }
    }

    // ── Phase 3: merge results and update issues ──────────────────────────
    const allClusters = [...preClusters, ...dynamicClusters];

    const updatedIssues = issues.map((issue) => {
      const resolvedClusterId = preClusterMap.get(issue.id);
      if (resolvedClusterId) {
        const parentCluster = allClusters.find((c) => c.clusterId === resolvedClusterId);
        return {
          ...issue,
          clusterId: resolvedClusterId,
          clusterRadiusMeters: parentCluster?.radiusMeters ?? issue.clusterRadiusMeters,
          clusterCount: Math.max(issue.clusterCount ?? 1, parentCluster?.reportCount ?? 1),
        };
      }
      return issue;
    });

    return { clusters: allClusters, updatedIssues };
  }
}
