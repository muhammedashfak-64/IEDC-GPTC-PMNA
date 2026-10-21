import { supabaseAdmin } from './supabaseAdmin';
import { isSupabaseConfigured } from './supabase';

// Safe fire-and-forget helper that never crashes the calling thread
async function safeDbOp(operationName: string, op: () => Promise<any>) {
  if (!isSupabaseConfigured()) return null;
  try {
    const result = await op();
    if (result?.error) {
      console.warn(`[SupabaseSync] ${operationName} returned error:`, result.error.message || result.error);
    }
    return result?.data || null;
  } catch (err: any) {
    console.warn(`[SupabaseSync] ${operationName} exception:`, err?.message || err);
    return null;
  }
}

// -------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------
export async function syncEventToSupabase(event: any, isUpdate = false) {
  return safeDbOp('syncEventToSupabase', async () => {
    const baseRow = {
      id: event.id,
      title: event.title,
      category: event.category || 'Workshop',
      level: event.level || 'College',
      date: event.date,
      time: event.time || '10:00 AM - 04:00 PM',
      venue: event.venue || 'Main Auditorium',
      description: event.description || '',
      speaker: event.speaker || '',
      total_seats: Number(event.totalSeats) || 60,
      seats_available: Number(event.seatsAvailable ?? event.totalSeats) || 60,
      banner_image: event.bannerImage || '',
      brochure_url: event.brochureUrl || '',
      registration_link: event.registrationLink || '',
      status: event.status || 'Published',
      quota_config: event.quotaConfig || null,
      registration_start_date: event.registrationStartDate || null,
      registration_closing_date: event.registrationClosingDate || null,
      updated_at: new Date().toISOString()
    };

    const fullRow = {
      ...baseRow,
      certificate_title: event.certificateTitle || 'CERTIFICATE OF PARTICIPATION',
      certificate_paragraph: event.certificateParagraph || null,
      certificate_template_url: event.certificateTemplateUrl || null,
      template_config: event.templateConfig || null,
      winner_certificate_title: event.winnerCertificateTitle || 'CERTIFICATE OF ACHIEVEMENT',
      winner_certificate_paragraph: event.winnerCertificateParagraph || null,
      winner_template_config: event.winnerTemplateConfig || null,
      award_category: event.awardCategory || null
    };

    if (isUpdate) {
      const res = await supabaseAdmin.from('events').upsert(fullRow, { onConflict: 'id' });
      if (res?.error && res.error.message?.includes('column')) {
        return supabaseAdmin.from('events').upsert(baseRow, { onConflict: 'id' });
      }
      return res;
    }
    const insertRes = await supabaseAdmin.from('events').insert(fullRow);
    if (insertRes?.error && insertRes.error.message?.includes('column')) {
      return supabaseAdmin.from('events').insert(baseRow);
    }
    return insertRes;
  });
}

export async function deleteEventFromSupabase(id: string) {
  return safeDbOp('deleteEventFromSupabase', async () => {
    return supabaseAdmin.from('events').delete().eq('id', id);
  });
}

// -------------------------------------------------------------
// TEAM MEMBERS (STUDENT LEADS & EXECUTIVE MEMBERS)
// -------------------------------------------------------------
export async function syncTeamMemberToSupabase(member: any, isUpdate = false) {
  return safeDbOp('syncTeamMemberToSupabase', async () => {
    const baseRow = {
      id: member.id,
      name: member.name,
      role: member.role || member.position || 'Executive Member',
      category: member.category || 'Executive Members',
      department: member.department || '',
      email: member.email || '',
      contact: member.contact || member.phone || '',
      show_email_publicly: !!member.showEmailPublicly,
      show_contact_publicly: !!member.showContactPublicly,
      graduation_date: member.graduationDate || '',
      photo_url: member.photoUrl || '',
      instagram_username: member.instagramUsername || '',
      instagram_url: member.instagramUrl || '',
      linkedin_url: member.linkedinUrl || '',
      bio: member.bio || '',
      display_order: Number(member.displayOrder) || 1,
      status: member.status || 'Published',
      verification_flag: member.verificationFlag || '',
      updated_at: new Date().toISOString()
    };

    const extendedRow = {
      ...baseRow,
      image_position: member.imagePosition || 'bottom',
      image_scale: member.imageScale !== undefined ? Number(member.imageScale) : 1.0,
      animation_enabled: member.animationEnabled !== false,
      animation_style: member.animationStyle || 'fade-up',
      animation_delay: member.animationDelay !== undefined ? Number(member.animationDelay) : 0,
      glow_enabled: member.glowEnabled !== false,
      glow_intensity: member.glowIntensity || 'subtle',
      bg_style: member.bgStyle || 'radial-light',
      is_transparent: member.isTransparent !== false
    };

    // Try syncing extended row first; if DB columns are not yet migrated, fall back to base row
    try {
      const res = isUpdate
        ? await supabaseAdmin.from('team_members').upsert(extendedRow, { onConflict: 'id' })
        : await supabaseAdmin.from('team_members').insert(extendedRow);
      
      if (!res.error) return res;
      if (res.error?.code === '42703') {
        // Fall back to base columns
        return isUpdate
          ? await supabaseAdmin.from('team_members').upsert(baseRow, { onConflict: 'id' })
          : await supabaseAdmin.from('team_members').insert(baseRow);
      }
      return res;
    } catch {
      return isUpdate
        ? await supabaseAdmin.from('team_members').upsert(baseRow, { onConflict: 'id' })
        : await supabaseAdmin.from('team_members').insert(baseRow);
    }
  });
}

export async function deleteTeamMemberFromSupabase(id: string) {
  return safeDbOp('deleteTeamMemberFromSupabase', async () => {
    return supabaseAdmin.from('team_members').delete().eq('id', id);
  });
}

// -------------------------------------------------------------
// CERTIFICATES
// -------------------------------------------------------------
export async function syncCertificateToSupabase(cert: any, isUpdate = false) {
  return safeDbOp('syncCertificateToSupabase', async () => {
    const row = {
      id: cert.id,
      certificate_id: cert.certificateId || cert.certificate_id,
      participant_name: cert.participantName || cert.participant_name,
      register_number: cert.registerNumber || cert.register_number,
      email: cert.email || '',
      phone: cert.phone || '',
      event_id: cert.eventId || cert.event_id || '',
      event_name: cert.eventName || cert.event_name || 'IEDC Technical Event',
      event_date: cert.eventDate || cert.event_date || new Date().toISOString().split('T')[0],
      certificate_type: cert.certificateType || cert.certificate_type || 'Participation',
      qr_code_url: cert.qrCodeUrl || cert.qr_code_url || '',
      pdf_storage_url: cert.pdfStorageUrl || cert.pdf_storage_url || '',
      status: cert.status || 'Published',
      downloads_count: Number(cert.downloadsCount || cert.downloads_count) || 0,
      issued_date: cert.issueDate || cert.issued_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    };

    if (isUpdate) {
      return supabaseAdmin.from('certificates').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('certificates').insert(row);
  });
}

export async function deleteCertificateFromSupabase(id: string) {
  return safeDbOp('deleteCertificateFromSupabase', async () => {
    return supabaseAdmin.from('certificates').delete().eq('id', id);
  });
}

// -------------------------------------------------------------
// PROJECTS
// -------------------------------------------------------------
export async function syncProjectToSupabase(project: any, isUpdate = false) {
  return safeDbOp('syncProjectToSupabase', async () => {
    const techArray = Array.isArray(project.technology)
      ? project.technology
      : (project.technology || '').split(',').map((t: string) => t.trim()).filter(Boolean);

    const row = {
      id: project.id,
      title: project.title,
      description: project.description,
      department: project.department || 'Electronics Engineering',
      technologies: techArray,
      year: project.year || '2026',
      status: project.status || 'Prototype',
      author: project.author || '',
      mentor: project.mentor || '',
      github_url: project.githubUrl || project.github_url || '',
      demo_url: project.demoUrl || project.demo_url || '',
      image_url: project.imageUrl || project.image_url || '',
      publication_status: project.publicationStatus || project.publication_status || 'Published',
      updated_at: new Date().toISOString()
    };

    if (isUpdate) {
      return supabaseAdmin.from('projects').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('projects').insert(row);
  });
}

export async function deleteProjectFromSupabase(id: string) {
  return safeDbOp('deleteProjectFromSupabase', async () => {
    return supabaseAdmin.from('projects').delete().eq('id', id);
  });
}

// -------------------------------------------------------------
// GALLERY
// -------------------------------------------------------------
export async function syncGalleryToSupabase(item: any, isUpdate = false) {
  return safeDbOp('syncGalleryToSupabase', async () => {
    const row = {
      id: item.id,
      title: item.title,
      album_name: item.albumName || item.album_name || 'General',
      media_type: item.mediaType || item.media_type || 'Image',
      media_url: item.mediaUrl || item.media_url,
      caption: item.caption || '',
      alt_text: item.altText || item.alt_text || item.title,
      status: item.status || 'Published'
    };

    if (isUpdate) {
      return supabaseAdmin.from('gallery_items').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('gallery_items').insert(row);
  });
}

export async function deleteGalleryFromSupabase(id: string) {
  return safeDbOp('deleteGalleryFromSupabase', async () => {
    return supabaseAdmin.from('gallery_items').delete().eq('id', id);
  });
}

// -------------------------------------------------------------
// RESOURCES
// -------------------------------------------------------------
export async function syncResourceToSupabase(res: any, isUpdate = false) {
  return safeDbOp('syncResourceToSupabase', async () => {
    const row = {
      id: res.id,
      title: res.title,
      category: res.category || 'General',
      file_type: res.fileType || res.file_type || 'PDF',
      description: res.description || '',
      file_url: res.fileUrl || res.file_url || '',
      author: res.author || 'IEDC Faculty',
      status: res.status || 'Published'
    };

    if (isUpdate) {
      return supabaseAdmin.from('resources').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('resources').insert(row);
  });
}

// -------------------------------------------------------------
// BLOGS
// -------------------------------------------------------------
export async function syncBlogToSupabase(blog: any, isUpdate = false) {
  return safeDbOp('syncBlogToSupabase', async () => {
    const row = {
      id: blog.id,
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      author: blog.author || '',
      author_role: blog.authorRole || blog.author_role || 'Student Lead',
      category: blog.category || 'Innovation',
      read_time: blog.readTime || blog.read_time || '5 min read',
      image_url: blog.imageUrl || blog.image_url || '',
      status: blog.status || 'Published'
    };

    if (isUpdate) {
      return supabaseAdmin.from('blogs').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('blogs').insert(row);
  });
}

// -------------------------------------------------------------
// ANNOUNCEMENTS
// -------------------------------------------------------------
export async function syncAnnouncementToSupabase(ann: any, isUpdate = false) {
  return safeDbOp('syncAnnouncementToSupabase', async () => {
    const row = {
      id: ann.id,
      title: ann.title,
      message: ann.message,
      priority: ann.priority || 'Normal',
      is_urgent: ann.priority === 'High',
      action_link: ann.actionLink || ann.action_link || '',
      status: ann.isActive ? 'Published' : 'Archived'
    };

    if (isUpdate) {
      return supabaseAdmin.from('announcements').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('announcements').insert(row);
  });
}

// -------------------------------------------------------------
// STARTUPS
// -------------------------------------------------------------
export async function syncStartupToSupabase(startup: any, isUpdate = false) {
  return safeDbOp('syncStartupToSupabase', async () => {
    const foundersArray = Array.isArray(startup.founders)
      ? startup.founders
      : (startup.founders || '').split(',').map((f: string) => f.trim()).filter(Boolean);

    const row = {
      id: startup.id,
      name: startup.name,
      tagline: startup.tagline || '',
      description: startup.description || '',
      founders: foundersArray,
      department: startup.department || 'Electronics Engineering',
      stage: startup.stage || 'Incubated',
      funding_amount: startup.fundingAmount || startup.funding_amount || '',
      logo_url: startup.logoUrl || startup.logo_url || startup.logo || '',
      website: startup.website || '',
      status: startup.status || 'Published'
    };

    if (isUpdate) {
      return supabaseAdmin.from('startups').upsert(row, { onConflict: 'id' });
    }
    return supabaseAdmin.from('startups').insert(row);
  });
}

// -------------------------------------------------------------
// WEBSITE SETTINGS
// -------------------------------------------------------------
export async function syncSettingsToSupabase(settings: any) {
  return safeDbOp('syncSettingsToSupabase', async () => {
    const row = {
      id: 'current_settings',
      site_title: settings.siteTitle || 'IEDC GPTC PMNA',
      college_name: settings.collegeName || 'Government Polytechnic College, Perinthalmanna',
      hero_heading: settings.heroHeading || 'Where Innovation Meets Opportunity',
      campus_photo_url: settings.campusPhotoUrl || '/campus-main.jpeg',
      iedc_gptc_pmna_logo_url: settings.iedcGptcPmnaLogoUrl || '/iedc-gptc-pmna-logo.png',
      college_logo_url: settings.collegeLogoUrl || '/college-logo.png',
      iedc_logo_url: settings.iedcLogoUrl || '/iedc-logo.png',
      contact_email: settings.contact?.email || 'iedc@gptcpmna.edu.in',
      contact_phone: settings.contact?.phone || '+91 4933 227221',
      address: settings.contact?.address || '',
      social_links: settings.social || {},
      updated_at: new Date().toISOString()
    };

    return supabaseAdmin.from('website_settings').upsert(row, { onConflict: 'id' });
  });
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
export async function syncAuditLogToSupabase(log: any) {
  return safeDbOp('syncAuditLogToSupabase', async () => {
    const row = {
      id: log.id,
      user_id: log.userId,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      details: log.details,
      ip_address: log.ipAddress || '127.0.0.1'
    };

    return supabaseAdmin.from('audit_logs').insert(row);
  });
}

// -------------------------------------------------------------
// REGISTRATIONS
// -------------------------------------------------------------
export async function syncRegistrationToSupabase(reg: any, isUpdate = false) {
  return safeDbOp('syncRegistrationToSupabase', async () => {
    const row = {
      id: reg.id,
      registration_code: reg.registrationCode || reg.registration_code || `REG-2026-${reg.id.replace('reg-', '').padStart(5, '0')}`,
      event_id: reg.eventId || reg.event_id,
      event_title: reg.eventTitle || reg.event_title || 'Campus Event',
      student_name: reg.studentName || reg.student_name,
      register_number: reg.registerNumber || reg.register_number,
      email: reg.email,
      phone: reg.phone,
      department: reg.department || 'General',
      academic_year: reg.academicYear || reg.academic_year || '2nd Year',
      college_name: reg.collegeName || reg.college_name || 'Govt Polytechnic College Perinthalmanna',
      participation_category: reg.participationCategory || reg.participation_category || 'Internal',
      waitlist_position: reg.waitlistPosition ?? reg.waitlist_position ?? null,
      district: reg.district || null,
      course: reg.course || null,
      additional_notes: reg.additionalNotes || reg.additional_notes || '',
      status: ['Confirmed', 'Pending', 'Attended', 'Cancelled', 'Waitlisted', 'Rejected'].includes(reg.status) ? reg.status : 'Confirmed',
      consent: reg.consent !== false,
      created_at: reg.registeredAt || reg.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const fullRow = {
      ...row,
      pass_token: reg.passToken || null,
      qr_payload: reg.qrPayload || null,
      attendance_status: reg.attendance || (reg.status === 'Attended' ? 'Present' : 'Absent'),
      attended_at: reg.attendedAt || null,
      marked_by: reg.markedBy || null,
      attendance_method: reg.attendanceMethod || null
    };

    if (isUpdate) {
      const res = await supabaseAdmin.from('registrations').upsert(fullRow, { onConflict: 'id' });
      if (res?.error && res.error.message?.includes('column')) {
        return supabaseAdmin.from('registrations').upsert(row, { onConflict: 'id' });
      }
      return res;
    }
    const insertRes = await supabaseAdmin.from('registrations').insert(fullRow);
    if (insertRes?.error && insertRes.error.message?.includes('column')) {
      return supabaseAdmin.from('registrations').insert(row);
    }
    return insertRes;
  });
}

export async function deleteRegistrationFromSupabase(id: string) {
  return safeDbOp('deleteRegistrationFromSupabase', async () => {
    return supabaseAdmin.from('registrations').delete().eq('id', id);
  });
}
