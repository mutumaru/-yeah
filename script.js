// ← 後でこの URL をあなたの Vercel プロジェクトの URL に置き換える
const VERCEL_API_BASE = "https://YOUR-VERCEL-APP.vercel.app"; // 例: https://pokemon-zukan.vercel.app

document.getElementById("generateBtn").addEventListener("click", generatePokemon);

async function generatePokemon() {
  const type1 = document.getElementById("type1").value;
  const type2 = document.getElementById("type2").value;
  const image = document.getElementById("image").value;
  const other = document.getElementById("other").value;

  // ボタン無効化してローディング感
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "生成中…";

  try {
    const res = await fetch(`${VERCEL_API_BASE}/api/pokemon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type1, type2, image, other })
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "サーバーエラー");
    }

    // API は構造化JSONを返す（下のサーバー実装参照）
    const data = json;
    // 表示更新
    document.getElementById("basic").textContent =
      `名前: ${data.name}\n分類: ${data.classification}\nタイプ: ${data.types}\n高さ: ${data.height}\n重さ: ${data.weight}\n特性: ${data.ability}`;
    document.getElementById("desc").textContent = data.description || "(説明なし)";
    document.getElementById("ability").textContent = data.ability_description || "(特性説明なし)";
  } catch (e) {
    document.getElementById("basic").textContent = "エラー: " + e.message;
    document.getElementById("desc").textContent = "";
    document.getElementById("ability").textContent = "";
  } finally {
    btn.disabled = false;
    btn.textContent = "確定";
  }
}
