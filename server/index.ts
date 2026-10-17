import http from 'http';
import { ImageDecoder } from '../src/services/cv/imageDecoder';
import { ImageValidationPipeline } from '../src/services/cv/imageValidationPipeline';
import { InfrastructureCvEngine } from '../src/services/cv/infrastructureCvEngine';
import { MODEL_CAPABILITIES } from '../src/services/cv/modelRegistry';
import { Detection } from '../src/types/infrastructure';
import { SeverityEngine } from '../src/services/severityEngine';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

/**
 * Production-Grade Local Computer Vision & Infrastructure Detection Server
 * Provides REST endpoints for image validation, defect detection, and model diagnostics.
 */
const server = http.createServer(async (req, res) => {
  // Enable CORS for frontend integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    // 1. Health & Readiness Endpoint
    if (url.pathname === '/api/v1/health' || url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'online',
          service: 'InfraLens Real Computer Vision Inference Server',
          version: '2.0.0',
          engine: 'InfraLens-EdgeCV-TensorRuntime',
          uptimeSeconds: Math.round(process.uptime()),
          activeModels: Object.keys(MODEL_CAPABILITIES).length,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // 2. Capabilities & Category Registry
    if (url.pathname === '/api/v1/categories') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(MODEL_CAPABILITIES));
      return;
    }

    // 3. Image Validation Only Endpoint
    if (url.pathname === '/api/v1/validate' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required field: image (base64 or data URL)' }));
        return;
      }

      const buffer = await ImageDecoder.decode(body.image);
      const validation = ImageValidationPipeline.validate(buffer);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(validation));
      return;
    }

    // 4. Defect Detection Endpoint
    if ((url.pathname === '/api/v1/detect' || url.pathname === '/detect') && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required field: image (base64 or data URL)' }));
        return;
      }

      const startTime = performance.now();
      const buffer = await ImageDecoder.decode(body.image);

      // Stage A: Strict Image Validation
      const validation = ImageValidationPipeline.validate(buffer);

      if (!validation.isValid) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'rejected',
            operationalState: validation.operationalState,
            validation,
            rejectionReason: validation.rejectionReason,
            message: validation.rejectionMessage,
            sceneType: validation.sceneType,
            metrics: validation.metrics,
            detections: [],
            cropVerifications: [],
            latencyMs: Math.round(performance.now() - startTime),
          })
        );
        return;
      }

      // Stage B: Computer Vision Defect Detection
      const rawDetections = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);

      // Stage C: Physical Severity & Metadata Calculation
      const structuredDetections: Detection[] = rawDetections.map((det, idx) => {
        const sevResult = SeverityEngine.calculateSeverity(
          det.type,
          det.evidence.calibratedConfidence,
          undefined,
          det.evidence
        );

        return {
          id: `cv-det-${Date.now()}-${idx}`,
          type: det.type,
          typeLabel: det.label,
          confidence: det.evidence.calibratedConfidence,
          boundingBox: det.evidence.boundingBox,
          severity: sevResult.severity,
          severityScore: sevResult.score,
          metadata: {
            roadCoveragePct: det.evidence.frameCoveragePct,
            damageExtentMm: Math.round(det.evidence.areaPixels * 0.8),
            depthEstimateMm: Math.round(det.evidence.contrastDelta * 1.2),
            surfaceType: validation.sceneType === 'concrete_sidewalk' ? 'concrete' : 'asphalt',
            notes: sevResult.rationale,
          },
        };
      });

      const cropVerifications = rawDetections
        .map((d) => d.evidence.cropVerification)
        .filter(Boolean);

      let operationalState = 'NO_DAMAGE_DETECTED';
      if (structuredDetections.length > 0) {
        const hasHighConfidence = structuredDetections.some((d) => d.confidence >= 65);
        operationalState = hasHighConfidence ? 'DAMAGE_VERIFIED' : 'UNCERTAIN';
      }

      const latencyMs = Math.round(performance.now() - startTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: structuredDetections.length > 0 ? (operationalState === 'DAMAGE_VERIFIED' ? 'defects_detected' : 'uncertain') : 'nominal_infrastructure',
          operationalState,
          validation,
          detections: structuredDetections,
          cropVerifications,
          defectCount: structuredDetections.length,
          modelName: 'InfraLens-EdgeCV-v2.0 (Verified Vision Engine)',
          latencyMs,
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // 404 Route
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', path: url.pathname }));
  } catch (err: any) {
    console.error('[InfraLens Inference Server Error]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Inference processing error',
        details: err?.message || String(err),
      })
    );
  }
});

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      // Protect against giant payloads (> 50MB)
      if (data.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large (>50MB)'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Start server if executed directly
if (process.argv[1]?.endsWith('server/index.ts') || process.argv[1]?.endsWith('server/index.js')) {
  server.listen(PORT, () => {
    console.log(`[InfraLens] Real Computer Vision Inference Server listening on port ${PORT}`);
    console.log(`[InfraLens] Health endpoint: http://localhost:${PORT}/api/v1/health`);
    console.log(`[InfraLens] Detect endpoint: http://localhost:${PORT}/api/v1/detect`);
  });
}

export { server };
