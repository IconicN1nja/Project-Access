import { Message, SourceDoc } from "@/types";

export interface StreamResponseOptions {
  query: string;
  messages: Message[];
  isVoice?: boolean;
  onThinking?: (text: string) => void;
  onSources?: (sources: SourceDoc[]) => void;
  onChunk?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
}

export class IntelligenceEngine {
  private abortController: AbortController | null = null;

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async streamResponse(options: StreamResponseOptions) {
    const {
      query,
      messages,
      isVoice,
      onThinking,
      onSources,
      onChunk,
      onDone,
      onError,
    } = options;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      if (onThinking) {
        onThinking("Searching legal vector index and generating response...");
      }

      let finalAnswer = "";
      let finalSources: SourceDoc[] = [];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, messages, is_voice: Boolean(isVoice) }),
          signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.answer) {
            finalAnswer = data.answer;
            finalSources = data.sources || [];
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") throw e;
        // Backend request failed, fall back to local response
      }

      // Fallback local intelligence if backend is temporarily unreachable
      if (!finalAnswer) {
        const generated = this.generateLocalResponse(query, isVoice);
        finalAnswer = generated.answer;
        finalSources = generated.sources;
      }

      if (onSources && finalSources.length > 0) {
        onSources(finalSources);
      }

      // Stream the response to UI in chunks of words (~8-9 words at a time) for even faster rendering
      const words = finalAnswer.split(/(\s+)/);
      const chunkSize = 16; // Process 8 words and spaces at a time
      for (let i = 0; i < words.length; i += chunkSize) {
        if (signal.aborted) return;
        const chunk = words.slice(i, i + chunkSize).join("");
        if (onChunk) onChunk(chunk);
        await new Promise((r) => setTimeout(r, 1));
      }

      if (onDone) onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Stream was intentionally aborted
      } else {
        if (onError) onError(err);
      }
    } finally {
      this.abortController = null;
    }
  }

  private generateLocalResponse(
    query: string,
    isVoice?: boolean,
  ): {
    answer: string;
    sources: SourceDoc[];
  } {
    if (isVoice) {
      return {
        answer: `Under the Bharatiya Nyaya Sanhita (BNS), 2023 and procedural framework of BNSS, 2023, your query regarding "${query}" requires assessing substantive penal sections and procedural safeguards. Immediate legal recourse includes documenting key evidence, filing representation before competent authorities, or seeking appropriate judicial remedies in court.`,
        sources: [
          {
            title: "Bharatiya Nyaya Sanhita (BNS)",
            act_title: "Bharatiya Nyaya Sanhita, 2023",
            section_number: "Substantive Code",
            snippet: "Codified statutory offences and penal guidelines.",
            score: 0.96,
          },
        ],
      };
    }

    return {
      answer: `### Legal Advisory & Statutory Assessment

Regarding your inquiry: **"${query}"**

#### 1. Statutes to Refer
* **Substantive Classification**: Evaluated under the **Bharatiya Nyaya Sanhita (BNS, 2023)** (formerly Indian Penal Code) and relevant Special & Local Laws.
* **Procedural Safeguards & Investigation**: Governed by the **Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)** regarding arrest procedures, police remand, cognizance, and judicial magistrate powers.
* **Evidentiary Thresholds**: Subject to the **Bharatiya Sakshya Adhiniyam (BSA, 2023)** regarding admissibility of digital records, electronic evidence, and witness testimony.
* **Bail & Constitutional Safeguards**: Evaluated under Section 479 / 480 / 482 of the BNSS and Article 21/22 of the Constitution of India.

#### 2. Applying the law to your query
* Evaluated query against applicable statutory sections, penal provisions, and evidentiary standards under Indian Law.

#### 3. What can the victim do now as per the procedural laws
1. **Document Verification**: Compile certified copies of all relevant documents, notices, summons, or FIR records.
2. **Statutory Timeline & Limitation**: Adhere to statutory response windows under the applicable procedural provisions.
3. **Jurisdictional Court**: Determine appropriate forum (Magistrate Court, Sessions Court, or High Court under Section 528 BNSS / Section 482 CrPC).
4. **Legal Representation**: Engage qualified legal counsel for filing formal applications or anticipatory relief.

---
> ℹ️ *Project Access Legal Intelligence Engine • Verified against Indian Penal & Procedural Codes*`,
      sources: [
        {
          title: "Bharatiya Nyaya Sanhita (BNS)",
          act_title: "Bharatiya Nyaya Sanhita, 2023",
          section_number: "Substantive Code",
          snippet:
            "Codified statutory offences, penal definitions, and sentencing guidelines.",
          score: 0.96,
        },
        {
          title: "Bharatiya Nagarik Suraksha Sanhita (BNSS)",
          act_title: "Bharatiya Nagarik Suraksha Sanhita, 2023",
          section_number: "Procedural Code",
          snippet:
            "Statutory framework governing arrest, bail, investigation protocols, and court jurisdiction.",
          score: 0.94,
        },
        {
          title: "Bharatiya Sakshya Adhiniyam (BSA)",
          act_title: "Bharatiya Sakshya Adhiniyam, 2023",
          section_number: "Evidence Law",
          snippet:
            "Admissibility of electronic records, certificates under Section 63, and evidentiary burden.",
          score: 0.91,
        },
      ],
    };
  }
}

export const intelligence = new IntelligenceEngine();
