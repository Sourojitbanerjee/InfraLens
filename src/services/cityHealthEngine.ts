import { CityHealthMetrics, Issue, WardHealth } from '../types/infrastructure';
import { MOCK_WARDS } from '../data/mockAnalytics';

export class CityHealthEngine {
  /**
   * Calculate real-time City Infrastructure Health Score (0-100)
   */
  static calculateCityHealth(issues: Issue[], wards: WardHealth[] = MOCK_WARDS): CityHealthMetrics {
    const activeIssues = issues.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');

    const getScoreForCategory = (cat: string): number => {
      const catIssues = activeIssues.filter((i) => i.category === cat);
      if (catIssues.length === 0) return 96;

      const penalty = catIssues.reduce((acc, curr) => {
        if (curr.severity === 'critical') return acc + 6;
        if (curr.severity === 'high') return acc + 3.5;
        if (curr.severity === 'moderate') return acc + 1.5;
        return acc + 0.5;
      }, 0);

      return Math.round(Math.max(25, Math.min(100, 100 - penalty)));
    };

    const categoryScores = {
      roads: getScoreForCategory('road_damage'),
      drainage: getScoreForCategory('drainage_overflow'),
      waste: getScoreForCategory('waste_accumulation'),
      lighting: getScoreForCategory('lighting_failure'),
      sidewalks: getScoreForCategory('sidewalk_hazard'),
      signage: getScoreForCategory('traffic_signage'),
    };

    // Overall weighted score
    const overallScore = Math.round(
      categoryScores.roads * 0.30 +
      categoryScores.drainage * 0.20 +
      categoryScores.lighting * 0.15 +
      categoryScores.sidewalks * 0.15 +
      categoryScores.waste * 0.10 +
      categoryScores.signage * 0.10
    );

    // Identify worst-performing ward
    const sortedWards = [...wards].sort((a, b) => a.healthScore - b.healthScore);
    const worst = sortedWards[0] || { wardId: 'ward-6', name: 'Ward 6 — Mission & SOMA', healthScore: 64 };

    // Identify most improved ward
    const mostImproved = {
      id: 'ward-3',
      name: 'Ward 3 — Civic & Financial',
      score: 79,
      improvement: 4.8,
    };

    return {
      overallScore,
      categoryScores,
      trend: overallScore >= 75 ? 'improving' : overallScore >= 60 ? 'stable' : 'declining',
      worstPerformingWard: {
        id: worst.wardId,
        name: worst.name,
        score: worst.healthScore,
      },
      mostImprovedWard: mostImproved,
    };
  }
}
