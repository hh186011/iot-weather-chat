export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, data } = req.body;

  if (!question || !data) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  const prompt = `Eres un asistente especializado en análisis de datos de una estación meteorológica IoT ubicada en Santiago, Chile.

La base de datos tiene una tabla sensor_readings con columnas: device_id, temperature (°C), humidity (%), pressure (hPa), created_at.

El usuario preguntó: "${question}"

Datos de la base de datos (últimos registros):
${JSON.stringify(data.slice(0, 50), null, 2)}

IMPORTANTE: Responde SOLO con el resultado final. NO expliques el proceso, NO muestres cálculos intermedios, NO listes los datos uno por uno. Solo da la respuesta directa con el valor y una breve interpretación en máximo 3 líneas. Ejemplo correcto: "Temperatura promedio de hoy: 19.8°C (registradas 25 lecturas entre 00:00 y 04:11)". Ejemplo incorrecto: listar todos los valores uno por uno.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'Error en Groq' });
    }

    const result = await response.json();
    const answer = result.choices[0].message.content;
    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
