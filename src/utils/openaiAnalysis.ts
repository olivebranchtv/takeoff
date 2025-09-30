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
  drawingPages: DrawingPageAnalysis[];
  rawResponse: string;
}

export interface DrawingPageAnalysis {
  pageNumber: number;
  pageType: 'lighting_schedule' | 'panel_schedule' | 'floor_plan' | 'details' | 'notes' | 'cover' | 'unknown';
  title?: string;
  description: string;
  findings: string[];
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

CRITICAL RULE: ABSOLUTE ACCURACY - NO GUESSING
- ONLY extract information that is EXPLICITLY VISIBLE in the drawings
- If information is not present or unclear, leave it empty or null
- DO NOT infer, assume, or guess based on industry standards
- DO NOT fill in typical values - only report what you can actually see
- If you cannot read something clearly, leave it blank
- Better to have empty data than incorrect guessed data

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
   - Extract EVERY SINGLE ROW from the lighting fixture schedule table
   - Look for tables with headers like "TYPE", "DESCRIPTION", "LAMP", "VOLT", "WATT", "MANUFACTURER", "MODEL"
   - Read ALL fixture types listed (L1, L2, EM, EE, EMX, A, B, C, etc.)
   - Include: Type, Description, Manufacturer, Model, Quantity, Wattage, Voltage, Mounting
   - Copy the exact text from each cell - do not paraphrase or summarize
   - If a cell is empty or has "---", record it as empty
   - Count ALL rows in the schedule - do not stop early

4. PANEL SCHEDULE:
   - Extract EVERY SINGLE PANEL from the panel schedule
   - Look for panel schedules with circuit breaker listings and detailed panel information
   - Read ALL panels shown (LP-1, LP-2, PP-1, DP-1, etc.)
   - Include: Panel ID, Location, Voltage, Phases, Main Breaker, Circuit Count, Fed From
   - Copy the exact information from each panel - DO NOT GUESS OR INFER
   - If a panel property is not visible, leave it empty or null
   - Do not calculate or assume circuit counts - only report what is explicitly shown
   - Do not assume voltage or phases - only report what is written
   - Count ALL panels in the schedule - do not stop early

5. KEY NOTES:
   - Important general notes
   - Code requirements
   - Coordination notes

6. SCOPE OF WORK:
   - ONLY extract scope of work that is EXPLICITLY STATED in the drawings
   - Look for sections titled: "SCOPE OF WORK", "CONTRACTOR RESPONSIBILITIES", "INCLUDED WORK", "EXCLUDED WORK", "GENERAL NOTES"
   - Copy the exact text from these sections - do not paraphrase
   - Included Work: What the electrical contractor IS responsible for (explicitly stated)
   - Excluded Work: What IS NOT included in contractor's scope (explicitly stated)
   - If no scope of work section is found, return empty arrays
   - DO NOT ASSUME typical construction scope - only report what is written

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
    "includedWork": ["Furnish and install all lighting fixtures per schedule", "Provide all branch circuit wiring"],
    "excludedWork": ["Fire alarm system (by others)", "Low voltage/data cabling (by others)"]
  }
}

IMPORTANT NOTES:
- If panel schedule is not found or not clear, return empty array []
- If scope of work section does not exist, return empty arrays for includedWork and excludedWork
- If lighting schedule is not present, return empty array []
- Use empty string "" for missing text fields
- Use null for missing numeric fields
- If you cannot determine information with certainty, leave it empty - DO NOT GUESS

Be thorough and extract all available information. If information is not found, use empty arrays for that section.`;

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
        max_tokens: 8000,
        temperature: 0.05 // Low temperature for more consistent/factual responses
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
        drawingPages: parsed.drawingPages || [],
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
        drawingPages: [],
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

CRITICAL RULE: ABSOLUTE ACCURACY - NO GUESSING
- ONLY extract information that is EXPLICITLY VISIBLE in the drawings
- If information is not present or unclear, leave it empty or null
- DO NOT infer, assume, or guess based on industry standards
- DO NOT fill in typical values - only report what you can actually see
- If you cannot read something clearly, leave it blank
- Better to have empty data than incorrect guessed data

CRITICAL INSTRUCTIONS:
- Analyze EVERY SINGLE PAGE provided
- Find and extract the ACTUAL lighting schedule (not assumptions)
- Find and extract the ACTUAL panel schedule (not assumptions)
- Identify what the electrical contractor is responsible for (scope of work)
- Describe what you see on each drawing page
- DO NOT make industry standard assumptions
- DO NOT guess or infer information not explicitly shown
- ONLY report what is actually visible in the documents

LIGHTING SCHEDULE EXTRACTION:
- Read the ENTIRE lighting fixture schedule table from top to bottom
- Extract EVERY ROW - do not skip any fixture types
- Common fixture types include: L1, L2, L3, EM, EE, EMX, A, B, C, D, E1, E2, etc.
- If the schedule has 10 rows, you must extract all 10 fixtures
- If the schedule has 4 rows (like L1, EM, EE, EMX), you must extract all 4
- Look carefully at multi-line descriptions - they may span multiple lines
- Copy manufacturer names exactly as shown (Lithonia, Philips, Cooper, etc.)
- Record "TBD" or "---" or blank exactly when cells are empty
- Double-check you extracted every single row before finishing

For each page, identify:
1. Page type (lighting schedule, panel schedule, floor plan, details, notes, cover)
2. What information is actually shown
3. Key findings from that page

Extract the following information:

1. PROJECT ASSUMPTIONS:
   - ONLY list assumptions explicitly stated in the drawings
   - Include notes about existing conditions if stated
   - Any clarifications or questions noted in the documents

2. FIXTURE RESPONSIBILITY:
   - Which fixtures are explicitly marked as OWNER PROVIDED
   - Which fixtures are explicitly marked as CONTRACTOR PROVIDED
   - Specific notes about fixture responsibilities from the drawings

3. LIGHTING SCHEDULE:
   - Extract EVERY SINGLE ROW from the lighting fixture schedule table
   - Look for tables with headers like "TYPE", "DESCRIPTION", "LAMP", "VOLT", "WATT", "MANUFACTURER", "MODEL"
   - Read ALL fixture types listed (L1, L2, EM, EE, EMX, A, B, C, etc.)
   - Include: Type, Description, Manufacturer, Model, Quantity, Wattage, Voltage, Mounting
   - Copy the exact text from each cell - do not paraphrase or summarize
   - If a cell is empty or has "---", record it as empty
   - Count ALL rows in the schedule - do not stop early
   - If no lighting schedule is found, return empty array

4. PANEL SCHEDULE:
   - Extract EVERY SINGLE PANEL from the panel schedule
   - Look for panel schedules with circuit breaker listings and detailed panel information
   - Read ALL panels shown (LP-1, LP-2, PP-1, DP-1, etc.)
   - Include: Panel ID, Location, Voltage, Phases, Main Breaker, Circuit Count, Fed From
   - Copy the exact information from each panel - DO NOT GUESS OR INFER
   - If a panel property is not visible, leave it empty or null
   - Do not calculate or assume circuit counts - only report what is explicitly shown
   - Do not assume voltage or phases - only report what is written
   - Count ALL panels in the schedule - do not stop early
   - If no panel schedule is found, return empty array

5. KEY NOTES:
   - Important general notes actually written on the drawings
   - Code requirements stated in the drawings
   - Coordination notes from the documents

6. SCOPE OF WORK:
   - ONLY extract scope of work that is EXPLICITLY STATED in the drawings
   - Look for sections titled: "SCOPE OF WORK", "CONTRACTOR RESPONSIBILITIES", "INCLUDED WORK", "EXCLUDED WORK", "GENERAL NOTES"
   - Copy the exact text from these sections - do not paraphrase
   - Included Work: What the electrical contractor IS responsible for (explicitly stated)
   - Excluded Work: What IS NOT included in contractor's scope (explicitly stated)
   - If no scope of work section is found, return empty arrays
   - DO NOT ASSUME typical construction scope - only report what is written
   - If scope is unclear or not stated, return empty arrays with a note

7. DRAWING PAGES:
   - For each page, provide:
     - Page number
     - Page type
     - Title (if visible)
     - Description of what is shown
     - Key findings from that page

Provide the response in valid JSON format following this structure:
{
  "assumptions": ["assumption 1", "assumption 2"],
  "fixtureResponsibility": {
    "ownerProvided": ["item 1"],
    "contractorProvided": ["item 1"],
    "notes": "details"
  },
  "lightingSchedule": [{
    "type": "L1",
    "description": "2X4 RECESSED LED TROFFER LIGHT, DIMMABLE MANUFACTURER TBD",
    "manufacturer": "",
    "model": "",
    "quantity": null,
    "wattage": "35",
    "voltage": "120",
    "mounting": "Recessed",
    "notes": ""
  }, {
    "type": "EM",
    "description": "EMERGENCY LED LIGHT WITH 90 MINUTES BATTERY PACK LITHONIA EU2L (WALL), ELR2 (CEILING), ELAQWP (OUTDOOR) SERIES OR EQUIVALENT",
    "manufacturer": "Lithonia",
    "model": "EU2L",
    "quantity": null,
    "wattage": "",
    "voltage": "120",
    "mounting": "Wall/Ceiling",
    "notes": ""
  }, {
    "type": "EE",
    "description": "LIGHT FIXTURE WITH 90 MINUTES EMERGENCY BATTERY PACK VERIFY WITH MANUFACTURER FOR OPTION/INVERTER IF NOT AVAILABLE",
    "manufacturer": "",
    "model": "",
    "quantity": null,
    "wattage": "",
    "voltage": "120",
    "mounting": "",
    "notes": ""
  }, {
    "type": "EMX",
    "description": "COMBINATION EMERGENCY LED LIGHT/EXIT SIGN 90 MINUTES BATTERY PACK LITHONIA ECC SERIES OR EQUIVALENT",
    "manufacturer": "Lithonia",
    "model": "ECC",
    "quantity": null,
    "wattage": "",
    "voltage": "120",
    "mounting": "",
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
    "includedWork": ["Furnish and install all lighting fixtures per schedule", "Provide all branch circuit wiring", "Install all panels and disconnects"],
    "excludedWork": ["Fire alarm system (by others)", "Low voltage/data cabling (by others)", "Main service entrance (by utility)"]
  },
  "drawingPages": [{
    "pageNumber": 1,
    "pageType": "cover",
    "title": "Electrical Plans",
    "description": "Cover sheet showing project title and drawing index",
    "findings": ["Project: ABC Building", "Contractor scope includes lighting and power"]
  }, {
    "pageNumber": 2,
    "pageType": "lighting_schedule",
    "title": "Lighting Fixture Schedule",
    "description": "Table showing all lighting fixture types with specifications",
    "findings": ["Type A: LED Troffer, Lithonia ABC123, 25 units", "Type B: Pendant Light, Philips XYZ456, 10 units"]
  }, {
    "pageNumber": 3,
    "pageType": "floor_plan",
    "title": "First Floor Lighting Plan",
    "description": "Floor plan showing lighting fixture locations and circuiting",
    "findings": ["Type A fixtures in main area", "Type B pendants over counter", "Wall switches near entrances"]
  }]
}

IMPORTANT NOTES:
- If panel schedule is not found or not clear, return empty array []
- If scope of work section does not exist, return empty arrays for includedWork and excludedWork
- If lighting schedule is not present, return empty array []
- Use empty string "" for missing text fields
- Use null for missing numeric fields
- If you cannot determine information with certainty, leave it empty - DO NOT GUESS`;

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
        max_tokens: 8000,
        temperature: 0.05
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
      drawingPages: parsed.drawingPages || [],
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
