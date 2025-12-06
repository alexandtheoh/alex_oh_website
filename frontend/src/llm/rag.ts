import { pipeline, FeatureExtractionPipeline } from "@huggingface/transformers";

let embedder: FeatureExtractionPipeline | null = null

async function meanPool(tokens: number[][]): Promise<number[]> {
  const seqLen = tokens.length; // number of tokens
  const hiddenDim = tokens[0].length; // features in tokens

  const output = new Array(hiddenDim).fill(0);

  // Sum over tokens
  for (let j = 0; j < hiddenDim; j++) {
    for (let i = 0; i < seqLen; i++) {
      output[j] += tokens[i][j];
      if (i == (seqLen - 1)) {
        output[j] = output[j] / seqLen
      }
    }
  }

  return output;
}

export async function embedQuery(query: string): Promise<number[]> {
  if (embedder == null) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2", 
      {
        dtype: 'q4',
      },
    );
  }

  if (embedder != null) {
    // shape = [1, tokens, dims]
    const tensor = (await embedder(query));
    return (await meanPool(tensor.tolist()[0]))
  }

  return [0]
}