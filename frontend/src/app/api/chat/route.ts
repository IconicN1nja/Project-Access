import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "A valid query string is required." },
        { status: 400 }
      );
    }

    // Resolve path to scripts/rag_chain.py
    const scriptPath = path.join(process.cwd(), "..", "scripts", "rag_chain.py");

    return new Promise<NextResponse>((resolve) => {
      let stdoutBuffer = "";
      let stderrBuffer = "";

      const pythonProcess = spawn("python", [scriptPath, "--json", query], {
        cwd: path.join(process.cwd(), ".."),
        env: { ...process.env }
      });

      pythonProcess.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderrBuffer += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error(`Python RAG process exited with code ${code}. Stderr: ${stderrBuffer}`);
          resolve(
            NextResponse.json(
              { error: "RAG advisory process execution failed.", details: stderrBuffer },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const parsedResult = JSON.parse(stdoutBuffer.trim());
          resolve(NextResponse.json(parsedResult));
        } catch (err) {
          console.error("Failed to parse Python script output as JSON:", err);
          console.error("Raw stdout received:", stdoutBuffer);
          resolve(
            NextResponse.json(
              { error: "Failed to parse RAG engine response.", rawOutput: stdoutBuffer },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (err: any) {
    console.error("Unhandled error in Next.js Route Handler:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
