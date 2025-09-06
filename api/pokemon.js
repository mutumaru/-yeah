// api/pokemon.js
export default async function handler(req, res) {
  // CORS: GitHub Pages など任意のオリジンから呼べるようにする
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request に 200 で答える
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed, use POST" });
    return;
  }

  try {
    const { type1, type2, image, other } = req.body ?? {};

    const prompt = `
あなたはポケモンの公式図鑑を書くAIです。以下の入力から、厳密にJSONだけを出力してください。
出力キー (必須):
"name","classification","types","height","weight","ability","description","ability_description"

入力:
タイプ1: ${type1}
タイプ2: ${type2}
イメージ: ${image || "なし"}
その他: ${other || "なし"}

図鑑文は1〜3行の短め、特性説明はゲーム的に一文程度にしてください。
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.env.OPENAI_API}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.8
      })
    });

    const openaiJson = await openaiRes.json();
    const content = openaiJson?.choices?.[0]?.message?.content ?? null;

    if (!content) {
      console.error("OpenAI response:", openaiJson);
      res.status(500).json({ error: "No content from OpenAI" });
      return;
    }

    // LLMが返した JSON をパースする
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // 本文から {...} 部分を抜き出してパースを試みる
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    if (!parsed) {
      // 失敗時は raw を返す（フロント側で表示可能）
      res.status(200).json({
        name: "生成失敗",
        classification: "—",
        types: `${type1}${type2 && type2 !== "なし" ? "/" + type2 : ""}`,
        height: "-",
        weight: "-",
        ability: "-",
        description: content.slice(0, 1200),
        ability_description: "(特性説明: raw)"
      });
      return;
    }

    // 正常にパースできたらそのまま返却
    res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
