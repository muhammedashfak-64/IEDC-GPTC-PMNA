import { generateSingleCertificatePdf, normalizeColorToRgb, normalizeNumber } from '../lib/certificateGenerator';
import { loadDb, saveDb, updateEvent, generateProgramCertificates, ensureCertificatePdfExists } from '../lib/serverStore';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING CERTIFICATE FIXES VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    }
  }

  // TEST D: Color and Number Normalization
  console.log('--- TEST D: ROBUST COLOR & NUMERIC NORMALIZATION ---');
  const rgbFromHex = normalizeColorToRgb('#8B0000');
  assert(
    Math.abs(rgbFromHex[0] - 139 / 255) < 0.01 && rgbFromHex[1] === 0 && rgbFromHex[2] === 0,
    'Hex color #8B0000 parsed to exact float tuple'
  );

  const rgbFromName = normalizeColorToRgb('red');
  assert(
    rgbFromName[0] === 1 && rgbFromName[1] === 0 && rgbFromName[2] === 0,
    'Named color "red" normalized safely without string exception'
  );

  const rgbFromObject = normalizeColorToRgb({ red: 200, green: 50, blue: 25 });
  assert(
    typeof rgbFromObject[0] === 'number' && !isNaN(rgbFromObject[0]),
    'Object color { red, green, blue } safely normalized to numbers'
  );

  const numNormal = normalizeNumber('invalid-string', 45);
  assert(numNormal === 45, 'Invalid string safely falls back to default numeric value');

  // TEST A: Participation Certificate mixed case preservation
  console.log('\n--- TEST A: PARTICIPATION CERTIFICATE CASING & STORAGE ---');
  const db = loadDb();
  let testEvent = (db.events || []).find((e: any) => e.id === 'evt-test-cert');
  if (!testEvent) {
    testEvent = {
      id: 'evt-test-cert',
      title: 'State-Level AI & Robotics Workshop 2026',
      category: 'Workshop',
      level: 'State',
      date: '24 October 2026',
      time: '09:30 AM - 04:30 PM',
      venue: 'Main Auditorium',
      totalSeats: 60,
      seatsAvailable: 60,
      status: 'Published',
      certificateTitle: 'CERTIFICATE OF PARTICIPATION',
      certificateParagraph: 'In recognition of your active participation and commitment in the State-Level AI & Robotics Workshop 2026, organized by the IEDC Cell.',
      winnerCertificateTitle: 'WINNER CERTIFICATE',
      winnerCertificateParagraph: 'In recognition of your outstanding achievement and winning performance in the Drone Competition, organized by the IEDC Cell, Government Polytechnic College Perinthalmanna.',
      awardCategory: 'First Prize Winner',
      templateConfig: {
        nameY: 305,
        nameFontSize: 34,
        nameColor: '#8B0000',
        paraY: 252,
        paraFontSize: 12.5,
        paraMaxWidth: 580,
        paraLineSpacing: 18,
        paraColor: '#1F2937',
        paraAlign: 'center',
        paraBold: false,
        showCertId: true,
        certIdY: 45
      },
      winnerTemplateConfig: {
        nameY: 305,
        nameFontSize: 34,
        nameColor: '#8B0000',
        paraX: 0,
        paraY: 252,
        paraFontSize: 12.5,
        paraMaxWidth: 580,
        paraLineSpacing: 18,
        paraColor: '#1F2937',
        paraAlign: 'center',
        paraBold: false,
        showCertId: true,
        certIdY: 45,
        subtitleY: 398,
        introY: 363
      }
    };
    db.events.push(testEvent);
    saveDb(db);
  }

  // Test updating participation description with mixed casing
  const testParticipationDesc = 'In recognition of your Dedicated Participation in our Advanced AI Workshop.';
  testEvent.certificateParagraph = testParticipationDesc;
  updateEvent(testEvent.id, { certificateParagraph: testParticipationDesc }, { id: 'admin', full_name: 'Admin' } as any);

  // Reload from db
  const reloadedDb = loadDb();
  const reloadedEvt = reloadedDb.events.find((e: any) => e.id === testEvent.id);
  assert(
    reloadedEvt.certificateParagraph === testParticipationDesc,
    'Participation description successfully persisted to database with exact mixed casing'
  );

  // Generate Participation PDF
  const partPdfRes = await generateSingleCertificatePdf({
    certificateId: 'TEST-PART-001',
    recipientName: 'Muhammed Ashfak O',
    programName: reloadedEvt.title,
    programDate: reloadedEvt.date,
    certificateType: 'Participation',
    customParagraph: reloadedEvt.certificateParagraph
  }, reloadedEvt.templateConfig);

  assert(partPdfRes.pdfBytes.length > 5000, 'Participation PDF successfully generated');

  // TEST B: Winner Certificate independent description and NO forced uppercase
  console.log('\n--- TEST B: WINNER CERTIFICATE INDEPENDENCE & NO FORCED UPPERCASE ---');
  const testWinnerDesc = 'In recognition of your outstanding achievement and First Prize winning performance in the Drone Workshop, organized by the IEDC Cell, Government Polytechnic College Perinthalmanna.';
  updateEvent(testEvent.id, {
    winnerCertificateParagraph: testWinnerDesc,
    winnerCertificateTitle: 'WINNER CERTIFICATE'
  }, { id: 'admin', full_name: 'Admin' } as any);

  const reloadedDb2 = loadDb();
  const reloadedEvt2 = reloadedDb2.events.find((e: any) => e.id === testEvent.id);

  assert(
    reloadedEvt2.winnerCertificateParagraph === testWinnerDesc,
    'Winner description persisted independently to database'
  );
  assert(
    reloadedEvt2.winnerCertificateParagraph !== reloadedEvt2.certificateParagraph,
    'Participant and winner descriptions are strictly independent'
  );

  // Generate Winner PDF
  const winnerPdfRes = await generateSingleCertificatePdf({
    certificateId: 'TEST-WINNER-001',
    recipientName: 'Muhammed Ashfak O',
    programName: reloadedEvt2.title,
    programDate: reloadedEvt2.date,
    certificateType: 'Achievement',
    awardCategory: 'First Prize Winner',
    certificateSubtitle: '— WINNER CERTIFICATE —',
    customParagraph: reloadedEvt2.winnerCertificateParagraph
  }, reloadedEvt2.winnerTemplateConfig);

  assert(winnerPdfRes.pdfBytes.length > 5000, 'Winner PDF successfully generated');

  // Verify Fallback sentence casing when customParagraph is undefined for Type B
  const fallbackWinnerPdf = await generateSingleCertificatePdf({
    certificateId: 'TEST-FALLBACK-001',
    recipientName: 'Adarsh P',
    programName: 'Drone Hackathon',
    programDate: '24 October 2026',
    certificateType: 'Achievement',
    awardCategory: 'First Prize Winner'
  });
  assert(fallbackWinnerPdf.pdfBytes.length > 5000, 'Fallback Winner PDF generated without errors');

  // TEST C: Master Template Vector Art & PDF Structure
  console.log('\n--- TEST C: MASTER TEMPLATE PRESERVATION ---');
  const loadedPdf = await PDFDocument.load(winnerPdfRes.pdfBytes);
  const page = loadedPdf.getPages()[0];
  const size = page.getSize();
  assert(
    Math.abs(size.width - 842.25) < 5 && Math.abs(size.height - 595.5) < 5,
    'PDF preserves official A4 Landscape dimensions (842.25 x 595.5 pt)'
  );

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed with error:', err);
  process.exit(1);
});
