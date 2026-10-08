import { DBSCANCluster, Issue, Severity } from '../types/infrastructure';
import { GisEngine } from './gisEngine';

export interface ClusteringOptions {
  epsilonMeters?: number; // default 400m
  minPoints?: number;     // default 3
}

export class ClusteringEngine {
  /**
   * Run DBSCAN spatial clustering over an array of issues
   */
  static clusterIssues(
    issues: Issue[],
    options: ClusteringOptions = {}
  ): { clusters: DBSCANCluster[]; updatedIssues: Issue[] } {
    const eps = options.epsilonMeters ?? 400;
    const minPts = options.minPoints ?? 3;

    const visited = new Set<string>();
    const clustered = new Set<string>();
    const clusters: DBSCANCluster[] = [];

    // Helper: find epsilon neighbors for an issue
    const getNeighbors = (target: Issue): Issue[] => {
      return issues.filter(
        (other) =>
          GisEngine.calculateDistanceMeters(
            target.location.latitude,
            target.location.longitude,
            other.location.latitude,
            other.location.longitude
          ) <= eps
      );
    };

    let clusterCounter = 1;

    for (const issue of issues) {
      if (visited.has(issue.id)) continue;
      visited.add(issue.id);

      const neighbors = getNeighbors(issue);

      if (neighbors.length >= minPts) {
        // Expand Cluster
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

        // Calculate centroid
        const avgLat =
          clusterMembers.reduce((acc, m) => acc + m.location.latitude, 0) /
          clusterMembers.length;
        const avgLon =
          clusterMembers.reduce((acc, m) => acc + m.location.longitude, 0) /
          clusterMembers.length;

        // Calculate max radius in metres
        let maxRadius = eps;
        for (const m of clusterMembers) {
          const dist = GisEngine.calculateDistanceMeters(
            avgLat,
            avgLon,
            m.location.latitude,
            m.location.longitude
          );
          if (dist > maxRadius) maxRadius = dist;
        }

        // Aggregate severity (highest severity score in the cluster)
        const maxSeverityScore = Math.max(...clusterMembers.map((m) => m.severityScore));
        let dominantSeverity: Severity = 'moderate';
        if (maxSeverityScore > 80) dominantSeverity = 'critical';
        else if (maxSeverityScore > 60) dominantSeverity = 'high';
        else if (maxSeverityScore <= 30) dominantSeverity = 'healthy';

        // Dominant category
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

        clusters.push(clusterObj);
      }
    }

    // Map cluster data back to issues
    const updatedIssues = issues.map((issue) => {
      const parentCluster = clusters.find((c) => c.issueIds.includes(issue.id));
      if (parentCluster) {
        return {
          ...issue,
          clusterId: parentCluster.clusterId,
          clusterRadiusMeters: parentCluster.radiusMeters,
          clusterCount: Math.max(issue.clusterCount ?? 1, parentCluster.reportCount),
        };
      }
      return issue;
    });

    return { clusters, updatedIssues };
  }
}
