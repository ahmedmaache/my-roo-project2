/**
 * Secret Scan Script
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Performs regex-based secret scanning for common key patterns
 * and sensitive information in the codebase.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Configuration
const SCAN_DIRECTORIES = [
  '../portal/src',
  '../portal/scripts',
  '../portal/prisma',
  '../portal/next.config.mjs',
  '../portal/package.json',
  '../portal/.env.example'
];

const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'public'
];

const EXCLUDED_FILES = [
  'package-lock.json',
  'yarn.lock',
  '.DS_Store'
];

// Secret patterns to scan for
const SECRET_PATTERNS = [
  {
    name: 'API Key',
    pattern: /(api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9]{32,}["']?/gi,
    severity: 'high'
  },
  {
    name: 'Secret Key',
    pattern: /(secret[_-]?key|secretkey)\s*[:=]\s*["']?[a-zA-Z0-9]{32,}["']?/gi,
    severity: 'high'
  },
  {
    name: 'Password in Code',
    pattern: /(password|pwd)\s*[:=]\s*["']?[^"'\s]{4,}["']?/gi,
    severity: 'high'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9]{10,}\.[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'high'
  },
  {
    name: 'AWS Access Key',
    pattern: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Secret Key',
    pattern: /(?i)aws(.{0,20})?['\"][0-9a-zA-Z/+]{40}['\"]/g,
    severity: 'critical'
  },
  {
    name: 'Slack Token',
    pattern: /xox[abpr]-[0-9a-zA-Z-]+/g,
    severity: 'high'
  },
  {
    name: 'Slack Webhook',
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9+/]{43,48}/g,
    severity: 'medium'
  },
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: 'high'
  },
  {
    name: 'Stripe API Key',
    pattern: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}/g,
    severity: 'high'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'high'
  },
  {
    name: 'Private Key Header',
    pattern: /-----BEGIN (RSA|OPENSSH|PGP) PRIVATE KEY-----/g,
    severity: 'critical'
  },
  {
    name: 'Database URL with Password',
    pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/g,
    severity: 'high'
  },
  {
    name: 'Email Password',
    pattern: /EMAIL_SERVER_PASSWORD\s*=\s*["']?[^"'\s]{4,}["']?/gi,
    severity: 'high'
  },
  {
    name: 'NextAuth Secret',
    pattern: /NEXTAUTH_SECRET\s*=\s*["']?[a-zA-Z0-9]{32,}["']?/gi,
    severity: 'high'
  },
  {
    name: 'Hardcoded Credentials',
    pattern: /(username|user|login)\s*[:=]\s*["']?[^"'\s]{3,}["']?\s*[,}\n].*(password|pass)\s*[:=]\s*["']?[^"'\s]{4,}["']?/gis,
    severity: 'high'
  }
];

// Results storage
const findings = [];
let filesScanned = 0;

/**
 * Check if a file should be excluded from scanning
 */
function shouldExcludeFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Check excluded files
  if (EXCLUDED_FILES.includes(fileName)) {
    return true;
  }
  
  // Check excluded directories
  for (const excludedDir of EXCLUDED_DIRECTORIES) {
    if (filePath.includes(`/${excludedDir}/`) || filePath.includes(`\\${excludedDir}\\`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Scan a single file for secrets
 */
async function scanFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    return;
  }
  
  try {
    const content = await readFile(filePath, 'utf8');
    filesScanned++;
    
    SECRET_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          findings.push({
            file: filePath,
            pattern: pattern.name,
            severity: pattern.severity,
            match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            line: getLineNumber(content, match)
          });
        });
      }
    });
  } catch (error) {
    console.warn(`⚠️  Could not read file: ${filePath}`, error.message);
  }
}

/**
 * Get line number of a match in content
 */
function getLineNumber(content, match) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Recursively scan a directory
 */
async function scanDirectory(directory) {
  try {
    const items = await readdir(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          await scanDirectory(fullPath);
        }
      } else {
        await scanFile(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan directory: ${directory}`, error.message);
  }
}

/**
 * Main scanning function
 */
async function runScan() {
  console.log('🔍 Starting secret scan...\n');
  
  const startTime = Date.now();
  
  // Scan all configured directories
  for (const dir of SCAN_DIRECTORIES) {
    const fullPath = path.join(__dirname, dir);
    
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        await scanDirectory(fullPath);
      } else {
        await scanFile(fullPath);
      }
    } catch (error) {
      console.warn(`⚠️  Could not access: ${dir}`, error.message);
    }
  }
  
  const endTime = Date.now();
  const scanDuration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  generateReport(scanDuration);
}

/**
 * Generate and display the scan report
 */
function generateReport(scanDuration) {
  console.log('\n📊 Secret Scan Report');
  console.log('='.repeat(50));
  
  // Summary
  console.log(`\n📈 Summary:`);
  console.log(`  Files scanned: ${filesScanned}`);
  console.log(`  Findings: ${findings.length}`);
  console.log(`  Duration: ${scanDuration}s`);
  
  // Severity breakdown
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  findings.forEach(finding => {
    severityCounts[finding.severity]++;
  });
  
  console.log(`\n⚠️  Severity Breakdown:`);
  Object.entries(severityCounts).forEach(([severity, count]) => {
    if (count > 0) {
      console.log(`  ${severity.toUpperCase()}: ${count}`);
    }
  });
  
  // Detailed findings
  if (findings.length > 0) {
    console.log(`\n🔍 Detailed Findings:`);
    console.log('-'.repeat(50));
    
    findings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.severity.toUpperCase()}: ${finding.pattern}`);
      console.log(`   File: ${finding.file}`);
      console.log(`   Line: ${finding.line}`);
      console.log(`   Match: ${finding.match}`);
    });
    
    console.log(`\n❌ Scan failed: ${findings.length} potential secrets found`);
    process.exit(1);
  } else {
    console.log(`\n✅ Scan passed: No secrets found`);
    process.exit(0);
  }
}

/**
 * Generate JSON report for CI/CD
 */
function generateJSONReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesScanned,
      totalFindings: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    },
    findings: findings.map(f => ({
      file: f.file,
      pattern: f.pattern,
      severity: f.severity,
      line: f.line,
      match: f.match
    }))
  };
  
  const reportPath = path.join(__dirname, '../portal/secret-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 JSON report saved to: ${reportPath}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
const shouldGenerateJSON = args.includes('--json');

// Run the scan
runScan().then(() => {
  if (shouldGenerateJSON) {
    generateJSONReport();
  }
}).catch(error => {
  console.error('❌ Scan failed with error:', error);
  process.exit(1);
});