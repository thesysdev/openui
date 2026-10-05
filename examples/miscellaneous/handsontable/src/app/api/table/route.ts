import { NextRequest, NextResponse } from "next/server";
import { getTableData, getTableStore, TableData } from "../chat/tableStore";

export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId");
  if (!threadId)
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });

  return NextResponse.json(getTableData(threadId));
}

export async function POST(req: NextRequest) {
  try {
    const { threadId, data, colHeaders } = (await req.json()) as {
      threadId: string;
      data: TableData;
      colHeaders?: string[];
    };

    if (!threadId)
      return NextResponse.json({ error: "threadId is required" }, { status: 400 });
    if (!data)
      return NextResponse.json({ error: "data is required" }, { status: 400 });

    const store = getTableStore(threadId);
    store.data = data;
    if (colHeaders) store.colHeaders = colHeaders;

    return NextResponse.json({ success: true, message: "Table data synced" });
  } catch (error) {
    console.error("Error syncing table data:", error);
    return NextResponse.json({ error: "Failed to sync table data" }, { status: 500 });
  }
}
