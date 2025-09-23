export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    let buffer;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return new Response(JSON.stringify({ error: "No file field 'file' in form" }), { status: 400, headers: { "content-type": "application/json" } });
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      const arrayBuffer = await request.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      buffer = Buffer.from(arrayBuffer);
    }
    const { default: pdfParse } = await import("pdf-parse");
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


