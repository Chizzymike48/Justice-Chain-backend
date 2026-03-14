import { Evidence } from '../models/Evidence'
import { Petition } from '../models/Petition'
import { Project } from '../models/Project'
import { Report } from '../models/Report'
import { Verification } from '../models/Verification'

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export type ChatLanguage = 'en' | 'pidgin' | 'hausa' | 'yoruba' | 'igbo'

const SUPPORTED_LANGUAGES: ChatLanguage[] = ['en', 'pidgin', 'hausa', 'yoruba', 'igbo']
const LANGUAGE_ALIASES: Record<string, ChatLanguage> = {
  ha: 'hausa',
  yo: 'yoruba',
  ig: 'igbo',
}

export const normalizeChatLanguage = (value?: string): ChatLanguage => {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return 'en'
  }

  const canonical = LANGUAGE_ALIASES[normalized] ?? (normalized as ChatLanguage)
  return SUPPORTED_LANGUAGES.includes(canonical) ? canonical : 'en'
}

interface ChatAssistantMetrics {
  reports: number
  projects: number
  verifications: number
  evidence: number
  petitions: number
}

interface ChatAssistantResult {
  reply: string
  suggestions: string[]
  metrics: ChatAssistantMetrics
  provider: 'openai' | 'fallback'
}

interface LiveSnapshot {
  metrics: ChatAssistantMetrics
  latestProjectTitle: string
  latestProjectStatus: string
  latestProjectProgress: number
  latestReportTitle: string
  latestReportCategory: string
  latestVerificationClaim: string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'

const localizedSuggestions: Record<ChatLanguage, string[]> = {
  en: [
    'How do I report corruption?',
    'Start corruption report',
    'Start civic issue report',
    'Show me project status updates',
    'How many claims are verified?',
  ],
  pidgin: [
    'How I fit report corruption?',
    'Start corruption report',
    'Start civic issue report',
    'Show project status updates',
    'How many claims don verify?',
  ],
  hausa: [
    'Ta yaya zan shigar da rahoton cin hanci?',
    'Fara rahoton cin hanci',
    'Fara rahoton matsalar al umma',
    'Nuna min matsayin project',
    'Nawa aka tabbatar daga claims?',
  ],
  yoruba: [
    'Bawo ni mo se le fi report corruption ranse?',
    'Bere corruption report',
    'Bere civic issue report',
    'Fi ipo project han mi',
    'Melo ni claims ti a ti verify?',
  ],
  igbo: [
    'Kedu ka m ga esi zipu report corruption?',
    'Bido corruption report',
    'Bido civic issue report',
    'Gosi m update project status',
    'Claims olee ka a verifyla?',
  ],
}

const languageNames: Record<ChatLanguage, string> = {
  en: 'English',
  pidgin: 'Nigerian Pidgin',
  hausa: 'Hausa',
  yoruba: 'Yoruba',
  igbo: 'Igbo',
}

interface FallbackLanguagePack {
  reportWithData: (snapshot: LiveSnapshot) => string
  reportEmpty: string
  projectWithData: (snapshot: LiveSnapshot) => string
  projectEmpty: string
  verificationWithData: (snapshot: LiveSnapshot) => string
  verificationEmpty: string
  petitionWithData: (snapshot: LiveSnapshot) => string
  petitionEmpty: string
  evidenceWithData: (snapshot: LiveSnapshot) => string
  evidenceEmpty: string
  activity: (snapshot: LiveSnapshot) => string
}

const fallbackLanguagePacks: Record<ChatLanguage, FallbackLanguagePack> = {
  en: {
    reportWithData: (snapshot) =>
      `There are ${snapshot.metrics.reports} submitted reports. Latest: "${snapshot.latestReportTitle}" in category "${snapshot.latestReportCategory}".`,
    reportEmpty:
      'No reports are in the system yet. You can submit one from the Report Corruption or Report Issue page.',
    projectWithData: (snapshot) =>
      `There are ${snapshot.metrics.projects} tracked projects. Latest: "${snapshot.latestProjectTitle}" with progress ${snapshot.latestProjectProgress}% and status "${snapshot.latestProjectStatus}".`,
    projectEmpty:
      'No projects are tracked yet. Add a project on the Projects page to start monitoring milestones.',
    verificationWithData: (snapshot) =>
      `There are ${snapshot.metrics.verifications} verification requests. Latest claim: "${snapshot.latestVerificationClaim}".`,
    verificationEmpty:
      'No verification requests exist yet. Submit a claim on the Verification page to start.',
    petitionWithData: (snapshot) =>
      `There are ${snapshot.metrics.petitions} petitions currently tracked. You can create or sign petitions from the Petitions page.`,
    petitionEmpty:
      'No petitions exist yet. Create one from the Petitions page and citizens can start signing.',
    evidenceWithData: (snapshot) =>
      `There are ${snapshot.metrics.evidence} evidence submissions in storage. Use Evidence Upload to add more records.`,
    evidenceEmpty:
      'No evidence has been uploaded yet. Use the Evidence Upload page to attach files to a case.',
    activity: (snapshot) =>
      `Current activity: ${snapshot.metrics.reports} reports, ${snapshot.metrics.projects} projects, ${snapshot.metrics.verifications} verifications, ${snapshot.metrics.evidence} evidence items, and ${snapshot.metrics.petitions} petitions.`,
  },
  pidgin: {
    reportWithData: (snapshot) =>
      `Reports wey don enter na ${snapshot.metrics.reports}. Latest na "${snapshot.latestReportTitle}" for category "${snapshot.latestReportCategory}".`,
    reportEmpty:
      'No report dey system yet. You fit submit one from Report Corruption or Report Issue page.',
    projectWithData: (snapshot) =>
      `Projects wey dey tracked na ${snapshot.metrics.projects}. Latest na "${snapshot.latestProjectTitle}" progress ${snapshot.latestProjectProgress}% status "${snapshot.latestProjectStatus}".`,
    projectEmpty:
      'No project dey tracked yet. Add project for Projects page to start monitoring.',
    verificationWithData: (snapshot) =>
      `Verification requests wey dey na ${snapshot.metrics.verifications}. Latest claim na "${snapshot.latestVerificationClaim}".`,
    verificationEmpty:
      'No verification request yet. Submit claim for Verification page to start.',
    petitionWithData: (snapshot) =>
      `Petitions wey dey tracked now na ${snapshot.metrics.petitions}. You fit create or sign for Petitions page.`,
    petitionEmpty:
      'No petition yet. Create one for Petitions page make people fit sign.',
    evidenceWithData: (snapshot) =>
      `Evidence submissions wey dey storage na ${snapshot.metrics.evidence}. Use Evidence Upload to add more.`,
    evidenceEmpty:
      'No evidence don upload yet. Use Evidence Upload page to attach files for case.',
    activity: (snapshot) =>
      `Current activity: ${snapshot.metrics.reports} reports, ${snapshot.metrics.projects} projects, ${snapshot.metrics.verifications} verifications, ${snapshot.metrics.evidence} evidence items, and ${snapshot.metrics.petitions} petitions.`,
  },
  hausa: {
    reportWithData: (snapshot) =>
      `Akwai rahotanni ${snapshot.metrics.reports} da aka shigar. Sabon rahoto: "${snapshot.latestReportTitle}" a bangaren "${snapshot.latestReportCategory}".`,
    reportEmpty:
      'Babu rahoto a tsarin yanzu. Za ka iya shigar da rahoto daga shafin Report Corruption ko Report Issue.',
    projectWithData: (snapshot) =>
      `Akwai projects ${snapshot.metrics.projects} da ake bibiya. Na baya-bayan nan: "${snapshot.latestProjectTitle}" progress ${snapshot.latestProjectProgress}% status "${snapshot.latestProjectStatus}".`,
    projectEmpty:
      'Babu project da ake bibiya yanzu. Kara project a shafin Projects domin sa ido kan milestones.',
    verificationWithData: (snapshot) =>
      `Akwai bukatun verification ${snapshot.metrics.verifications}. Sabon claim: "${snapshot.latestVerificationClaim}".`,
    verificationEmpty:
      'Babu verification request yanzu. Shigar da claim a shafin Verification.',
    petitionWithData: (snapshot) =>
      `Akwai petitions ${snapshot.metrics.petitions} da ake bibiya. Za ka iya kirkira ko sa hannu a shafin Petitions.`,
    petitionEmpty:
      'Babu petition yanzu. Kirkiri daya a shafin Petitions domin mutane su sa hannu.',
    evidenceWithData: (snapshot) =>
      `Akwai evidence ${snapshot.metrics.evidence} a storage. Yi amfani da Evidence Upload don kara hujjoji.`,
    evidenceEmpty:
      'Babu evidence da aka loda yanzu. Yi amfani da shafin Evidence Upload don hada fayil da case.',
    activity: (snapshot) =>
      `Ayyuka yanzu: rahotanni ${snapshot.metrics.reports}, projects ${snapshot.metrics.projects}, verifications ${snapshot.metrics.verifications}, evidence ${snapshot.metrics.evidence}, petitions ${snapshot.metrics.petitions}.`,
  },
  yoruba: {
    reportWithData: (snapshot) =>
      `Report to wa ninu eto je ${snapshot.metrics.reports}. Eyi to kẹhin ni "${snapshot.latestReportTitle}" ninu category "${snapshot.latestReportCategory}".`,
    reportEmpty:
      'Ko si report ninu eto sibesibe. O le fi report ranse lori oju iwe Report Corruption tabi Report Issue.',
    projectWithData: (snapshot) =>
      `Project ti a n tele je ${snapshot.metrics.projects}. Eyi to kẹhin ni "${snapshot.latestProjectTitle}" pelu progress ${snapshot.latestProjectProgress}% ati status "${snapshot.latestProjectStatus}".`,
    projectEmpty:
      'Ko si project ti a n tele sibesibe. Fi project kun lori oju iwe Projects lati bere monitoring milestones.',
    verificationWithData: (snapshot) =>
      `Verification requests je ${snapshot.metrics.verifications}. Claim to kẹhin ni "${snapshot.latestVerificationClaim}".`,
    verificationEmpty:
      'Ko si verification request sibesibe. Fi claim ranse lori oju iwe Verification.',
    petitionWithData: (snapshot) =>
      `Petitions ti a n tele je ${snapshot.metrics.petitions}. O le da petition sile tabi fi ibo sile lori oju iwe Petitions.`,
    petitionEmpty:
      'Ko si petition sibesibe. Da petition kan sile lori oju iwe Petitions ki awon ara ilu le fowo si i.',
    evidenceWithData: (snapshot) =>
      `Evidence submissions to wa ni storage je ${snapshot.metrics.evidence}. Lo Evidence Upload lati fi awon records kun un.`,
    evidenceEmpty:
      'Ko si evidence ti a ti upload sibesibe. Lo oju iwe Evidence Upload lati so files mo case.',
    activity: (snapshot) =>
      `Ise to n lo bayii: reports ${snapshot.metrics.reports}, projects ${snapshot.metrics.projects}, verifications ${snapshot.metrics.verifications}, evidence ${snapshot.metrics.evidence}, petitions ${snapshot.metrics.petitions}.`,
  },
  igbo: {
    reportWithData: (snapshot) =>
      `Reports di na system bu ${snapshot.metrics.reports}. Nke kacha ohuru bu "${snapshot.latestReportTitle}" na category "${snapshot.latestReportCategory}".`,
    reportEmpty:
      'Enweghi report na system ugbu a. I nwere ike izipu otu site na peeji Report Corruption ma obu Report Issue.',
    projectWithData: (snapshot) =>
      `Projects a na eso bu ${snapshot.metrics.projects}. Nke kacha ohuru bu "${snapshot.latestProjectTitle}" nwere progress ${snapshot.latestProjectProgress}% na status "${snapshot.latestProjectStatus}".`,
    projectEmpty:
      'Enweghi project a na eso ugbu a. Tinye project na peeji Projects ka i malite ile milestones.',
    verificationWithData: (snapshot) =>
      `Verification requests bu ${snapshot.metrics.verifications}. Claim kacha ohuru bu "${snapshot.latestVerificationClaim}".`,
    verificationEmpty:
      'Enweghi verification request ugbu a. Zipu claim na peeji Verification.',
    petitionWithData: (snapshot) =>
      `Petitions a na eso bu ${snapshot.metrics.petitions}. I nwere ike ime petition ohuru ma obu bia sign na peeji Petitions.`,
    petitionEmpty:
      'Enweghi petition ugbu a. Mepụta otu na peeji Petitions ka umu amaala wee bido isonye.',
    evidenceWithData: (snapshot) =>
      `Evidence submissions di na storage bu ${snapshot.metrics.evidence}. Jiri Evidence Upload tinye records ndi ozo.`,
    evidenceEmpty:
      'Enweghi evidence ebugoro ugbu a. Jiri peeji Evidence Upload jikota files na case.',
    activity: (snapshot) =>
      `Ugbu a: reports ${snapshot.metrics.reports}, projects ${snapshot.metrics.projects}, verifications ${snapshot.metrics.verifications}, evidence ${snapshot.metrics.evidence}, petitions ${snapshot.metrics.petitions}.`,
  },
}

const includesAny = (text: string, keywords: string[]): boolean => keywords.some((keyword) => text.includes(keyword))

const buildFallbackReply = (message: string, snapshot: LiveSnapshot, language: ChatLanguage): string => {
  const normalized = message.trim().toLowerCase()
  const languagePack = fallbackLanguagePacks[language]

  if (includesAny(normalized, ['report', 'issue', 'corruption', 'rahoto', 'matsala', 'cin hanci', 'ibaje', 'nsogbu'])) {
    return snapshot.metrics.reports > 0
      ? languagePack.reportWithData(snapshot)
      : languagePack.reportEmpty
  }

  if (includesAny(normalized, ['project', 'track', 'aikin', 'ise agbese', 'oru ngo', 'follow project'])) {
    return snapshot.metrics.projects > 0
      ? languagePack.projectWithData(snapshot)
      : languagePack.projectEmpty
  }

  if (includesAny(normalized, ['verify', 'claim', 'fact', 'tabbatar', 'ayewo', 'nyochaa', 'gaskiya'])) {
    return snapshot.metrics.verifications > 0
      ? languagePack.verificationWithData(snapshot)
      : languagePack.verificationEmpty
  }

  if (includesAny(normalized, ['petition', 'poll', 'vote', 'ibo', 'kuri', 'akwukwo aririo'])) {
    return snapshot.metrics.petitions > 0
      ? languagePack.petitionWithData(snapshot)
      : languagePack.petitionEmpty
  }

  if (includesAny(normalized, ['evidence', 'hujja', 'eri', 'akaebe', 'proof'])) {
    return snapshot.metrics.evidence > 0
      ? languagePack.evidenceWithData(snapshot)
      : languagePack.evidenceEmpty
  }

  return languagePack.activity(snapshot)
}

const getLiveSnapshot = async (): Promise<LiveSnapshot> => {
  const [reportsCount, projectsCount, verificationsCount, evidenceCount, petitionsCount, recentProject, recentReport, recentVerification] = await Promise.all([
    Report.countDocuments(),
    Project.countDocuments(),
    Verification.countDocuments(),
    Evidence.countDocuments(),
    Petition.countDocuments(),
    Project.findOne().sort({ createdAt: -1 }),
    Report.findOne().sort({ createdAt: -1 }),
    Verification.findOne().sort({ createdAt: -1 }),
  ])

  return {
    metrics: {
      reports: reportsCount,
      projects: projectsCount,
      verifications: verificationsCount,
      evidence: evidenceCount,
      petitions: petitionsCount,
    },
    latestProjectTitle: recentProject?.title || 'none',
    latestProjectStatus: recentProject?.status || 'pending',
    latestProjectProgress: recentProject?.progress || 0,
    latestReportTitle: recentReport?.title || 'none',
    latestReportCategory: recentReport?.category || 'unknown',
    latestVerificationClaim: recentVerification?.claim || 'none',
  }
}

const buildGroundingContext = (snapshot: LiveSnapshot): string => {
  return [
    `Reports: ${snapshot.metrics.reports}. Latest report: "${snapshot.latestReportTitle}" (${snapshot.latestReportCategory}).`,
    `Projects: ${snapshot.metrics.projects}. Latest project: "${snapshot.latestProjectTitle}" status=${snapshot.latestProjectStatus} progress=${snapshot.latestProjectProgress}%.`,
    `Verifications: ${snapshot.metrics.verifications}. Latest claim: "${snapshot.latestVerificationClaim}".`,
    `Evidence items: ${snapshot.metrics.evidence}.`,
    `Petitions: ${snapshot.metrics.petitions}.`,
  ].join('\n')
}

const sanitizeHistory = (history: ChatTurn[]): ChatTurn[] => {
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
    .map((item) => ({ role: item.role, text: item.text.trim() }))
    .filter((item) => item.text.length > 0)
    .slice(-8)
}

const requestOpenAIResponse = async (
  message: string,
  history: ChatTurn[],
  context: string,
  preferredLanguage: ChatLanguage,
): Promise<string | null> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return null
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)

  const messages = [
    {
      role: 'system',
      content:
        'You are JusticeChain Assistant. Only use the provided live platform context when answering data questions. If data is unavailable, say so clearly and direct users to the correct page.',
    },
    {
      role: 'system',
      content: `Preferred response language: ${languageNames[preferredLanguage]} (${preferredLanguage}).`,
    },
    {
      role: 'system',
      content:
        'Keep answers short and practical. If the user asks to file a civic or corruption report, tell them to continue in the chat flow and what details are needed.',
    },
    {
      role: 'system',
      content: `Live platform context:\n${context}`,
    },
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.text,
    })),
    {
      role: 'user',
      content: message,
    },
  ]

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 280,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content?.trim()
    return content || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export const generateAssistantResponse = async (
  message: string,
  history: ChatTurn[] = [],
  preferredLanguage: ChatLanguage = 'en',
): Promise<ChatAssistantResult> => {
  const language = normalizeChatLanguage(preferredLanguage)
  const snapshot = await getLiveSnapshot()
  const safeHistory = sanitizeHistory(history)
  const context = buildGroundingContext(snapshot)
  const modelReply = await requestOpenAIResponse(message, safeHistory, context, language)

  return {
    reply: modelReply || buildFallbackReply(message, snapshot, language),
    suggestions: localizedSuggestions[language],
    metrics: snapshot.metrics,
    provider: modelReply ? 'openai' : 'fallback',
  }
}
