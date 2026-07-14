import "dotenv/config"

const PLANT_ID_API_URL = "https://plant.id/api/v3"

export interface PlantIdResult {
  scientific_name: string
  common_name: string
  confidence_score: number
}

export const identifyWithPlantId = async (imageBase64: string): Promise<PlantIdResult | null> => {
  const response = await fetch(PLANT_ID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.PLANT_ID_API_KEY!
    },
    body: JSON.stringify({
      images: [imageBase64],
      similar_images: false
    })
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  const suggestion = data.result?.classification?.suggestions?.[0]

  if (!suggestion) {
    return null
  }

  return {
    scientific_name: suggestion.name,
    common_name: suggestion.details?.common_names?.[0] ?? suggestion.name,
    confidence_score: suggestion.probability
  }
}