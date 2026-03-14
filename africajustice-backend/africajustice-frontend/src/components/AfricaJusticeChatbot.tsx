import { FC, FormEvent, useMemo, useState } from 'react'
import reportService from '../services/reportService'
import { ChatbotHistoryTurn, ChatbotMetrics } from '../services/chatbotService'
import chatbotClient from '../utils/chatbotClient'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

type ReportKind = 'corruption' | 'civic'
type ReportStep = 'idle' | 'kind' | 'title' | 'description' | 'office' | 'amount' | 'confirm'
type ChatLanguage = 'en' | 'pidgin' | 'hausa' | 'yoruba' | 'igbo'

interface ReportDraft {
  kind?: ReportKind
  title: string
  description: string
  office: string
  amount: string
}

interface PromptPack {
  welcome: string
  askType: string
  chooseTypeInvalid: string
  titleStep: string
  titleTooShort: string
  descriptionStep: string
  descriptionTooShort: string
  officeStep: string
  officeTooShort: string
  amountStep: string
  amountInvalid: string
  confirmChoice: string
  cancelled: string
  missingType: string
  invalidAmountSubmit: string
  submitFailed: string
  restartHint: string
  placeholderIdle: string
  placeholderStep: string
  languageSwitched: (languageName: string) => string
  startKind: (kindLabel: string) => string
  reviewCivic: (draft: ReportDraft) => string
  reviewCorruption: (draft: ReportDraft) => string
  submitSuccess: (id: string) => string
}

const emptyDraft: ReportDraft = {
  kind: undefined,
  title: '',
  description: '',
  office: '',
  amount: '',
}

const languageNames: Record<ChatLanguage, string> = {
  en: 'English',
  pidgin: 'Pidgin',
  hausa: 'Hausa',
  yoruba: 'Yoruba',
  igbo: 'Igbo',
}

const kindLabels: Record<ChatLanguage, Record<ReportKind, string>> = {
  en: { corruption: 'Corruption', civic: 'Civic Issue' },
  pidgin: { corruption: 'Corruption', civic: 'Civic Issue' },
  hausa: { corruption: 'Cin hanci', civic: "Matsalar al'umma" },
  yoruba: { corruption: 'Ibaje', civic: "Isoro agbegbe" },
  igbo: { corruption: 'Nnupu isi', civic: "Nsogbu obodo" },
}

const prompts: Record<ChatLanguage, PromptPack> = {
  en: {
    welcome: 'Ask me anything about reports, projects, verification, petitions, or evidence activity.',
    askType: 'I can file this for you now. Step 1/5: choose report type. Reply 1 for Corruption, 2 for Civic Issue.',
    chooseTypeInvalid: 'Please reply 1 for Corruption or 2 for Civic Issue.',
    titleStep: 'Step 2: Give a short title for this report.',
    titleTooShort: 'Title is too short. Please provide a more descriptive title.',
    descriptionStep: 'Step 3: Describe what happened (where, when, who, and what happened). You can answer in any language.',
    descriptionTooShort: 'Please provide a fuller description so the case can be reviewed.',
    officeStep: 'Step 4: Which office, agency, or official is involved?',
    officeTooShort: 'Please provide the agency/office name.',
    amountStep: 'Step 5: Estimated amount involved? Reply with number, or type "skip".',
    amountInvalid: 'Please use numbers only for amount, or type "skip".',
    confirmChoice: 'Reply 1 to submit or 2 to cancel.',
    cancelled: 'Report flow cancelled.',
    missingType: 'Report type is missing. Let us restart.',
    invalidAmountSubmit: 'Estimated amount is invalid. Please restart and use numbers only.',
    submitFailed: 'I could not submit this report now. Please try again shortly.',
    restartHint: 'Submission cancelled. If you want to start again, say "report issue".',
    placeholderIdle: 'Ask a question...',
    placeholderStep: 'Answer the current report step...',
    languageSwitched: (name: string) => `Language switched to ${name}.`,
    startKind: (kind: string) => `Starting ${kind} report. Step 1/4: Give a short title for this report. Type "cancel" anytime.`,
    reviewCivic: (draft: ReportDraft) =>
      `Review:\nType: Civic Issue\nTitle: ${draft.title}\nDescription: ${draft.description}\nReply 1 to submit or 2 to cancel.`,
    reviewCorruption: (draft: ReportDraft) =>
      `Review:\nType: Corruption\nTitle: ${draft.title}\nOffice: ${draft.office}\nAmount: ${draft.amount || 'Not provided'}\nDescription: ${draft.description}\nReply 1 to submit or 2 to cancel.`,
    submitSuccess: (id: string) => `Report submitted successfully. Report ID: ${id}. You can upload supporting files in Evidence Upload.`,
  },
  pidgin: {
    welcome: 'Ask me anything about report, project, verification, petition, or evidence wey dey system.',
    askType: 'I fit help you file report now. Step 1/5: choose type. Reply 1 for Corruption, 2 for Civic Issue.',
    chooseTypeInvalid: 'Abeg reply 1 for Corruption or 2 for Civic Issue.',
    titleStep: 'Step 2: Drop short title for this report.',
    titleTooShort: 'Title too short. Abeg add better title.',
    descriptionStep: 'Step 3: Explain wetin happen (where, when, who, and wetin happen). You fit talk any language.',
    descriptionTooShort: 'Abeg add more details make review fit happen.',
    officeStep: 'Step 4: Which office, agency, or official involve?',
    officeTooShort: 'Abeg provide office or agency name.',
    amountStep: 'Step 5: Any estimated amount involve? Put number or type "skip".',
    amountInvalid: 'Use number only for amount, or type "skip".',
    confirmChoice: 'Reply 1 to submit or 2 to cancel.',
    cancelled: 'Report flow don cancel.',
    missingType: 'Report type no complete. Make we restart.',
    invalidAmountSubmit: 'Amount no valid. Restart and use number only.',
    submitFailed: 'I no fit submit this report now. Try again shortly.',
    restartHint: 'Submission cancel. If you wan start again, type "report issue".',
    placeholderIdle: 'Ask question...',
    placeholderStep: 'Answer this report step...',
    languageSwitched: (name: string) => `I don switch language to ${name}.`,
    startKind: (kind: string) => `We don start ${kind} report. Step 1/4: Give short title. Type "cancel" anytime.`,
    reviewCivic: (draft: ReportDraft) =>
      `Check am:\nType: Civic Issue\nTitle: ${draft.title}\nDescription: ${draft.description}\nReply 1 to submit or 2 to cancel.`,
    reviewCorruption: (draft: ReportDraft) =>
      `Check am:\nType: Corruption\nTitle: ${draft.title}\nOffice: ${draft.office}\nAmount: ${draft.amount || 'No amount'}\nDescription: ${draft.description}\nReply 1 to submit or 2 to cancel.`,
    submitSuccess: (id: string) => `Report don submit well. Report ID: ${id}. You fit upload evidence for Evidence Upload.`,
  },
  hausa: {
    welcome: 'Ka tambaye ni game da rahoto, project, verification, petition, ko evidence a tsarin.',
    askType: 'Zan taimaka ka shigar da rahoto yanzu. Mataki 1/5: zabi naui. Amsa 1 don cin hanci, 2 don matsalar al umma.',
    chooseTypeInvalid: 'Da fatan a amsa 1 don cin hanci ko 2 don matsalar al umma.',
    titleStep: 'Mataki 2: Rubuta takaitaccen taken rahoton.',
    titleTooShort: 'Taken ya yi gajarta. Ka kara bayani a taken.',
    descriptionStep: 'Mataki 3: Bayyana abin da ya faru (inda, yaushe, wa, da me ya faru). Za ka iya amfani da kowane harshe.',
    descriptionTooShort: 'Da fatan ka kara cikakken bayani domin a duba lamarin.',
    officeStep: 'Mataki 4: Wane ofis, hukuma, ko jami i ne ya shafa?',
    officeTooShort: 'Da fatan ka saka sunan ofis ko hukuma.',
    amountStep: 'Mataki 5: Akwai kimanin kudi? Saka lamba ko rubuta "skip".',
    amountInvalid: 'Da fatan ka yi amfani da lamba kawai ko "skip".',
    confirmChoice: 'Amsa 1 don turawa ko 2 don soke wa.',
    cancelled: 'An soke tsarin rahoto.',
    missingType: 'Nauin rahoto bai cika ba. Mu sake farawa.',
    invalidAmountSubmit: 'Kimanin kudi bai dace ba. A sake farawa da lamba kawai.',
    submitFailed: 'Ba a iya tura rahoton yanzu ba. A sake gwadawa nan gaba kadan.',
    restartHint: 'An soke turawa. Idan kana so ka sake farawa, ka ce "report issue".',
    placeholderIdle: 'Rubuta tambaya...',
    placeholderStep: 'Amsa matakin rahoto...',
    languageSwitched: (name: string) => `An sauya harshe zuwa ${name}.`,
    startKind: (kind: string) => `An fara rahoton ${kind}. Mataki 1/4: Rubuta gajeren take. Rubuta "cancel" idan kana son tsayawa.`,
    reviewCivic: (draft: ReportDraft) =>
      `Dubawa:\nNaui: Matsalar al umma\nTake: ${draft.title}\nBayani: ${draft.description}\nAmsa 1 don turawa ko 2 don soke wa.`,
    reviewCorruption: (draft: ReportDraft) =>
      `Dubawa:\nNaui: Cin hanci\nTake: ${draft.title}\nOfis: ${draft.office}\nKudi: ${draft.amount || 'Ba a bayar ba'}\nBayani: ${draft.description}\nAmsa 1 don turawa ko 2 don soke wa.`,
    submitSuccess: (id: string) => `An tura rahoto cikin nasara. Report ID: ${id}. Za ka iya saka hujja a Evidence Upload.`,
  },
  yoruba: {
    welcome: 'Beere lowo mi nipa report, project, verification, petition, tabi evidence to wa ninu eto.',
    askType: 'Mo le ran e lowo lati fi report ranse bayii. Igbese 1/5: yan iru report. Dahun 1 fun corruption, 2 fun civic issue.',
    chooseTypeInvalid: 'Jowo dahun 1 fun corruption tabi 2 fun civic issue.',
    titleStep: 'Igbese 2: Fun report yi ni akole kukuru.',
    titleTooShort: 'Akole kuru ju. Jowo fi akole to ye kun un.',
    descriptionStep: 'Igbese 3: So ohun to sele (ibo, nigbawo, tani, ati ohun to sele). O le lo ede eyikeyi.',
    descriptionTooShort: 'Jowo fi alaye to kun kun le e lori ki ayewo le waye.',
    officeStep: 'Igbese 4: Ofisi, agency, tabi official wo lo kan?',
    officeTooShort: 'Jowo ko oruko ofisi tabi agency sii.',
    amountStep: 'Igbese 5: Isiro iye owo to kan? Te nomba tabi ko "skip".',
    amountInvalid: 'Fun iye owo, lo nomba nikan tabi "skip".',
    confirmChoice: 'Dahun 1 lati fi ranse tabi 2 lati fagile.',
    cancelled: 'A ti fagile ilana report.',
    missingType: 'Iru report ko pe. E je ka bere lati ibere.',
    invalidAmountSubmit: 'Iye owo ko pe. Bere tuntun ki o si lo nomba nikan.',
    submitFailed: 'Mi o le fi report yi ranse bayii. Gbiyanju leyin die.',
    restartHint: 'A ti fagile ifisile. Ti o ba fe bere mo, so "report issue".',
    placeholderIdle: 'Beere ibeere...',
    placeholderStep: 'Dahun igbese report yii...',
    languageSwitched: (name: string) => `A ti yi ede pada si ${name}.`,
    startKind: (kind: string) => `A ti bere ${kind} report. Igbese 1/4: Fun ni akole kukuru. Ko "cancel" nigbakugba.`,
    reviewCivic: (draft: ReportDraft) =>
      `Ayewo:\nIru: Civic Issue\nAkole: ${draft.title}\nAlaye: ${draft.description}\nDahun 1 lati fi ranse tabi 2 lati fagile.`,
    reviewCorruption: (draft: ReportDraft) =>
      `Ayewo:\nIru: Corruption\nAkole: ${draft.title}\nOfisi: ${draft.office}\nIye owo: ${draft.amount || 'Ko si'}\nAlaye: ${draft.description}\nDahun 1 lati fi ranse tabi 2 lati fagile.`,
    submitSuccess: (id: string) => `A fi report ranse ni aseyori. Report ID: ${id}. O le fi eri kun un ni Evidence Upload.`,
  },
  igbo: {
    welcome: 'Juo m ihe gbasara report, project, verification, petition, ma obu evidence di na system.',
    askType: 'Enwere m ike inyere gi tinye report ugbu a. Nzo 1/5: h?ta udi report. Zaa 1 maka corruption, 2 maka civic issue.',
    chooseTypeInvalid: 'Biko zaa 1 maka corruption ma obu 2 maka civic issue.',
    titleStep: 'Nzo 2: Nye report a isiokwu mkpirikpi.',
    titleTooShort: 'Isiokwu di mkpirikpi. Biko tinye isiokwu zuru oke.',
    descriptionStep: 'Nzo 3: Kowa ihe mere (ebe, oge, onye, na ihe mere). I nwere ike iji asusu obula.',
    descriptionTooShort: 'Biko tinye nkowa zuru oke ka a nwee ike nyochaa ya.',
    officeStep: 'Nzo 4: Ofis, agency, ma obu official onye metutara ya?',
    officeTooShort: 'Biko tinye aha ofis ma obu agency.',
    amountStep: 'Nzo 5: Ego a na atule? Tinye nomba ma obu dee "skip".',
    amountInvalid: 'Biko jiri nomba maka ego ma obu dee "skip".',
    confirmChoice: 'Zaa 1 ka i zipu ma obu 2 ka i kagbuo.',
    cancelled: 'A kagbuola usoro report.',
    missingType: 'Udi report adighi. Ka anyi malite ozo.',
    invalidAmountSubmit: 'Ego adighi ziri ezi. Bido ozo ma jiri nomba.',
    submitFailed: 'Enweghi m ike izipu report a ugbu a. Gbalia ozo obere oge.',
    restartHint: 'E kagbuola izipu. O buru na ichoro ime ozo, kwuo "report issue".',
    placeholderIdle: 'Juo aj?j?...',
    placeholderStep: 'Zaa nzo report a...',
    languageSwitched: (name: string) => `Asusu agbanweela gaa ${name}.`,
    startKind: (kind: string) => `Anyi amalitela ${kind} report. Nzo 1/4: Nye isiokwu mkpirikpi. Dee "cancel" mgbe obula.`,
    reviewCivic: (draft: ReportDraft) =>
      `Nyocha:\nUdi: Civic Issue\nIsiokwu: ${draft.title}\nNkowa: ${draft.description}\nZaa 1 ka i zipu ma obu 2 ka i kagbuo.`,
    reviewCorruption: (draft: ReportDraft) =>
      `Nyocha:\nUdi: Corruption\nIsiokwu: ${draft.title}\nOfis: ${draft.office}\nEgo: ${draft.amount || 'Enyebeghi'}\nNkowa: ${draft.description}\nZaa 1 ka i zipu ma obu 2 ka i kagbuo.`,
    submitSuccess: (id: string) => `E zipula report nke oma. Report ID: ${id}. I nwere ike itinye evidence na Evidence Upload.`,
  },
}

const assistantErrorMessages: Record<ChatLanguage, string> = {
  en: 'I could not process that request right now. Please try again.',
  pidgin: 'I no fit process that request now. Abeg try again.',
  hausa: 'Ba a iya sarrafa wannan bukata yanzu ba. A sake gwadawa.',
  yoruba: 'A ko le sise lori ibeere yii bayii. Jowo gbiyanju mo.',
  igbo: 'Enweghi m ike hazie ario a ugbu a. Biko nwaa ozo.',
}

const startReportPattern =
  /(report|complaint|corruption|issue|problem|rahoto|matsala|cin hanci|abeg.*report|jowo.*report|biko.*report|ibaje|isoro|nsogbu|akwa ikpe)/i

const affirmativeWords = [
  '1',
  'yes',
  'y',
  'ok',
  'confirm',
  'submit',
  'eh',
  'ehen',
  'naam',
  "na'am",
  'bee ni',
  'beni',
  'iyo',
  'ee',
  'da',
]
const negativeWords = ['2', 'no', 'n', 'cancel', 'aa', "a'a", 'mba', 'rara', 'bee ko']
const cancelWords = ['cancel', 'stop', 'quit', 'exit', 'dakatar', 'soke', 'kagbuo', 'fagile', 'kwusi']
const skipWords = ['skip', 'ko', 'babu', 'hapu', 'none']

const normalize = (value: string): string => value.trim().toLowerCase()

const parseLanguageChoice = (value: string): ChatLanguage | null => {
  const normalized = normalize(value)
  if (normalized.includes('english') || normalized.includes('ingilishi')) return 'en'
  if (normalized.includes('pidgin')) return 'pidgin'
  if (normalized.includes('hausa')) return 'hausa'
  if (normalized.includes('yoruba')) return 'yoruba'
  if (normalized.includes('igbo')) return 'igbo'
  return null
}

const detectLanguageFromText = (value: string): ChatLanguage => {
  const normalized = normalize(value)

  const igboSignals = ['biko', 'kedu', 'gini', 'achoro', 'ego', 'nsogbu']
  if (igboSignals.some((signal) => normalized.includes(signal))) {
    return 'igbo'
  }

  const yorubaSignals = ['jowo', 'bawo', 'kilode', 'mo fe', 'isoro', 'owo']
  if (yorubaSignals.some((signal) => normalized.includes(signal))) {
    return 'yoruba'
  }

  const hausaSignals = ['rahoto', 'matsala', 'cin hanci', 'na gode', 'ina so', 'yaya']
  if (hausaSignals.some((signal) => normalized.includes(signal))) {
    return 'hausa'
  }

  const pidginSignals = ['abeg', 'wetin', 'dey', 'wahala', 'oga', 'una']
  if (pidginSignals.some((signal) => normalized.includes(signal))) {
    return 'pidgin'
  }

  return 'en'
}

const parseReportKind = (value: string): ReportKind | null => {
  const normalized = normalize(value)
  if (
    normalized.includes('corrupt') ||
    normalized.includes('cin hanci') ||
    normalized.includes('bribe') ||
    normalized.includes('rashawa') ||
    normalized.includes('ibaje') ||
    normalized.includes('nri aka') ||
    normalized.includes('bribery') ||
    normalized === '1'
  ) {
    return 'corruption'
  }

  if (
    normalized.includes('civic') ||
    normalized.includes('issue') ||
    normalized.includes('matsala') ||
    normalized.includes('wahala') ||
    normalized.includes('isoro') ||
    normalized.includes('nsogbu') ||
    normalized.includes('community') ||
    normalized.includes('problem') ||
    normalized === '2'
  ) {
    return 'civic'
  }

  return null
}

const isAffirmative = (value: string): boolean => affirmativeWords.includes(normalize(value))
const isNegative = (value: string): boolean => negativeWords.includes(normalize(value))
const isCancel = (value: string): boolean => cancelWords.includes(normalize(value))
const isSkip = (value: string): boolean => skipWords.includes(normalize(value))

const AfricaJusticeChatbot: FC = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<ChatLanguage>('en')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: prompts.en.welcome,
    },
  ])
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I report corruption?',
    'Start corruption report',
    'Start civic issue report',
    'Show me project status updates',
  ])
  const [metrics, setMetrics] = useState<ChatbotMetrics | null>(null)
  const [provider, setProvider] = useState<'openai' | 'fallback' | null>(null)
  const [reportStep, setReportStep] = useState<ReportStep>('idle')
  const [reportDraft, setReportDraft] = useState<ReportDraft>(emptyDraft)

  const reportActive = reportStep !== 'idle'

  const pushMessage = (role: 'assistant' | 'user', text: string): void => {
    const id = `${role}-${Date.now()}-${Math.random()}`
    setMessages((prev) => [...prev, { id, role, text }])
  }

  const startReportFlow = (lang: ChatLanguage, kind?: ReportKind): void => {
    const text = prompts[lang]
    setProvider(null)
    setReportDraft({
      ...emptyDraft,
      kind,
    })

    if (kind) {
      setReportStep('title')
      pushMessage('assistant', text.startKind(kindLabels[lang][kind]))
      return
    }

    setReportStep('kind')
    pushMessage('assistant', text.askType)
  }

  const resetReportFlow = (): void => {
    setReportStep('idle')
    setReportDraft(emptyDraft)
  }

  const submitReportFromChat = async (draft: ReportDraft, lang: ChatLanguage): Promise<void> => {
    const text = prompts[lang]

    if (!draft.kind) {
      pushMessage('assistant', text.missingType)
      resetReportFlow()
      return
    }

    const parsedAmount = draft.amount.trim().length > 0 ? Number(draft.amount.replace(/,/g, '').trim()) : undefined

    if (parsedAmount !== undefined && Number.isNaN(parsedAmount)) {
      pushMessage('assistant', text.invalidAmountSubmit)
      resetReportFlow()
      return
    }

    const payload = {
      title: draft.title,
      category: draft.kind === 'corruption' ? 'corruption' : 'civic',
      description: draft.description,
      office: draft.kind === 'corruption' ? draft.office || undefined : undefined,
      amount: draft.kind === 'corruption' ? parsedAmount : undefined,
      source: 'chatbot',
      status: 'open',
    }

    try {
      const created = await reportService.createReport(payload)
      pushMessage('assistant', text.submitSuccess(created.id))
    } catch {
      pushMessage('assistant', text.submitFailed)
    } finally {
      resetReportFlow()
    }
  }

  const handleReportFlowInput = async (message: string, lang: ChatLanguage): Promise<void> => {
    const text = prompts[lang]

    if (isCancel(message)) {
      pushMessage('assistant', text.cancelled)
      resetReportFlow()
      return
    }

    if (reportStep === 'kind') {
      const kind = parseReportKind(message)
      if (!kind) {
        pushMessage('assistant', text.chooseTypeInvalid)
        return
      }
      setReportDraft((prev) => ({ ...prev, kind }))
      setReportStep('title')
      pushMessage('assistant', text.titleStep)
      return
    }

    if (reportStep === 'title') {
      if (message.trim().length < 5) {
        pushMessage('assistant', text.titleTooShort)
        return
      }
      setReportDraft((prev) => ({ ...prev, title: message.trim() }))
      setReportStep('description')
      pushMessage('assistant', text.descriptionStep)
      return
    }

    if (reportStep === 'description') {
      if (message.trim().length < 12) {
        pushMessage('assistant', text.descriptionTooShort)
        return
      }

      const nextDraft = { ...reportDraft, description: message.trim() }
      setReportDraft(nextDraft)

      if (nextDraft.kind === 'corruption') {
        setReportStep('office')
        pushMessage('assistant', text.officeStep)
      } else {
        setReportStep('confirm')
        pushMessage('assistant', text.reviewCivic(nextDraft))
      }
      return
    }

    if (reportStep === 'office') {
      if (message.trim().length < 2) {
        pushMessage('assistant', text.officeTooShort)
        return
      }
      setReportDraft((prev) => ({ ...prev, office: message.trim() }))
      setReportStep('amount')
      pushMessage('assistant', text.amountStep)
      return
    }

    if (reportStep === 'amount') {
      const amount = isSkip(message) ? '' : message.trim()
      if (amount && Number.isNaN(Number(amount.replace(/,/g, '')))) {
        pushMessage('assistant', text.amountInvalid)
        return
      }

      const nextDraft = { ...reportDraft, amount }
      setReportDraft(nextDraft)
      setReportStep('confirm')
      pushMessage('assistant', text.reviewCorruption(nextDraft))
      return
    }

    if (reportStep === 'confirm') {
      if (isAffirmative(message)) {
        await submitReportFromChat(reportDraft, lang)
        return
      }
      if (isNegative(message)) {
        pushMessage('assistant', text.restartHint)
        resetReportFlow()
        return
      }
      pushMessage('assistant', text.confirmChoice)
    }
  }

  const conversationHistory: ChatbotHistoryTurn[] = useMemo(
    () =>
      messages
        .filter((item) => item.id !== 'welcome')
        .map((item) => ({ role: item.role, text: item.text }))
        .slice(-8),
    [messages],
  )

  const sendAssistantQuery = async (message: string, lang: ChatLanguage): Promise<void> => {
    try {
      const response = await chatbotClient.sendMessage(message, conversationHistory, lang)
      pushMessage('assistant', response.reply)
      setSuggestions(response.suggestions)
      setMetrics(response.metrics)
      setProvider(response.provider)
    } catch {
      pushMessage('assistant', assistantErrorMessages[lang])
    }
  }

  const sendMessage = async (rawMessage: string): Promise<void> => {
    const message = rawMessage.trim()
    if (!message) {
      return
    }

    pushMessage('user', message)
    setIsSending(true)

    let lang = currentLanguage

    try {
      const manualLanguage = parseLanguageChoice(message)
      if (manualLanguage) {
        lang = manualLanguage
        setCurrentLanguage(manualLanguage)
        pushMessage('assistant', prompts[manualLanguage].languageSwitched(languageNames[manualLanguage]))
        return
      }

      const detected = detectLanguageFromText(message)
      if (detected !== 'en' || currentLanguage === 'en') {
        lang = detected
        if (detected !== currentLanguage) {
          setCurrentLanguage(detected)
        }
      }

      if (reportActive) {
        await handleReportFlowInput(message, lang)
        return
      }

      const normalized = normalize(message)
      if (normalized.includes('report corruption') || normalized.includes('cin hanci')) {
        startReportFlow(lang, 'corruption')
        return
      }

      if (normalized.includes('report civic') || normalized.includes('civic issue') || normalized.includes('matsala')) {
        startReportFlow(lang, 'civic')
        return
      }

      if (startReportPattern.test(message)) {
        startReportFlow(lang)
        return
      }

      await sendAssistantQuery(message, lang)
    } finally {
      setIsSending(false)
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const message = input
    setInput('')
    await sendMessage(message)
  }

  const activePrompts = prompts[currentLanguage]

  return (
    <div className="jc-chatbot">
      {open ? (
        <section className="jc-chat-panel">
          <h3 style={{ marginBottom: '0.35rem' }}>Justice Assistant</h3>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '0.45rem' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '10px',
                  background: message.role === 'assistant' ? 'rgba(29, 78, 216, 0.08)' : 'rgba(27, 31, 42, 0.08)',
                  color: 'var(--jc-ink)',
                  fontSize: '0.88rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}
              </div>
            ))}
          </div>

          {metrics ? (
            <p style={{ color: 'var(--jc-ink-soft)', fontSize: '0.8rem', marginTop: '0.55rem' }}>
              Live metrics: {metrics.reports} reports, {metrics.projects} projects, {metrics.verifications} verifications.
              {provider ? ` Source: ${provider}.` : ''}
            </p>
          ) : null}

          <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.45rem', marginTop: '0.7rem' }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={reportActive ? activePrompts.placeholderStep : activePrompts.placeholderIdle}
              style={{ flex: 1, borderRadius: '999px', border: '1px solid rgba(27,31,42,0.2)', padding: '0.45rem 0.75rem' }}
            />
            <button type="submit" className="jc-btn jc-btn-primary" disabled={isSending}>
              {isSending ? '...' : 'Send'}
            </button>
          </form>

          <div className="jc-chat-quick">
            <button
              type="button"
              disabled={isSending}
              onClick={() => {
                if (!reportActive) {
                  pushMessage('user', 'Start corruption report')
                  startReportFlow(currentLanguage, 'corruption')
                }
              }}
            >
              Report Corruption
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() => {
                if (!reportActive) {
                  pushMessage('user', 'Start civic issue report')
                  startReportFlow(currentLanguage, 'civic')
                }
              }}
            >
              Report Civic Issue
            </button>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isSending}
                onClick={() => {
                  void sendMessage(suggestion)
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <button className="jc-btn jc-btn-primary" type="button" onClick={() => setOpen((prev) => !prev)}>
        {open ? 'Close Assistant' : 'Open Assistant'}
      </button>
    </div>
  )
}

export default AfricaJusticeChatbot
