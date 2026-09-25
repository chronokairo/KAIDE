import { DataSource, Repository } from 'typeorm';
import { SecurityAnalysis, Vulnerability, Recommendation, VulnerabilitySeverity } from '../entities/SecurityAnalysis';

export interface CreateSecurityAnalysisInput {
  workspaceId: string;
  targetId: string;
  targetName: string;
  type: 'code' | 'system' | 'api' | 'dependency' | 'infrastructure';
  vulnerabilities: Vulnerability[];
  recommendations: Recommendation[];
  scanMethod?: string;
  durationMs?: number;
  scannerVersion?: string;
}

export class SecurityAnalysisService {
  private repo: Repository<SecurityAnalysis>;

  constructor(private db: DataSource) {
    this.repo = db.getRepository(SecurityAnalysis);
  }

  async create(input: CreateSecurityAnalysisInput): Promise<SecurityAnalysis> {
    const severity = this.calculateSeverity(input.vulnerabilities);
    
    const analysis = this.repo.create({
      workspaceId: input.workspaceId,
      targetId: input.targetId,
      targetName: input.targetName,
      type: input.type,
      vulnerabilities: input.vulnerabilities,
      recommendations: input.recommendations,
      severity,
      vulnerabilityCount: input.vulnerabilities.length,
      scanMethod: input.scanMethod || null,
      durationMs: input.durationMs || null,
      scannerVersion: input.scannerVersion || null,
    });

    return this.repo.save(analysis);
  }

  async getById(id: string): Promise<SecurityAnalysis | null> {
    return this.repo.findOne({ where: { id } });
  }

  async listByWorkspace(
    workspaceId: string,
    severity?: VulnerabilitySeverity
  ): Promise<SecurityAnalysis[]> {
    return this.repo.find({
      where: severity
        ? { workspaceId, severity }
        : { workspaceId },
      order: { analyzedAt: 'DESC' },
    });
  }

  async listByTarget(targetId: string): Promise<SecurityAnalysis[]> {
    return this.repo.find({
      where: { targetId },
      order: { analyzedAt: 'DESC' },
    });
  }

  async getLatestByTarget(targetId: string): Promise<SecurityAnalysis | null> {
    return this.repo.findOne({
      where: { targetId },
      order: { analyzedAt: 'DESC' },
    });
  }

  async getStats(workspaceId: string): Promise<{
    totalAnalyses: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    averageVulnerabilitiesPerAnalysis: number;
  }> {
    const analyses = await this.listByWorkspace(workspaceId);

    const stats = {
      totalAnalyses: analyses.length,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0,
      averageVulnerabilitiesPerAnalysis: 0,
    };

    analyses.forEach((analysis) => {
      analysis.vulnerabilities.forEach((vuln) => {
        if (vuln.severity === 'critical') stats.criticalVulnerabilities++;
        else if (vuln.severity === 'high') stats.highVulnerabilities++;
        else if (vuln.severity === 'medium') stats.mediumVulnerabilities++;
        else if (vuln.severity === 'low') stats.lowVulnerabilities++;
      });
    });

    if (analyses.length > 0) {
      stats.averageVulnerabilitiesPerAnalysis = stats.totalAnalyses / analyses.length;
    }

    return stats;
  }

  async getRecommendations(workspaceId: string, limit: number = 10): Promise<Recommendation[]> {
    const analyses = await this.listByWorkspace(workspaceId, 'critical');
    const recommendations: Recommendation[] = [];

    analyses.forEach((analysis) => {
      recommendations.push(...analysis.recommendations);
    });

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, limit);
  }

  private calculateSeverity(vulnerabilities: Vulnerability[]): VulnerabilitySeverity {
    if (vulnerabilities.some((v) => v.severity === 'critical')) return 'critical';
    if (vulnerabilities.some((v) => v.severity === 'high')) return 'high';
    if (vulnerabilities.some((v) => v.severity === 'medium')) return 'medium';
    return 'low';
  }
}
