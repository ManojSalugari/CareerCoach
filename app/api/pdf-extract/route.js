import pdfParse from "pdf-parse";

export async function POST(request) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400, headers: { "content-type": "application/json" } });
    }
    const buffer = Buffer.from(arrayBuffer);
    const result = await pdfParse(buffer);
    const text = (result?.text || "").trim();
    if (!text) {
      return new Response(JSON.stringify({ error: "No extractable text (likely scanned PDF)" }), { status: 422, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ text }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to extract PDF text" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}


