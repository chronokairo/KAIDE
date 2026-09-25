import { Logger } from '../utils/Logger';
import { AIProvider } from '../providers/AIProvider';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced Security Analysis Service (Phase 7)
 * 
 * Provides comprehensive security analysis:
 * - Zero-day vulnerability discovery
 * - Attack simulation and vectors
 * - CWE classification
 * - CVSS scoring
 * - Threat modeling
 * - Remediation recommendations
 */

export interface Vulnerability {
  id: string;
  type: 'cwe' | 'cve' | 'zero-day' | 'design-flaw';
  cweId?: string;
  cweName?: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvssScore?: number; // 0-10
  confidentiality?: number; // 0-10
  integrity?: number; // 0-10
  availability?: number; // 0-10
  attackVector: 'network' | 'adjacent' | 'local' | 'physical';
  attackComplexity: 'low' | 'high';
  privilegesRequired: 'none' | 'low' | 'high';
  userInteraction: boolean;
  discoveryDate: number;
  affectedComponent?: string;
  codeSnippet?: string;
  lineNumbers?: number[];
}

export interface AttackVector {
  id: string;
  name: string;
  description: string;
  attackType: 'injection' | 'xss' | 'csrf' | 'auth-bypass' | 'escalation' | 'dos' | 'data-exfil';
  likelihood: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  prerequisites: string[];
  detectionMethod: string;
  mitigation: string;
}

export interface SecurityAnalysisResult {
  analysisId: string;
  codeHash: string;
  scanDate: number;
  vulnerabilities: Vulnerability[];
  attackVectors: AttackVector[];
  threatScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  recommendations: SecurityRecommendation[];
  confidence: number; // 0-100
}

export interface SecurityRecommendation {
  type: 'fix' | 'detect' | 'monitor' | 'design-change' | 'policy';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  steps: string[];
  estimatedEffort: 'minimal' | 'low' | 'medium' | 'high';
  relatedVulnerabilities: string[];
}

export interface ThreatModel {
  component: string;
  threats: {
    threat: string;
    likelihood: number;
    impact: number;
    mitigation: string;
  }[];
}

const logger = Logger.getInstance();

export class AdvancedSecurityAnalysisService {
  private analysisCache: Map<string, SecurityAnalysisResult> = new Map();
  private cweDatabase: Map<string, any> = new Map();
  private vulnerabilityPatterns: Map<string, RegExp[]> = new Map();

  constructor(private aiProvider: AIProvider) {
    this.initializeCWEDatabase();
    this.initializeVulnerabilityPatterns();
  }

  /**
   * Perform comprehensive security analysis
   */
  async analyzeCode(
    code: string,
    language: string,
    context?: {
      filename?: string;
      framework?: string;
      dependencies?: string[];
    }
  ): Promise<SecurityAnalysisResult> {
    const analysisId = uuidv4();
    const codeHash = this.hashCode(code);

    logger.info(`[SecurityAnalysis] Starting comprehensive security analysis`, {
      analysisId,
      language,
      codeLength: code.length,
    });

    try {
      // Phase 1: Pattern-based detection
      const patternVulnerabilities = this.detectPatternVulnerabilities(code, language);

      // Phase 2: AI-based analysis with extended reasoning
      const aiVulnerabilities = await this.performAIAnalysis(code, language, context);

      // Phase 3: Attack vector modeling
      const attackVectors = await this.identifyAttackVectors(
        code,
        [...patternVulnerabilities, ...aiVulnerabilities],
        language
      );

      // Phase 4: Threat modeling
      const threatModelResults = await this.performThreatModeling(
        code,
        attackVectors,
        context
      );

      // Phase 5: Generate recommendations
      const recommendations = this.generateRecommendations(
        patternVulnerabilities,
        aiVulnerabilities,
        attackVectors,
        threatModelResults
      );

      // Calculate metrics
      const vulnerabilities = [...patternVulnerabilities, ...aiVulnerabilities];
      const threatScore = this.calculateThreatScore(vulnerabilities);
      const confidence = Math.min(
        95,
        50 + vulnerabilities.length * 5 + (patternVulnerabilities.length * 10)
      );

      const result: SecurityAnalysisResult = {
        analysisId,
        codeHash,
        scanDate: Date.now(),
        vulnerabilities,
        attackVectors,
        threatScore,
        riskLevel: this.calculateRiskLevel(threatScore),
        summary: this.generateSummary(vulnerabilities, attackVectors),
        recommendations,
        confidence,
      };

      this.analysisCache.set(codeHash, result);

      logger.info(`[SecurityAnalysis] Analysis completed`, {
        analysisId,
        vulnerabilityCount: vulnerabilities.length,
        threatScore,
        riskLevel: result.riskLevel,
      });

      return result;
    } catch (error) {
      logger.error(`[SecurityAnalysis] Analysis failed`, {
        analysisId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Detect vulnerabilities using pattern matching
   */
  private detectPatternVulnerabilities(code: string, language: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const patterns = this.vulnerabilityPatterns.get(language) || [];

    logger.debug(`[SecurityAnalysis] Pattern detection starting`, {
      language,
      patternCount: patterns.length,
    });

    // SQL Injection patterns
    const sqlPatterns = [
      /query\s*\(\s*[`'"]\s*SELECT.*FROM.*WHERE.*\$\{/gi,
      /query\s*\(\s*['""].*\+\s*.*variable.*\+\s*['"]/gi,
      /execute\s*\(\s*['""].*\$\{/gi,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          id: uuidv4(),
          type: 'cwe',
          cweId: 'CWE-89',
          cweName: 'SQL Injection',
          title: 'SQL Injection Vulnerability Detected',
          description: 'Unsanitized user input is being used in SQL queries',
          severity: 'critical',
          cvssScore: 9.8,
          confidentiality: 10,
          integrity: 10,
          availability: 10,
          attackVector: 'network',
          attackComplexity: 'low',
          privilegesRequired: 'none',
          userInteraction: false,
          discoveryDate: Date.now(),
          codeSnippet: this.extractMatchContext(code, pattern),
        });
      }
    }

    // XSS patterns
    const xssPatterns = [
      /innerHTML\s*=\s*user.*input/gi,
      /document\.write\s*\(\s*user.*input/gi,
      /eval\s*\(\s*.*variable/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          id: uuidv4(),
          type: 'cwe',
          cweId: 'CWE-79',
          cweName: 'Cross-site Scripting (XSS)',
          title: 'XSS Vulnerability Detected',
          description: 'User input is being rendered without sanitization',
          severity: 'high',
          cvssScore: 8.2,
          confidentiality: 8,
          integrity: 10,
          availability: 0,
          attackVector: 'network',
          attackComplexity: 'low',
          privilegesRequired: 'none',
          userInteraction: true,
          discoveryDate: Date.now(),
          codeSnippet: this.extractMatchContext(code, pattern),
        });
      }
    }

    // Hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['""]([^'"]*)['"]/gi,
      /api_key\s*[:=]\s*['""]([^'"]*)['"]/gi,
      /secret\s*[:=]\s*['""]([^'"]*)['"]/gi,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(code)) {
        vulnerabilities.push({
          id: uuidv4(),
          type: 'cwe',
          cweId: 'CWE-798',
          cweName: 'Use of Hard-Coded Credentials',
          title: 'Hardcoded Secrets Detected',
          description: 'Sensitive credentials are hardcoded in the source code',
          severity: 'critical',
          cvssScore: 9.8,
          confidentiality: 10,
          integrity: 10,
          availability: 0,
          attackVector: 'network',
          attackComplexity: 'low',
          privilegesRequired: 'none',
          userInteraction: false,
          discoveryDate: Date.now(),
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Perform AI-based vulnerability analysis
   */
  private async performAIAnalysis(
    code: string,
    language: string,
    context?: any
  ): Promise<Vulnerability[]> {
    logger.debug(`[SecurityAnalysis] AI-based analysis starting`);

    const analysisPrompt = `Analyze the following ${language} code for security vulnerabilities.
    
Code:
\`\`\`${language}
${code}
\`\`\`

${context?.framework ? `Framework: ${context.framework}` : ''}
${context?.dependencies ? `Dependencies: ${context.dependencies.join(', ')}` : ''}

Identify:
1. All potential vulnerabilities with CWE classification
2. Attack vectors that could exploit these vulnerabilities
3. CVSS scores
4. Remediation steps

Format as JSON with vulnerability objects containing: type, cweId, cweName, title, description, severity, cvssScore, attackVector, code snippet.`;

    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: `You are an expert security researcher specializing in identifying zero-day vulnerabilities and security flaws. Perform deep analysis to find non-obvious security issues.`,
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ], {
      reasoning: true,
      budgetTokens: 10000,
    });

    try {
      const vulnerabilities = JSON.parse(response.message);
      return Array.isArray(vulnerabilities) ? vulnerabilities : [];
    } catch {
      logger.warn(`[SecurityAnalysis] Failed to parse AI analysis results`);
      return [];
    }
  }

  /**
   * Identify attack vectors
   */
  private async identifyAttackVectors(
    code: string,
    vulnerabilities: Vulnerability[],
    language: string
  ): Promise<AttackVector[]> {
    const vectors: AttackVector[] = [];

    for (const vuln of vulnerabilities) {
      const vector: AttackVector = {
        id: uuidv4(),
        name: `${vuln.cweName} Attack`,
        description: `Exploiting ${vuln.title}`,
        attackType: this.mapCWEToAttackType(vuln.cweId),
        likelihood: this.calculateLikelihood(vuln),
        impact: vuln.severity as any,
        steps: this.generateAttackSteps(vuln),
        prerequisites: this.generatePrerequisites(vuln),
        detectionMethod: this.generateDetectionMethod(vuln),
        mitigation: this.generateMitigation(vuln),
      };
      vectors.push(vector);
    }

    return vectors;
  }

  /**
   * Perform threat modeling
   */
  private async performThreatModeling(
    code: string,
    attackVectors: AttackVector[],
    context?: any
  ): Promise<ThreatModel[]> {
    const threatModels: ThreatModel[] = [];

    // Extract components from code
    const components = this.extractComponents(code, context?.framework);

    for (const component of components) {
      const threats = attackVectors
        .filter(v => this.vectorAppliesToComponent(v, component))
        .map(v => ({
          threat: v.name,
          likelihood: this.likelihoodToScore(v.likelihood),
          impact: this.impactToScore(v.impact),
          mitigation: v.mitigation,
        }));

      if (threats.length > 0) {
        threatModels.push({ component, threats });
      }
    }

    return threatModels;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    patternVulns: Vulnerability[],
    aiVulns: Vulnerability[],
    attackVectors: AttackVector[],
    threatModels: ThreatModel[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];
    const allVulns = [...patternVulns, ...aiVulns];

    // Critical fixes
    for (const vuln of allVulns.filter(v => v.severity === 'critical')) {
      recommendations.push({
        type: 'fix',
        priority: 'critical',
        title: `Fix ${vuln.cweName}`,
        description: `Address critical vulnerability: ${vuln.title}`,
        steps: this.generateFixSteps(vuln),
        estimatedEffort: 'medium',
        relatedVulnerabilities: [vuln.id],
      });
    }

    // Detection and monitoring
    for (const vector of attackVectors) {
      recommendations.push({
        type: 'detect',
        priority: vector.likelihood as any,
        title: `Monitor for ${vector.attackType} attacks`,
        description: `Implement detection for ${vector.name}`,
        steps: [vector.detectionMethod],
        estimatedEffort: 'low',
        relatedVulnerabilities: [],
      });
    }

    // Design changes
    for (const threatModel of threatModels) {
      if (threatModel.threats.length > 3) {
        recommendations.push({
          type: 'design-change',
          priority: 'high',
          title: `Redesign ${threatModel.component}`,
          description: `Multiple threats identified in ${threatModel.component}`,
          steps: [
            `Review architecture of ${threatModel.component}`,
            'Implement defense in depth',
            'Add additional isolation layers',
          ],
          estimatedEffort: 'high',
          relatedVulnerabilities: [],
        });
      }
    }

    return recommendations;
  }

  /**
   * Helper methods
   */

  private hashCode(code: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private extractMatchContext(code: string, pattern: RegExp): string {
    const match = code.match(pattern);
    if (match) {
      const startIdx = Math.max(0, match.index! - 50);
      const endIdx = Math.min(code.length, match.index! + match[0].length + 50);
      return code.substring(startIdx, endIdx);
    }
    return '';
  }

  private calculateThreatScore(vulnerabilities: Vulnerability[]): number {
    let score = 0;
    for (const vuln of vulnerabilities) {
      const severityScore = {
        critical: 25,
        high: 15,
        medium: 10,
        low: 5,
        info: 1,
      };
      score += severityScore[vuln.severity] || 0;
    }
    return Math.min(100, score);
  }

  private calculateRiskLevel(threatScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (threatScore >= 75) return 'critical';
    if (threatScore >= 50) return 'high';
    if (threatScore >= 25) return 'medium';
    return 'low';
  }

  private generateSummary(vulnerabilities: Vulnerability[], attackVectors: AttackVector[]): string {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;

    return `Found ${vulnerabilities.length} vulnerabilities (${criticalCount} critical, ${highCount} high) with ${attackVectors.length} potential attack vectors.`;
  }

  private mapCWEToAttackType(cweId?: string): AttackVector['attackType'] {
    const mapping: Record<string, AttackVector['attackType']> = {
      'CWE-89': 'injection',
      'CWE-79': 'xss',
      'CWE-352': 'csrf',
      'CWE-287': 'auth-bypass',
      'CWE-269': 'escalation',
      'CWE-400': 'dos',
      'CWE-200': 'data-exfil',
    };
    return mapping[cweId || ''] || 'injection';
  }

  private calculateLikelihood(vuln: Vulnerability): 'low' | 'medium' | 'high' | 'critical' {
    if (vuln.attackComplexity === 'low' && !vuln.userInteraction) return 'critical';
    if (vuln.attackComplexity === 'low') return 'high';
    return 'medium';
  }

  private generateAttackSteps(vuln: Vulnerability): string[] {
    return [
      `Identify vulnerable input field: ${vuln.affectedComponent || 'user input'}`,
      `Craft malicious payload for ${vuln.cweName}`,
      `Submit payload to application`,
      `Observe application behavior or data exfiltration`,
    ];
  }

  private generatePrerequisites(vuln: Vulnerability): string[] {
    return [
      `Network access to application: ${vuln.attackVector === 'network' ? 'required' : 'not required'}`,
      `Valid user account: ${vuln.privilegesRequired === 'none' ? 'not required' : 'required'}`,
    ];
  }

  private generateDetectionMethod(vuln: Vulnerability): string {
    return `Monitor for ${vuln.cweName} patterns in logs and implement WAF rules`;
  }

  private generateMitigation(vuln: Vulnerability): string {
    return `Implement input validation, output encoding, and use parameterized queries for ${vuln.cweName}`;
  }

  private generateFixSteps(vuln: Vulnerability): string[] {
    return [
      'Identify all affected code locations',
      'Implement proper input validation',
      'Add output encoding/escaping',
      'Use security libraries/frameworks',
      'Test fixes thoroughly',
      'Deploy to production',
    ];
  }

  private extractComponents(code: string, framework?: string): string[] {
    const components: string[] = [];

    // Extract common components
    if (code.includes('router')) components.push('Router');
    if (code.includes('database') || code.includes('query')) components.push('Database');
    if (code.includes('auth') || code.includes('login')) components.push('Authentication');
    if (code.includes('api')) components.push('API Endpoint');

    return components.length > 0 ? components : ['Application'];
  }

  private vectorAppliesToComponent(vector: AttackVector, component: string): boolean {
    return Math.random() > 0.5; // Simplified logic
  }

  private likelihoodToScore(likelihood: string): number {
    return { low: 2, medium: 5, high: 8, critical: 10 }[likelihood] || 5;
  }

  private impactToScore(impact: string): number {
    return { low: 2, medium: 5, high: 8, critical: 10 }[impact] || 5;
  }

  /**
   * Initialize CWE database
   */
  private initializeCWEDatabase(): void {
    this.cweDatabase.set('CWE-89', {
      name: 'SQL Injection',
      description: 'Improper neutralization of special elements used in an SQL command',
    });
    this.cweDatabase.set('CWE-79', {
      name: 'Cross-site Scripting',
      description: 'Improper neutralization of input during web page generation',
    });
    // Add more CWEs as needed
  }

  /**
   * Initialize vulnerability patterns
   */
  private initializeVulnerabilityPatterns(): void {
    this.vulnerabilityPatterns.set('javascript', []);
    this.vulnerabilityPatterns.set('python', []);
    this.vulnerabilityPatterns.set('java', []);
    this.vulnerabilityPatterns.set('csharp', []);
  }
}

export default AdvancedSecurityAnalysisService;
