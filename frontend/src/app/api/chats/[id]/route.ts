import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import { getUserIdFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// Get a specific chat by ID
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve params for Next.js 15+ compatibility
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const chat = await Chat.findOne({ id, userId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    console.error("[GET CHAT DETAIL API ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Update a chat's title, pin status, or messages list
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { title, messages, pinned } = await req.json();

    await dbConnect();

    const chat = await Chat.findOne({ id, userId });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (title !== undefined) chat.title = title;
    if (pinned !== undefined) chat.pinned = pinned;
    if (messages !== undefined) chat.messages = messages;

    await chat.save();

    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    console.error("[PUT CHAT DETAIL API ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Delete a chat
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const result = await Chat.deleteOne({ id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Chat not found or already deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error: any) {
    console.error("[DELETE CHAT API ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
