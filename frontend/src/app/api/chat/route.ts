import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, messages, model, deepSearch } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
    }

    // Configurable backend URL (defaults to local FastAPI port 8000)
    const backendUrl = process.env.RAG_API_URL || process.env.NEXT_PUBLIC_RAG_API_URL || 'http://127.0.0.1:8000/api/query';

    try {
      const ragResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
        signal: AbortSignal.timeout(90000) // 90s timeout for LLM inference
      });

      if (ragResponse.ok) {
        const data = await ragResponse.json();
        console.log(data.answer);
        return NextResponse.json({
          answer: data.answer,
          classified_collection: data.classified_collection,
          sources: (data.retrieved_docs || []).map((doc: any) => ({
            title: doc.section_title || doc.act_title || doc.source_label || 'Legal Section',
            act_title: doc.act_title,
            section_number: doc.section_number,
            snippet: doc.text || doc.snippet || '',
            score: doc.score || 0.95
          }))
        });
      }
    } catch (err: any) {
      console.warn(`Could not reach backend at ${backendUrl}:`, err.message);
    }

    // Fallback response if backend service is offline
    return NextResponse.json({
      success: true,
      query
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
