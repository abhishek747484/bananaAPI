const BANANA_API_URL = "https://marcconrad.com/uob/banana/api.php?out=json";

async function getBananaQuestion() {
  const response = await fetch(BANANA_API_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`Banana API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data || typeof data.question !== "string" || data.solution === undefined) {
    throw new Error("Banana API response did not contain question and solution.");
  }

  const solution = Number(data.solution);
  if (!Number.isFinite(solution)) {
    throw new Error("Banana API returned an invalid solution.");
  }

  return {
    question: data.question,
    solution
  };
}

module.exports = { getBananaQuestion };
