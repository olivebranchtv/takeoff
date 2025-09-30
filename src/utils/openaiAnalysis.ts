/**
 * OpenAI Document Analysis Utility
 * Analyzes electrical drawings and extracts key information
 */

export interface ProjectAnalysis {
  assumptions: string[];
  fixtureResponsibility: {
    ownerProvided: string[];
    contractorProvided: string[];
    notes: string;
  };
  lightingSchedule: LightingFixture[];
  panelSchedule: PanelInfo[];
  keyNotes: string[];
  scope: {
    includedWork: string[];
    excludedWork: string[];
  };
  rawResponse: string;
}

export interface LightingFixture {
  type: string;
  description: string;
  manufacturer?: string;
  model?: string;
  quantity?: number;
  wattage?: string;
  voltage?: string;
  mounting?: string;
  notes?: string;
}

export interface PanelInfo {
  panelId: string;
  location?: string;
  voltage?: string;
  phases?: string;
  main?: string;
  circuits?: number;
  feedFrom?: string;
  notes?: string;
}

export async function analyzeDrawingsWithOpenAI(
  pdfPages: string[],
  apiKey: string
): Promise<ProjectAnalysis> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key is required');
  }

  try {
    // Prepare the prompt
    const prompt = `You are an expert electrical estimator analyzing construction drawings.
Analyze these electrical drawings and extract the following information in a structured format:

1. PROJECT ASSUMPTIONS:
   - List all key assumptions mentioned in the drawings
   - Include notes about existing conditions
   - Any clarifications or questions noted

2. FIXTURE RESPONSIBILITY:
   - Which fixtures are OWNER PROVIDED (e.g., light fixtures by owner)
   - Which fixtures are CONTRACTOR PROVIDED (e.g., wiring, boxes by contractor)
   - Any specific notes about fixture responsibilities

3. LIGHTING SCHEDULE:
   - Extract complete lighting fixture schedule
   - Include: Type, Description, Manufacturer, Model, Quantity, Wattage, Voltage, Mounting
   - Format as a structured list

4. PANEL SCHEDULE:
   - Extract all panel information
   - Include: Panel ID, Location, Voltage, Phases, Main Breaker, Circuit Count, Fed From
   - Format as a structured list

5. KEY NOTES:
   - Important general notes
   - Code requirements
   - Coordination notes

6. SCOPE OF WORK:
   - What work IS included
   - What work IS NOT included (exclusions)

Please provide the information in this exact JSON format:
{
  "assumptions": ["assumption 1", "assumption 2", ...],
  "fixtureResponsibility": {
    "ownerProvided": ["item 1", "item 2", ...],
    "contractorProvided": ["item 1", "item 2", ...],
    "notes": "additional notes"
  },
  "lightingSchedule": [
    {
      "type": "A",
      "description": "2x4 LED Troffer",
      "manufacturer": "Lithonia",
      "model": "2BLT4-40L-ADP-LP840",
      "quantity": 25,
      "wattage": "40W",
      "voltage": "120V",
      "mounting": "Recessed",
      "notes": "5000K CCT"
    }
  ],
  "panelSchedule": [
    {
      "panelId": "LP-1",
      "location": "Electrical Room",
      "voltage": "120/208V",
      "phases": "3PH",
      "main": "225A",
      "circuits": 42,
      "feedFrom": "Service",
      "notes": "MLO Panel"
    }
  ],
  "keyNotes": ["note 1", "note 2", ...],
  "scope": {
    "includedWork": ["item 1", "item 2", ...],
    "excludedWork": ["item 1", "item 2", ...]
  }
}

Be thorough and extract all available information. If information is not found, use empty arrays or "Not specified" for that section.`;

    // Convert PDF pages to base64 images for analysis
    // Note: OpenAI's vision model can analyze images
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4 with vision
        messages: [
          {
            role: 'system',
            content: 'You are an expert electrical estimator who analyzes construction drawings and extracts key information for bidding purposes. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1 // Low temperature for more consistent/factual responses
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let analysis: ProjectAnalysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonContent);
      analysis = {
        assumptions: parsed.assumptions || [],
        fixtureResponsibility: parsed.fixtureResponsibility || {
          ownerProvided: [],
          contractorProvided: [],
          notes: ''
        },
        lightingSchedule: parsed.lightingSchedule || [],
        panelSchedule: parsed.panelSchedule || [],
        keyNotes: parsed.keyNotes || [],
        scope: parsed.scope || {
          includedWork: [],
          excludedWork: []
        },
        rawResponse: content
      };
    } catch (parseError) {
      // If JSON parsing fails, return structured data from the text response
      analysis = {
        assumptions: [],
        fixtureResponsibility: {
          ownerProvided: [],
          contractorProvided: [],
          notes: ''
        },
        lightingSchedule: [],
        panelSchedule: [],
        keyNotes: [],
        scope: {
          includedWork: [],
          excludedWork: []
        },
        rawResponse: content
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing drawings with OpenAI:', error);
    throw error;
  }
}

export async function analyzeDrawingsWithImages(
  imageDataUrls: string[],
  apiKey: string
): Promise<ProjectAnalysis> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('OpenAI API key is required');
  }

  if (!imageDataUrls || imageDataUrls.length === 0) {
    throw new Error('No images provided for analysis');
  }

  try {
    const prompt = `You are an expert electrical estimator analyzing construction drawings.
Analyze these electrical drawings and extract the following information in a structured format:

1. PROJECT ASSUMPTIONS:
   - List all key assumptions mentioned in the drawings
   - Include notes about existing conditions
   - Any clarifications or questions noted

2. FIXTURE RESPONSIBILITY:
   - Which fixtures are OWNER PROVIDED (e.g., light fixtures by owner)
   - Which fixtures are CONTRACTOR PROVIDED (e.g., wiring, boxes by contractor)
   - Any specific notes about fixture responsibilities

3. LIGHTING SCHEDULE:
   - Extract complete lighting fixture schedule
   - Include: Type, Description, Manufacturer, Model, Quantity, Wattage, Voltage, Mounting
   - Format as a structured list

4. PANEL SCHEDULE:
   - Extract all panel information
   - Include: Panel ID, Location, Voltage, Phases, Main Breaker, Circuit Count, Fed From
   - Format as a structured list

5. KEY NOTES:
   - Important general notes
   - Code requirements
   - Coordination notes

6. SCOPE OF WORK:
   - What work IS included
   - What work IS NOT included (exclusions)

Provide the response in valid JSON format following this structure:
{
  "assumptions": ["assumption 1", "assumption 2"],
  "fixtureResponsibility": {
    "ownerProvided": ["item 1"],
    "contractorProvided": ["item 1"],
    "notes": "details"
  },
  "lightingSchedule": [{
    "type": "A",
    "description": "LED Troffer",
    "manufacturer": "Lithonia",
    "model": "ABC123",
    "quantity": 25,
    "wattage": "40W",
    "voltage": "120V",
    "mounting": "Recessed",
    "notes": ""
  }],
  "panelSchedule": [{
    "panelId": "LP-1",
    "location": "Elec Room",
    "voltage": "120/208V",
    "phases": "3PH",
    "main": "225A",
    "circuits": 42,
    "feedFrom": "Service",
    "notes": ""
  }],
  "keyNotes": ["note 1"],
  "scope": {
    "includedWork": ["item 1"],
    "excludedWork": ["item 1"]
  }
}`;

    // Prepare messages with images
    const imageMessages = imageDataUrls.slice(0, 10).map(url => ({
      type: 'image_url',
      image_url: {
        url: url,
        detail: 'high'
      }
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert electrical estimator who analyzes construction drawings and extracts key information for bidding purposes. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageMessages
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let jsonContent = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonContent);
    const analysis: ProjectAnalysis = {
      assumptions: parsed.assumptions || [],
      fixtureResponsibility: parsed.fixtureResponsibility || {
        ownerProvided: [],
        contractorProvided: [],
        notes: ''
      },
      lightingSchedule: parsed.lightingSchedule || [],
      panelSchedule: parsed.panelSchedule || [],
      keyNotes: parsed.keyNotes || [],
      scope: parsed.scope || {
        includedWork: [],
        excludedWork: []
      },
      rawResponse: content
    };

    return analysis;
  } catch (error) {
    console.error('Error analyzing drawings with OpenAI:', error);
    throw error;
  }
}

export function getOpenAIApiKey(): string | null {
  return localStorage.getItem('openai_api_key');
}

export function setOpenAIApiKey(apiKey: string): void {
  if (apiKey && apiKey.trim()) {
    localStorage.setItem('openai_api_key', apiKey.trim());
  } else {
    localStorage.removeItem('openai_api_key');
  }
}
