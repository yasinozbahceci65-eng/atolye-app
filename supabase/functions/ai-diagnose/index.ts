import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("Atolye") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { description, photoBase64 } = await req.json();

    if (!photoBase64) {
      return new Response(
        JSON.stringify({ error: "Fotoğraf gerekli. Lütfen bir fotoğraf yükleyin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const promptText = `Sen bir yapı ve tadilat uzmanısın. Sana gönderilen fotoğrafı dikkatlice incele ve bölgedeki sorunu teşhis et.

${description ? `Kullanıcının ek açıklaması: ${description}` : ""}

Lütfen şu formatta cevap ver:

TEŞHİS:
[Fotoğrafta gördüğün sorunu detaylı açıkla]

ÖNERİLEN İŞLEMLER:
[Numaralandırılmış adım adım yapılması gerekenler]

GEREKLİ MALZEMELER:
[İş için gerekli malzemelerin listesi]

ÖNEMLİ NOT:
[Varsa dikkat edilmesi gereken önemli bir nokta]

Türkçe cevap ver. Sadece yapı/tadilat/boya/tadilat konularında uzmanlaş.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: photoBase64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "Yapay zeka servisi şu anda yanıt veremiyor. Lütfen tekrar deneyin." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const diagnosis = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Teşhis yapılamadı. Lütfen tekrar deneyin.";

    return new Response(
      JSON.stringify({ diagnosis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
