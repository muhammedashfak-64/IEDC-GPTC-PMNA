import { supabaseAdmin } from '../lib/supabaseAdmin';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsAsync,
  fetchEventsFromDatabase,
  registerStudentForEvent,
  getRegistrations,
  getProgramQuotaDetails
} from '../lib/serverStore';

async function runFullEventTests() {
  console.log('====================================================');
  console.log('IEDC GPTC PMNA — EVENT MANAGEMENT SYSTEM FULL AUDIT');
  console.log('====================================================\n');

  let testACreatedId = '';
  let testDCreatedId = '';

  // ----------------------------------------------------
  // TEST A — CREATE EVENT & PERSISTENCE
  // ----------------------------------------------------
  console.log('--- TEST A: CREATE EVENT ---');
  try {
    const testEventData = {
      title: 'Automated E2E Test Event - AI Innovation Summit',
      category: 'Workshop',
      level: 'State',
      date: '2026-11-15',
      time: '10:00 AM - 04:00 PM',
      venue: 'Main Seminar Hall, GPTC PMNA',
      description: 'End-to-end testing of event creation, Supabase persistence, and revalidation.',
      speaker: 'Dr. Jane Smith, AI Research Lead',
      totalSeats: 75,
      seatsAvailable: 75,
      bannerImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      brochureUrl: 'https://example.com/brochure.pdf',
      registrationOpen: true,
      certificateEligible: true,
      status: 'Published' as const,
      facultyCoordinator: 'Prof. Test Coordinator',
      studentCoordinator: 'Test Lead'
    };

    const created = await createEvent(testEventData);
    testACreatedId = created.id;
    console.log(`[PASS] Event created successfully with ID: ${created.id}`);

    // Verify record in live Supabase table directly
    const { data: supaEvent, error: supaErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', created.id)
      .single();

    if (supaErr || !supaEvent) {
      throw new Error(`Failed to query event directly from Supabase: ${supaErr?.message}`);
    }
    console.log(`[PASS] Supabase PostgreSQL confirmed record: ID=${supaEvent.id}, Title="${supaEvent.title}", Status="${supaEvent.status}"`);

    // Verify admin query returns the created event
    const adminEvents = await getEventsAsync(false);
    const inAdmin = adminEvents.find((e: any) => e.id === created.id);
    if (!inAdmin) throw new Error('Created event not found in admin events list!');
    console.log(`[PASS] Admin listing confirmed event presence.`);

    // Verify public query returns the published event
    const publicEvents = await getEventsAsync(true);
    const inPublic = publicEvents.find((e: any) => e.id === created.id);
    if (!inPublic) throw new Error('Created published event not found in public events list!');
    console.log(`[PASS] Public listing confirmed event presence.`);

    // Simulate page reload / cold container start by fetching fresh from Supabase
    const freshDbEvents = await fetchEventsFromDatabase();
    const inFresh = freshDbEvents.find((e: any) => e.id === created.id);
    if (!inFresh) throw new Error('Event vanished after fresh reload from Supabase!');
    console.log(`[PASS] Event persists across cold reload / refresh simulation.`);
  } catch (err: any) {
    console.error(`[FAIL] Test A failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST B — EDIT EVENT & RELATIONSHIP PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- TEST B: EDIT EVENT ---');
  try {
    const updatedTitle = 'Automated E2E Test Event - AI Innovation Summit (UPDATED)';
    const updatedVenue = 'Advanced IoT Lab & Auditorium';

    const updated = await updateEvent(testACreatedId, {
      title: updatedTitle,
      venue: updatedVenue,
      totalSeats: 120
    });

    if (!updated || updated.title !== updatedTitle) {
      throw new Error('updateEvent did not return updated fields');
    }
    console.log(`[PASS] Event updated via updateEvent.`);

    // Verify Supabase directly
    const { data: supaUpdated, error: supaUpdErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', testACreatedId)
      .single();

    if (supaUpdErr || supaUpdated.title !== updatedTitle || supaUpdated.venue !== updatedVenue) {
      throw new Error(`Supabase did not persist updated values: ${supaUpdErr?.message}`);
    }
    console.log(`[PASS] Supabase PostgreSQL confirmed updated fields: Title="${supaUpdated.title}", Venue="${supaUpdated.venue}"`);

    // Register a student for this event to verify relationships are preserved
    const reg = await registerStudentForEvent({
      eventId: testACreatedId,
      studentName: 'Test Student E2E',
      registerNumber: 'TEST9988',
      email: 'teststudent9988@gptcpmna.ac.in',
      phone: '9876543210',
      department: 'Electronics Engineering',
      academicYear: 'Third Year',
      participationCategory: 'Internal',
      consent: true
    });
    console.log(`[PASS] Registered student for event: RegCode=${reg.registrationCode}, PassToken=${reg.passToken ? 'Valid' : 'None'}`);

    // Edit event again and ensure registration is still attached
    await updateEvent(testACreatedId, { speaker: 'Updated Keynote Speaker' });
    const regList = getRegistrations(testACreatedId);
    if (regList.length === 0 || regList[0].studentName !== 'Test Student E2E') {
      throw new Error('Registration was lost after event update!');
    }
    console.log(`[PASS] Registration relationship preserved after event update.`);
  } catch (err: any) {
    console.error(`[FAIL] Test B failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST C — DELETE EVENT & PREVENT REAPPEARANCE
  // ----------------------------------------------------
  console.log('\n--- TEST C: DELETE EVENT ---');
  try {
    const deleted = await deleteEvent(testACreatedId);
    if (!deleted) throw new Error('deleteEvent returned false');
    console.log(`[PASS] deleteEvent executed successfully.`);

    // Check Supabase directly
    const { data: supaDeleted, error: delErr } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', testACreatedId);

    if (supaDeleted && supaDeleted.length > 0) {
      throw new Error('Event still exists in Supabase PostgreSQL after deletion!');
    }
    console.log(`[PASS] Supabase PostgreSQL confirmed event is completely deleted from database.`);

    // Verify admin list does not return it
    const adminEventsAfter = await getEventsAsync(false);
    if (adminEventsAfter.some((e: any) => e.id === testACreatedId)) {
      throw new Error('Deleted event reappeared in admin events list!');
    }
    console.log(`[PASS] Admin listing confirmed event is gone.`);

    // Verify public list does not return it
    const publicEventsAfter = await getEventsAsync(true);
    if (publicEventsAfter.some((e: any) => e.id === testACreatedId)) {
      throw new Error('Deleted event reappeared in public events list!');
    }
    console.log(`[PASS] Public listing confirmed event is gone.`);

    // Simulate fresh reload from database
    const freshDbAfter = await fetchEventsFromDatabase();
    if (freshDbAfter.some((e: any) => e.id === testACreatedId)) {
      throw new Error('Deleted event resurrected after fresh DB reload!');
    }
    console.log(`[PASS] Deleted event does not resurrect on cold reload / refresh.`);
  } catch (err: any) {
    console.error(`[FAIL] Test C failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST D — PUBLICATION STATUS (DRAFT VS PUBLISHED)
  // ----------------------------------------------------
  console.log('\n--- TEST D: PUBLICATION STATUS & VISIBILITY ---');
  try {
    // 1. Create a Draft event
    const draft = await createEvent({
      title: 'Draft Robotics Workshop',
      category: 'Workshop',
      level: 'College',
      date: '2026-12-01',
      time: '09:00 AM - 01:00 PM',
      venue: 'Robotics Lab',
      description: 'Internal draft event not yet ready for public registration.',
      status: 'Draft',
      totalSeats: 30,
      seatsAvailable: 30
    });
    testDCreatedId = draft.id;
    console.log(`[PASS] Created Draft event with ID: ${draft.id}`);

    // 2. Verify visible to admin
    const adminList1 = await getEventsAsync(false);
    if (!adminList1.some((e: any) => e.id === draft.id)) {
      throw new Error('Draft event not visible to admin!');
    }
    console.log(`[PASS] Draft event is visible to administrators.`);

    // 3. Verify hidden from public
    const publicList1 = await getEventsAsync(true);
    if (publicList1.some((e: any) => e.id === draft.id)) {
      throw new Error('Draft event is improperly visible to the public!');
    }
    console.log(`[PASS] Draft event is correctly hidden from public.`);

    // 4. Publish event
    await updateEvent(draft.id, { status: 'Published' });
    const publicList2 = await getEventsAsync(true);
    if (!publicList2.some((e: any) => e.id === draft.id)) {
      throw new Error('Published event is not appearing in public listing!');
    }
    console.log(`[PASS] Published event immediately appears on public listing.`);

    // 5. Unpublish event back to Draft
    await updateEvent(draft.id, { status: 'Draft' });
    const publicList3 = await getEventsAsync(true);
    if (publicList3.some((e: any) => e.id === draft.id)) {
      throw new Error('Unpublished event did not disappear from public listing!');
    }
    console.log(`[PASS] Unpublished event immediately disappears from public listing without being recreated.`);

    // Clean up draft test event
    await deleteEvent(draft.id);
    console.log(`[PASS] Cleaned up test draft event.`);
  } catch (err: any) {
    console.error(`[FAIL] Test D failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST E — DATA CONSISTENCY ACROSS SUBSYSTEMS
  // ----------------------------------------------------
  console.log('\n--- TEST E: DATA CONSISTENCY ACROSS SUBSYSTEMS ---');
  try {
    const events = await getEventsAsync(false);
    if (events.length === 0) throw new Error('No events found for consistency test.');
    const targetEvent = events[0];
    const targetId = targetEvent.id;
    console.log(`Testing consistency for event: "${targetEvent.title}" (ID: ${targetId})`);

    // 1. Quota config lookup
    const quota = getProgramQuotaDetails(targetId);
    if (!quota || !quota.quotaConfig) {
      throw new Error(`Quota details not retrievable for event ID ${targetId}`);
    }
    console.log(`[PASS] Quota configuration matches Event ID: ${targetId}`);

    // 2. Registrations lookup
    const regs = getRegistrations(targetId);
    console.log(`[PASS] Registration records lookup successful (${regs.length} registrations found).`);

    // 3. QR pass structure validation
    if (regs.length > 0) {
      const reg = regs[0];
      if (!reg.qrPayload.startsWith(`IEDCPASS:${targetId}:`)) {
        throw new Error(`QR payload mismatch: expected IEDCPASS:${targetId}:..., got ${reg.qrPayload}`);
      }
      console.log(`[PASS] QR Pass token correctly encapsulates Event ID: ${targetId}`);
    }
  } catch (err: any) {
    console.error(`[FAIL] Test E failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // TEST F — CONCURRENT OPERATIONS & RAPID WRITES
  // ----------------------------------------------------
  console.log('\n--- TEST F: CONCURRENT OPERATIONS & RAPID WRITES ---');
  try {
    const concurrentIds: string[] = [];
    const titles = [
      'Rapid Event A - Hardware Hack',
      'Rapid Event B - Cloud Workshop',
      'Rapid Event C - Drone Bootcamp'
    ];

    // Fire 3 simultaneous create calls
    console.log('Dispatching 3 concurrent event creations to Supabase...');
    const results = await Promise.all(
      titles.map((title) =>
        createEvent({
          title,
          category: 'Hackathon',
          level: 'State',
          date: '2026-11-20',
          time: '09:00 AM - 05:00 PM',
          venue: 'Lab Complex',
          description: 'Testing concurrency',
          status: 'Published',
          totalSeats: 50,
          seatsAvailable: 50
        })
      )
    );

    for (const r of results) {
      concurrentIds.push(r.id);
    }

    // Verify all 3 exist in Supabase with distinct IDs
    const { data: supaRapid, error: rapidErr } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .in('id', concurrentIds);

    if (rapidErr || supaRapid.length !== 3) {
      throw new Error(`Expected 3 records in Supabase, found ${supaRapid?.length || 0}`);
    }
    console.log(`[PASS] All 3 concurrent events created safely with unique IDs in Supabase.`);

    // Clean up concurrent test events
    for (const id of concurrentIds) {
      await deleteEvent(id);
    }
    console.log(`[PASS] Concurrent events cleaned up successfully.`);
  } catch (err: any) {
    console.error(`[FAIL] Test F failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('ALL TESTS A THROUGH F PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runFullEventTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
