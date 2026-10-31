const BANANA_API_URL = "https://marcconrad.com/uob/banana/api.php?out=json";

async function getBananaQuestion() {
  const response = await fetch(BANANA_API_URL, {
    headers: {
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`Banana API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (
    !data ||
    typeof data.question !== "string" ||
    !data.question.trim() ||
    data.solution === undefined ||
    data.solution === null
  ) {
    throw new Error("Invalid Banana API puzzle response.");
  }

  return {
    question: data.question.trim(),
    solution: String(data.solution).trim()
  };
}

module.exports = { getBananaQuestion };