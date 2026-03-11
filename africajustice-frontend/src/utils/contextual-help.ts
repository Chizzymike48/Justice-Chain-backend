/**
 * Contextual Help Content
 * Defines all help text, tooltips, and guidance for every feature in the app
 */

export const helpContent = {
  // Authentication & Onboarding
  auth: {
    signup: {
      title: 'Create Your Account',
      description: 'Join AfricaJustice to report corruption and track accountability',
      steps: [
        'Enter your email address',
        'Create a secure password (min 8 characters)',
        'Verify your email through the link sent to your inbox',
        'Complete your profile with basic information',
      ],
      tip: 'Use a password manager to create a strong password you can remember',
    },
    login: {
      title: 'Access Your Account',
      description: 'Log in to submit reports, track evidence, and collaborate',
      tip: 'Keep your email and password secure. Never share your login credentials',
    },
    passwordReset: {
      title: 'Recover Your Password',
      description: 'If you forget your password, use this option to reset it',
      steps: [
        'Enter your registered email address',
        'Click the reset link sent to your email',
        'Create a new password',
        'Log in with your new password',
      ],
    },
  },

  // Live Streaming
  livestream: {
    goLive: {
      title: 'Go Live - Record Evidence in Real-Time',
      description: 'Start recording immediately to capture corruption incidents as they happen',
      quickStart: 'Click "Go Live" to open the recording modal',
      options: [
        {
          label: 'Emergency Presets',
          description: 'One-click buttons for common incidents (robbery, assault, police abuse, etc)',
          tips: [
            'Choose the matching incident type for faster setup',
            'Pre-filled titles help categorization and search',
            'Timestamps are automatically added',
          ],
        },
        {
          label: 'Custom Description',
          description: 'Enter any detail about what is happening',
          tips: [
            'Be specific: location, people involved, what is happening',
            'Include relevant context: time, agency name, official names if known',
            'Your description helps moderators quickly understand the incident',
          ],
        },
      ],
      what_happens_next: [
        '🎥 Camera window opens - you can record video or audio',
        '📤 Stream is saved securely to your account',
        '👀 Moderators review it within 24-48 hours',
        '✅ Approved streams are published with your consent',
        '🔒 Your identity is protected throughout the process',
      ],
      tips: [
        'Find a safe, quiet location to record',
        'Clearly show the incident from a safe distance',
        'Never endanger yourself - personal safety comes first',
        'Keep recording until the incident ends or 30 minutes max',
        'You can upload additional evidence files later',
      ],
      permissions: 'Requires camera or microphone access - allow when browser asks',
      safety: '⚠️ Never try to interfere or escalate the situation. Record safely and submit.',
    },
    watchLivestreams: {
      title: 'View Live Streams & Recordings',
      description: 'Watch real-time streams and verified recordings of incidents',
      features: [
        'Live indicator shows streams happening now',
        'Filter by incident type or location',
        'Verified badge shows moderation status',
        'Comments section for public discussion',
      ],
      how_to_search: 'Use filters or search to find streams about specific incidents',
    },
  },

  // Reporting
  reporting: {
    corruptionReport: {
      title: 'Report Corruption',
      description: 'Document cases of bribery, embezzlement, abuse of power, etc.',
      what_counts_as_corruption: [
        'Demanding payment for services you should get for free',
        'Demanding sexual favors in exchange for service',
        'Accepting bribes to ignore illegal activity',
        'Stealing public funds or resources',
        'Abuse of power to harm innocent people',
        'Nepotism or favoritism in hiring/promotions',
      ],
      how_to_report: [
        'Fill in what happened (date, location, people involved)',
        'Select the affected government office/agency',
        'Estimate amount of money involved (if applicable)',
        'Describe the impact on you and your community',
        'Add supporting evidence (documents, photos, videos)',
      ],
      best_practices: [
        'Be as specific as possible with dates and names',
        'Include who witnessed the incident',
        'Attach any documents proving what happened',
        'Explain why you believe this is corruption',
        'Stay factual - avoid assumptions or opinions',
      ],
      privacy: 'Your name is optional. You can submit anonymously.',
      what_happens: [
        '1. Moderators verify your report within 48 hours',
        '2. Verified reports are published (without identifying you)',
        '3. Public can verify the claim through the verification system',
        '4. High-confidence claims trigger official investigations',
        '5. You can track progress in your dashboard',
      ],
    },
    issueReporting: {
      title: 'Report Civic Issues',
      description: 'Report problems with public services: roads, water, electricity, healthcare, etc.',
      categories: [
        'Infrastructure (roads, bridges, public buildings)',
        'Utilities (water, electricity, waste management)',
        'Health Services (clinics, hospitals, health workers)',
        'Education (schools, teachers, learning materials)',
        'Public Safety (police, security, emergency services)',
      ],
      how_to_describe: 'Clearly state the problem, where you see it, and how it affects you',
      tracking: 'Projects are created automatically to track fixes - you can follow progress',
    },
  },

  // Evidence
  evidence: {
    submitEvidence: {
      title: 'Attach Evidence Files',
      description: 'Upload documents, photos, videos, or audio recordings',
      accepted_formats: {
        documents: 'PDF, Word, Excel, images (JPG, PNG)',
        media: 'MP4, MOV, MP3, WAV (videos/audio from phones)',
        size_limits: '50MB per file, 500MB total per report',
      },
      good_evidence: [
        'Photos or videos of what happened',
        'Official documents (receipts, contracts, licenses)',
        'Text messages, emails, screenshots',
        'Audio recordings of conversations',
        'Witness statements or official reports',
      ],
      tips: [
        'Multiple small files are better than one large file',
        'Include dates/timestamps in filenames',
        'Clearly label what each file shows',
        'Blur faces if protecting witness identities',
        'Remove metadata if you have privacy concerns',
      ],
      security: 'Files are encrypted and stored securely. Only authorized moderators can view.',
    },
    aiAnalysis: {
      title: 'AI Evidence Analysis',
      description: 'Get AI-powered insights about your evidence quality and content',
      what_it_does: [
        'Analyzes document clarity and readability',
        'Identifies key information in files',
        'Suggests what additional evidence might help',
        'Checks for completeness of your report',
      ],
      tips: 'AI suggestions are just recommendations - your evidence is the final say',
      privacy: 'Analysis happens server-side; files are never sent to external AI services',
    },
  },

  // Verification
  verification: {
    verifyClaimTitle: 'The Verification System',
    description: 'Help strengthen corruption claims by verifying facts and evidence',
    how_it_works: [
      'Read a claim someone submitted about corruption',
      'Review the evidence they provided',
      'Say whether you agree the claim is true',
      'Provide your confidence level (certainty percentage)',
      'Add notes explaining your decision',
    ],
    verification_levels: [
      { level: 'Strongly Agree (85-100%)', meaning: 'Very sure the claim is true' },
      { level: 'Tend to Agree (60-84%)', meaning: 'Likely true but some doubts' },
      {
        level: 'Neutral (40-59%)',
        meaning: 'Not enough evidence to decide either way',
      },
      {
        level: 'Tend to Disagree (15-39%)',
        meaning: 'Probably false but some supporting evidence',
      },
      { level: 'Strongly Disagree (0-14%)', meaning: 'Definitely false' },
    ],
    tips: [
      'Only verify claims in your area - you know best',
      'Use your personal knowledge and local news',
      'Explain why you agree or disagree',
      'Multiple verifications make claims stronger',
      'Your identity is protected',
    ],
    impact: 'High-confidence verified claims can trigger official investigations',
  },

  // Projects & Tracking
  projects: {
    createProject: {
      title: 'Create Public Projects',
      description: 'Start tracking public projects (infrastructure, programs, etc.) to monitor implementation',
      what_to_include: [
        'Project name and description',
        'Government office responsible',
        'Expected completion date',
        'Budget or scope (if known)',
        'Location or areas affected',
      ],
      how_citizens_help: 'Others can add milestones, report delays, and comment on progress',
    },
    trackMilestones: {
      title: 'Track Project Milestones',
      description: 'Monitor progress of public projects with citizen-generated updates',
      how_to_update: [
        'Add milestones showing project progress',
        'Include completion dates and status',
        'Attach photos or documents of completed work',
        'Comment on delays or issues',
      ],
      why_it_matters: 'Transparent tracking holds government accountable for promises',
    },
  },

  // Dashboard & Analytics
  dashboard: {
    myDashboard: {
      title: 'Your Personal Dashboard',
      description: 'Track all your reports, evidence, and impact in one place',
      sections: [
        {
          name: 'Open Reports',
          meaning: 'Reports you submitted that are being reviewed or investigated',
        },
        {
          name: 'Projects Tracked',
          meaning: 'Public projects you are following for updates',
        },
        {
          name: 'Verified Claims',
          meaning: 'How many times your reports have been confirmed',
        },
        {
          name: 'Avg Confidence Score',
          meaning: 'Overall trust score from public verifications',
        },
      ],
      quick_actions:
        'Use the buttons to quickly submit new reports or track projects',
    },
    analytics: {
      title: 'Analytics & Public Data',
      description: 'See corruption trends, statistics, and district comparisons',
      what_you_can_see: [
        'How many reports by type (embezzlement, bribery, etc)',
        'Which offices have most complaints',
        'Verification rates (how many claims are confirmed)',
        'Geographic hotspots of corruption',
        'Timeline of incidents',
      ],
      how_to_use: 'Filter by date range, office type, or incident category',
      why_it_matters:
        'Public data shows where problems are biggest and helps direct reform efforts',
    },
  },

  // Admin Features
  admin: {
    moderation: {
      title: 'Moderation Queue',
      description: 'Review and approve/reject user submissions (reports, evidence, verifications)',
      your_role: [
        'Ensure reports follow community standards',
        'Verify evidence quality',
        'Check verification submissions for quality',
        'Protect against fraud or false claims',
      ],
      approval_process: [
        'Review submission details',
        'Check supporting evidence',
        'Verify facts if possible',
        'Approve or reject with explanation',
        'Send notification to user',
      ],
      tips: [
        'Give constructive feedback when rejecting',
        'Ask users for more info if needed',
        'Escalate serious allegations to authorities',
        'Protect identities of whistleblowers',
      ],
    },
    userManagement: {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      user_roles: [
        {
          role: 'Citizen',
          permissions: 'Submit reports, verify claims, track projects',
        },
        {
          role: 'Moderator',
          permissions: 'Review submissions, approve/reject content',
        },
        { role: 'Admin', permissions: 'Full system access, manage users, view analytics' },
      ],
    },
  },

  // General Tips
  getting_started: {
    step1_account: {
      title: 'Step 1: Create Your Account',
      description: 'Sign up to start reporting and tracking',
      time: '2 minutes',
    },
    step2_report: {
      title: 'Step 2: Submit Your First Report',
      description: 'Share a corruption incident or civic issue you know about',
      time: '10 minutes',
    },
    step3_verify: {
      title: 'Step 3: Help Verify Others',
      description: 'Strengthen claims in your community by verifying them',
      time: '5 minutes per verification',
    },
    step4_track: {
      title: 'Step 4: Track Projects',
      description: 'Start following public projects to monitor accountability',
      time: '5 minutes',
    },
  },

  safety_and_privacy: {
    protecting_yourself: [
      '🔒 Never record in dangerous situations - your safety is paramount',
      '📵 Turn off location services before recording if you want anonymity',
      '🔐 Use a strong unique password (not your birthday, phone number, etc)',
      '🕵️ Consider reporting anonymously for sensitive cases',
      '📱 Keep your account login secure - never share your password',
    ],
    your_data: [
      'Data is encrypted in transit and at rest',
      'Only authorized staff can view your personal information',
      'You can request data deletion anytime',
      'We never sell or share your data with advertisers',
      'Deleted files are permanently removed',
    ],
    legal: [
      'Reporting truthfully is protected legal activity in most countries',
      'Document facts clearly - avoid accusations without evidence',
      'Check local laws about recording conversations',
      'Consult a lawyer if you face retaliation',
    ],
  },

  faqs: [
    {
      q: 'Is my reporting anonymous?',
      a: 'Partially. You can omit your name, but your account has an ID. Your personal details are never published.',
    },
    {
      q: 'What happens after I submit a report?',
      a: 'Moderators verify it within 48 hours, then it goes public. High-confidence verified claims can trigger official investigations.',
    },
    {
      q: 'Can I edit my report after submission?',
      a: 'Yes, you can add more evidence or update status. Core details cannot be changed.',
    },
    {
      q: 'What if someone verifies my claim as false?',
      a: 'That lowers your confidence score. You can respond in comments to address their concerns.',
    },
    {
      q: 'How do I track progress on my report?',
      a: 'Go to your Dashboard - you can see status, verification count, and comments in real-time.',
    },
    {
      q: 'Can I report threats or retaliation?',
      a: 'Yes, contact our support team immediately with details. We take security seriously.',
    },
    {
      q: 'How are live streams moderated?',
      a: 'Before publishing, we verify the stream is legitimate and follows guidelines. Users cannot edit published streams.',
    },
    {
      q: 'What file formats do you accept?',
      a: 'PDFs, images (JPG/PNG), videos (MP4/MOV), audio (MP3/WAV), and documents.',
    },
  ],
}

// Help metadata for quick lookup
export const featureHelpMap = {
  '/signup': helpContent.auth.signup,
  '/login': helpContent.auth.login,
  '/livestreams': helpContent.livestream.watchLivestreams,
  '/report-corruption': helpContent.reporting.corruptionReport,
  '/report-issue': helpContent.reporting.issueReporting,
  '/verify': helpContent.verification,
  '/projects': helpContent.projects.createProject,
  '/track-projects': helpContent.projects.trackMilestones,
  '/': helpContent.getting_started,
  '/dashboard': helpContent.dashboard.myDashboard,
  '/admin': helpContent.admin.moderation,
}
