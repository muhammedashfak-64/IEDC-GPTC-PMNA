import { getPublicCertificateForVerification, retrieveStudentCertificate, generateProgramCertificates, loadDb, saveDb } from '../lib/serverStore';
import { generateSingleCertificatePdf } from '../lib/certificateGenerator';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('RUNNING END-TO-END CERTIFICATE & VERIFICATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, extra?: string) {
    total++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}: ${extra || 'failed'}`);
    }
  }

  // TEST 1: Verification lookup for known certificate
  console.log('--- TEST 1: PUBLIC VERIFICATION LOOKUP ---');
  const db = loadDb();
  const testCert = (db.certificates || []).find((c: any) => c.status === 'Published');
  if (testCert) {
    const verified = getPublicCertificateForVerification(testCert.certificateId);
    assert(verified !== null, `Certificate ${testCert.certificateId} found via verification engine`);
    assert(verified?.certificateId === testCert.certificateId, 'Certificate ID matches');
    assert(Boolean(verified?.pdfUrl?.includes(testCert.certificateId)), 'pdfUrl endpoint present in verification payload');
    assert(Boolean(verified?.pngUrl?.includes(testCert.certificateId)), 'pngUrl endpoint present in verification payload');
  } else {
    console.log('[SKIP] No published certificate in database');
  }

  // TEST 2: Student certificate retrieval by name and phone
  console.log('\n--- TEST 2: NAME & PHONE RETRIEVAL ---');
  if (testCert && testCert.phone) {
    const result = await retrieveStudentCertificate('All', testCert.participantName, testCert.phone);
    assert(result.success === true, `Retrieved certificate for ${testCert.participantName}`);
    assert(result.certificate?.certificateId === testCert.certificateId, 'Retrieved certificate ID matches');
  }

  // TEST 3: Multi-participant batch generation
  console.log('\n--- TEST 3: BATCH GENERATION FOR MULTIPLE PARTICIPANTS ---');
  const testBatchEventId = 'evt-batch-test';
  let batchEvent = (db.events || []).find((e: any) => e.id === testBatchEventId);
  if (!batchEvent) {
    batchEvent = {
      id: testBatchEventId,
      title: 'Robotics Bootcamp 2026',
      date: '28 October 2026',
      status: 'Published',
      certificateStatus: 'Published',
      requiresAttendance: false
    };
    db.events.push(batchEvent);
  }

  // Create 6 registered participants for this event
  const mockStudents = [
    { name: 'Student One', phone: '9847111111', reg: 'REG-101' },
    { name: 'Student Two', phone: '9847222222', reg: 'REG-102' },
    { name: 'Student Three', phone: '9847333333', reg: 'REG-103' },
    { name: 'Student Four', phone: '9847444444', reg: 'REG-104' },
    { name: 'Student Five', phone: '9847555555', reg: 'REG-105' },
    { name: 'Student Six', phone: '9847666666', reg: 'REG-106' }
  ];

  if (!db.registrations) db.registrations = [];
  mockStudents.forEach((st, idx) => {
    const existingReg = db.registrations.find((r: any) => r.id === `reg-batch-${idx}`);
    if (!existingReg) {
      db.registrations.push({
        id: `reg-batch-${idx}`,
        eventId: testBatchEventId,
        studentName: st.name,
        phone: st.phone,
        email: `student${idx}@gptcpmna.edu.in`,
        registerNumber: st.reg,
        status: 'Confirmed',
        attendance: 'Present'
      });
    }
  });
  saveDb(db);

  const startTime = Date.now();
  const batchResult = await generateProgramCertificates(
    testBatchEventId,
    { regenerateExisting: true },
    { id: 'admin', full_name: 'Test Administrator' } as any
  );
  const duration = Date.now() - startTime;

  assert(batchResult.success === true, 'Batch generation completed successfully');
  assert(batchResult.generatedCount >= 6, `Generated certificates for all ${batchResult.generatedCount} participants`);
  assert(duration < 15000, `Batch completed in ${duration}ms (well under serverless timeout threshold)`);

  // Verify all 6 certificates have valid PDF files
  const freshDb = loadDb();
  for (const st of mockStudents) {
    const cert = freshDb.certificates.find((c: any) => c.participantName === st.name.toUpperCase() && c.eventId === testBatchEventId);
    assert(!!cert, `Certificate created in DB for ${st.name}`);
    if (cert) {
      const publicPdfPath = path.join(process.cwd(), 'public', 'certificates', `${cert.certificateId}.pdf`);
      const existsLocally = fs.existsSync(publicPdfPath);
      assert(existsLocally, `PDF file exists on disk: ${cert.certificateId}.pdf`);
      if (existsLocally) {
        const stats = fs.statSync(publicPdfPath);
        assert(stats.size > 5000, `PDF size is valid: ${stats.size} bytes`);
      }
    }
  }

  // Clean up test batch event registrations
  freshDb.registrations = freshDb.registrations.filter((r: any) => !r.id.startsWith('reg-batch-'));
  freshDb.events = freshDb.events.filter((e: any) => e.id !== testBatchEventId);
  freshDb.certificates = freshDb.certificates.filter((c: any) => c.eventId !== testBatchEventId);
  saveDb(freshDb);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================\n');
}

runEndToEndTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
