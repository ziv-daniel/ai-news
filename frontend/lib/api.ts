export interface Article {
  id: string;
  title: string;
  link: string;
  summary: string;
  source_name: string;
  category: string;
  tier: string;
  score: number;
  published_at: string | null;
  collected_at: string;
  read: boolean;
  favorited: boolean;
  archived: boolean;
}

// Static sample data for when API is unavailable
const SAMPLE_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Claude's new constitution",
    link: "https://simonwillison.net/2026/Jan/21/claudes-new-constitution/",
    summary: "Late last year Richard Weiss found something interesting while poking around with the just-released Claude Opus 4.5: he was able to talk the model into regurgitating a document which was not part of the system prompt but appeared instead to be baked in during training.",
    source_name: "Simon Willison",
    category: "announcement",
    tier: "urgent",
    score: 95,
    published_at: "2026-01-21T23:39:49+00:00",
    collected_at: "2026-01-22T07:52:58.628+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "2",
    title: "Sources: Project SGLang spins out as RadixArk with $400M valuation",
    link: "https://techcrunch.com/2026/01/21/sources-project-sglang-spins-out-as-radixark-with-400m-valuation-as-inference-market-explodes/",
    summary: "SGLang, which originated as an open source research project at Ion Stoica's UC Berkeley lab, has raised capital from Accel as the inference market explodes.",
    source_name: "TechCrunch AI",
    category: "breakthrough",
    tier: "urgent",
    score: 90,
    published_at: "2026-01-21T23:24:14+00:00",
    collected_at: "2026-01-22T07:52:58.629+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "3",
    title: "Meta Pays $3B for Manus: Its Fastest Path to AI Agent Dominance",
    link: "https://gilpignol.substack.com/p/meta-pays-3-billion-for-manus-its",
    summary: "Meta's bold acquisition of Manus signals their aggressive push into the AI agent space, potentially reshaping the competitive landscape.",
    source_name: "Hacker News AI",
    category: "analysis",
    tier: "high",
    score: 85,
    published_at: "2026-01-22T03:36:53+00:00",
    collected_at: "2026-01-22T07:52:58.625+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "4",
    title: "AI boom could falter without wider adoption, Microsoft chief Satya Nadella warns",
    link: "https://www.irishtimes.com/business/2026/01/20/ai-boom-could-falter-without-wider-adoption-microsoft-chief-satya-nadella-warns/",
    summary: "Microsoft CEO warns that AI investments need broader enterprise adoption to sustain the current boom cycle.",
    source_name: "Hacker News AI",
    category: "analysis",
    tier: "high",
    score: 80,
    published_at: "2026-01-22T10:00:06+00:00",
    collected_at: "2026-01-22T10:11:06.888+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "5",
    title: "Designing AI-resistant technical evaluations",
    link: "https://www.anthropic.com/engineering/AI-resistant-technical-evaluations",
    summary: "Anthropic shares insights on how to design technical evaluations that remain meaningful in the age of AI assistance.",
    source_name: "Hacker News AI",
    category: "analysis",
    tier: "high",
    score: 78,
    published_at: "2026-01-22T10:26:37+00:00",
    collected_at: "2026-01-22T10:34:22.958+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "6",
    title: "Palantir CEO: With AI, economies won't need immigration",
    link: "https://www.theregister.com/2026/01/21/palantir_ceo_karp_claims_ai/",
    summary: "Alex Karp makes controversial claims about AI's potential to replace labor needs traditionally filled by immigration.",
    source_name: "Hacker News AI",
    category: "analysis",
    tier: "high",
    score: 75,
    published_at: "2026-01-22T02:18:36+00:00",
    collected_at: "2026-01-22T07:52:58.627+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "7",
    title: "Not to be outdone by OpenAI, Apple is reportedly developing an AI wearable",
    link: "https://techcrunch.com/2026/01/21/not-to-be-outdone-by-openai-apple-is-reportedly-developing-an-ai-wearable/",
    summary: "Should this wearable materialize, it could be released as early as 2027, according to a report on the device.",
    source_name: "TechCrunch AI",
    category: "announcement",
    tier: "medium",
    score: 70,
    published_at: "2026-01-22T00:20:18+00:00",
    collected_at: "2026-01-22T07:52:58.627+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "8",
    title: "Fei Fei Li dropped a non-JEPA world model, and the spatial intelligence is insane",
    link: "https://www.reddit.com/r/LocalLLaMA/comments/1qjjrmq/fei_fei_li_dropped_a_nonjepa_world_model_and_the/",
    summary: "The AI pioneer's latest research demonstrates remarkable spatial understanding capabilities in a new world model architecture.",
    source_name: "Reddit AI",
    category: "analysis",
    tier: "medium",
    score: 65,
    published_at: "2026-01-22T03:39:33+00:00",
    collected_at: "2026-01-22T10:33:18.853+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "9",
    title: "Thoughts on LLMs in software development after one year of professional use",
    link: "https://www.reddit.com/r/LocalLLaMA/comments/1qjnbh8/thoughts_on_llms_closed_and_opensource_in/",
    summary: "Chatbots are amazing at codebase exploration. Codex is best at debugging. Claude is better at code quality. Local models aren't much help yet.",
    source_name: "Reddit AI",
    category: "analysis",
    tier: "medium",
    score: 60,
    published_at: "2026-01-22T06:38:33+00:00",
    collected_at: "2026-01-22T07:54:12.135+00:00",
    read: false,
    favorited: false,
    archived: false
  },
  {
    id: "10",
    title: "Yann LeCun's new venture is a contrarian bet against large language models",
    link: "https://www.technologyreview.com/2026/01/22/1131661/yann-lecuns-new-venture-ami-labs/",
    summary: "Yann LeCun is a Turing Award recipient and a top AI researcher, but he has long been a contrarian figure believing LLMs will fail to solve many problems.",
    source_name: "MIT Technology Review",
    category: "breakthrough",
    tier: "low",
    score: 55,
    published_at: "2026-01-22T10:00:00+00:00",
    collected_at: "2026-01-22T10:08:51.567+00:00",
    read: false,
    favorited: false,
    archived: false
  }
];

export async function getArticles(params?: {
  tier?: string;
  category?: string;
  read?: boolean;
  favorited?: boolean;
  archived?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Article[]> {
  // Return sample data (static for GitHub Pages)
  let articles = [...SAMPLE_ARTICLES];

  if (params?.tier) {
    articles = articles.filter(a => a.tier === params.tier);
  }
  if (params?.archived !== undefined) {
    articles = articles.filter(a => a.archived === params.archived);
  }
  if (params?.limit) {
    articles = articles.slice(0, params.limit);
  }

  return articles;
}

export async function updateArticle(
  id: string,
  updates: { read?: boolean; favorited?: boolean; archived?: boolean }
): Promise<Article> {
  const article = SAMPLE_ARTICLES.find(a => a.id === id);
  if (!article) throw new Error('Article not found');
  return { ...article, ...updates };
}

export async function searchArticles(
  query: string,
  useVector: boolean = false,
  limit: number = 20
): Promise<Article[]> {
  const lowerQuery = query.toLowerCase();
  return SAMPLE_ARTICLES
    .filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.summary.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}
