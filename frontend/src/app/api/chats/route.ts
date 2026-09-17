import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import { getUserIdFromRequest } from "@/lib/auth";

// Get all chats for the authenticated user
export async function GET() {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, chats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[GET CHATS API ERROR]", error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

// Create a new chat for the authenticated user
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, messages, pinned } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const newChat = new Chat({
      id,
      userId,
      title: title || "New chat",
      pinned: pinned || false,
      messages: messages || [],
    });

    await newChat.save();

    return NextResponse.json({ success: true, chat: newChat });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[POST CHAT API ERROR]", error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
