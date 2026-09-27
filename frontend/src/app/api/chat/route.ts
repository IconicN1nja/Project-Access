import { NextResponse } from "next/server";

const ACT_FULL_NAMES: Record<string, string> = {
  // Criminal Laws
  bns: "Bharatiya Nyaya Sanhita, 2023",
  bns_2023: "Bharatiya Nyaya Sanhita, 2023",
  bnss: "Bharatiya Nagarik Suraksha Sanhita, 2023",
  "202346": "Bharatiya Nagarik Suraksha Sanhita, 2023",
  bsa: "Bharatiya Sakshya Adhiniyam, 2023",
  bsa_2023: "Bharatiya Sakshya Adhiniyam, 2023",
  pocso: "The Protection of Children from Sexual Offences Act, 2012",
  ndps: "The Narcotic Drugs and Psychotropic Substances Act, 1985",
  uapa: "The Unlawful Activities (Prevention) Act, 1967",
  arms: "The Arms Act, 1959",
  domestic_violence: "The Protection of Women from Domestic Violence Act, 2005",
  dpa: "The Dowry Prohibition Act, 1961",
  pca: "The Prevention of Corruption Act, 1988",
  pmla: "The Prevention of Money-Laundering Act, 2002",
  sc_st: "The Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989",
  dca: "The Drugs and Cosmetics Act, 1940",
  irwa: "The Indecent Representation of Women (Prohibition) Act, 1986",

  // Civil Laws
  aca: "The Arbitration and Conciliation Act, 1996",
  ca1962: "The Customs Act, 1962",
  ca2013: "The Companies Act, 2013",
  cgst: "The Central Goods and Services Tax Act, 2017",
  cow: "The Code on Wages, 2019",
  cpa: "The Consumer Protection Act, 2019",
  cpc: "The Code of Civil Procedure, 1908",
  drt: "The Recovery of Debts Due to Banks and Financial Institutions Act, 1993",
  hama: "The Hindu Adoptions and Maintenance Act, 1956",
  hma: "The Hindu Marriage Act, 1955",
  hsa: "The Hindu Succession Act, 1956",
  ibc: "The Insolvency and Bankruptcy Code, 2016",
  ica: "The Indian Contract Act, 1872",
  ipa: "The Indian Partnership Act, 1932",
  ita: "The Income-Tax Act, 1961",
  lsaa: "The Legal Services Authorities Act, 1987",
  mva: "The Motor Vehicles Act, 1988",
  pbpt: "The Prohibition of Benami Property Transactions Act, 1988",
  sarfaesi: "The Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002",
  sma: "The Special Marriage Act, 1954",
  soga: "The Sale of Goods Act, 1930",
  sra: "The Specific Relief Act, 1963",
  tpa: "The Transfer of Property Act, 1882",
};

function resolveFullActTitle(rawTitle?: string, rawActId?: string): string {
  const cleanActId = String(rawActId || "").toLowerCase().trim();
  const cleanTitle = String(rawTitle || "").trim();

  if (ACT_FULL_NAMES[cleanActId]) return ACT_FULL_NAMES[cleanActId];

  for (const [key, fullName] of Object.entries(ACT_FULL_NAMES)) {
    if (cleanActId.includes(key) || cleanTitle.toLowerCase().includes(key)) {
      return fullName;
    }
  }

  if (cleanTitle && cleanTitle.length > 5 && !cleanTitle.startsWith("ACT NO.")) {
    return cleanTitle;
  }

  return cleanTitle || rawActId || "Official Legal Statute";
}

export async function POST(req: Request) {
  try {
    const { query, is_voice, messages, response_language } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 },
      );
    }

    // Configurable backend URL (defaults to local FastAPI port 8000)
    const backendUrl =
      process.env.RAG_API_URL ||
      process.env.NEXT_PUBLIC_RAG_API_URL ||
      "http://127.0.0.1:8000/api/query";

    try {
      const formattedMessages = Array.isArray(messages)
        ? messages.map((m: { role?: string; content?: string }) => ({
            role: m.role || "user",
            content: m.content || "",
          }))
        : [];

      const ragResponse = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          is_voice: Boolean(is_voice),
          messages: formattedMessages,
          response_language: response_language || "English",
        }),
        signal: AbortSignal.timeout(90000), // 90s timeout for LLM inference
      });

      if (ragResponse.ok) {
        const data = await ragResponse.json();
        const isErrorAnswer =
          data.is_error ||
          data.isError ||
          !data.answer ||
          String(data.answer).includes("Something went wrong") ||
          String(data.answer).includes("Error generating answer") ||
          String(data.answer).includes("rate-limited");

        if (isErrorAnswer) {
          return NextResponse.json({
            answer: "Something went wrong. Please try again.",
            isError: true,
            sources: [],
          });
        }

        return NextResponse.json({
          answer: data.answer,
          isError: false,
          classified_collection: data.classified_collection,
          sources: (data.retrieved_docs || []).map((doc: unknown) => {
            const d = doc as Record<string, unknown>;
            const actId = String(d.act_id || "").toLowerCase();
            const rawActTitle = String(d.act_title || "");
            const fullActTitle = resolveFullActTitle(rawActTitle, actId);
            const civilKeywords = ["aca", "ca1962", "ca2013", "cgst", "cow", "cpa", "cpc", "drt", "hama", "hma", "hsa", "ibc", "ica", "ipa", "ita", "lsaa", "mva", "pbpt", "sarfaesi", "sma", "soga", "sra", "tpa", "contract", "property", "marriage", "consumer", "arbitration", "company", "wages", "tax", "gst", "recovery"];
            const isCivil = civilKeywords.some(k => actId.includes(k) || rawActTitle.toLowerCase().includes(k));
            return {
              title: fullActTitle,
              act_title: fullActTitle,
              section_number: d.section_number,
              section_title: d.section_title,
              snippet: d.text || d.snippet || "",
              score: d.score || 0.95,
              domain: (d.domain as string) || (isCivil ? "Civil Law" : "Criminal Law"),
            };
          }),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`Could not reach backend at ${backendUrl}:`, message);
    }

    // Fallback response if backend service is unreachable or returns error
    return NextResponse.json({
      answer: "Something went wrong. Please try again.",
      isError: true,
      sources: [],
    });
  } catch (error: unknown) {
    return NextResponse.json({
      answer: "Something went wrong. Please try again.",
      isError: true,
      sources: [],
    });
  }
}
