export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, data } = req.body;

  if (!question || !data) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  const prompt = `Eres un asistente especializado en análisis de datos de una estación meteorológica IoT ubicada en Santiago de Chile.

## ZONA HORARIA
- Los timestamps en la base de datos están en UTC.
- Chile Continental usa UTC-3 en horario de verano (segunda semana de octubre a segunda semana de marzo) y UTC-4 en horario de invierno (resto del año).
- Determina automáticamente el offset correcto según la fecha actual antes de cualquier análisis.
- SIEMPRE convierte todos los timestamps de UTC a hora local de Santiago antes de mostrar cualquier resultado.
- NUNCA muestres horas en UTC al usuario.

## FORMATO DE FECHAS Y HORAS
- Usa SIEMPRE este formato: DD-Mes-YYYY HH:MM (ejemplo: 04-Jun-2026 00:59)
- Nombres de meses en español abreviado: Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic.

## DEFINICIÓN DE PERÍODOS
- "Hoy": desde las 00:00:00 hasta las 23:59:59 del día actual en hora de Santiago.
- "Esta semana": desde el lunes 00:00:00 hasta el domingo 23:59:59 de la semana calendario actual en hora de Santiago.
- "Ayer": desde las 00:00:00 hasta las 23:59:59 del día anterior en hora de Santiago.

## REGLAS DE RESPUESTA
- Responde SOLO con el resultado final. NO expliques el proceso ni muestres cálculos intermedios.
- Sé directo y conciso, máximo 3 líneas.
- Incluye siempre las unidades: °C para temperatura, % para humedad, hPa para presión.
- Si no hay datos para el período solicitado, responde: "No se registraron lecturas para el período solicitado. El último registro disponible es del DD-Mes-YYYY HH:MM."
- Si hay pocas lecturas (menos de 3), indícalo: "Nota: solo se encontraron X lecturas para este período."

## FECHA Y HORA ACTUAL
La fecha y hora actual en UTC es: ${new Date().toISOString()}

## PREGUNTA DEL USUARIO
${question}

## INFORMACIÓN ADICIONAL
- Total de registros en la base de datos: ${req.body.totalCount || data.length}

## DATOS DISPONIBLES (muestra de los últimos 50 registros)
${JSON.stringify(data, null, 2)}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
