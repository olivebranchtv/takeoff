/**
 * OpenAI Document Analysis Utility
 * Analyzes electrical drawings and extracts key information
 */

export interface ProjectAnalysis {
  assumptions: {
    fixtureSupply: string[];
    electricalScope: string[];
    lightingScheduleNotes: string[];
    fixturesList: string[];
    otherPages: string[];
    lightingControls: string[];
    fixtureCountsBasis: string[];
    wasteFactors: string[];
    laborRates: string[];
    qaNotes: string[];
    other: string[];
  };
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

1. PROJECT ASSUMPTIONS (DETAILED BREAKDOWN):
   Create comprehensive assumptions similar to a professional estimator's notes. Include:

   A. Fixture Supply & Responsibility:
      - Who provides fixtures (Owner vs Contractor)
      - Specific items like "All light fixtures (A-F), lighting control panel & accessories, occupancy sensors, photocells, ballasts, and site light poles furnished (AutoZone)"
      - Make it clear and detailed

   B. Electrical Contractor Scope:
      - What the contractor installs: "Electrical Contractor scope is installation only, including conduit, wire, junction boxes, supports, and terminations"
      - Detailed work breakdown

   C. Lighting Fixture Schedule:
      - Where the schedule is located: "The only Lighting Fixture Schedule is located on Sheet E-3 'Lighting Plans and Details'"
      - Any notes about schedule location or completeness

   D. Fixtures Listed (detailed breakdown):
      - Type A: 2x4 LED Troffer, 30W
      - Type B: 2x4 LED Troffer, 20W
      - Type C: 8' LED Strip, 40W
      - Include ALL fixture types with descriptions and wattages
      - Note any special fixtures like emergency packs

   E. Other Pages:
      - "No other sheets (E-1, E-2, E-4, E-5, E-6) contain fixture schedules"
      - "They only show plan symbols and control details to be counted"

   F. Lighting Controls (Devices):
      - "M1 Occupancy Sensors are Owner-furnished and must be counted under devices/controls, not fixtures"
      - "Recommended labor unit: 0.75-1.0 hrs each for install"
      - "Photocells and control panel are also Owner-furnished; EC provides wiring and mounting"

   G. Fixture Counts Basis:
      - "Counts will be based on plan symbols shown on E-1 (Lighting Plan) and E-2 (Power/Lighting Plan)"
      - "Any discrepancy between schedule and plan will be flagged"

   H. Waste Factors / Labor Basis:
      - "Wire 10%, conduit 5%, devices 2%"
      - "Labor rate: $30/hr"
      - "Labor unit references: [specify]"

   I. QA Notes:
      - Any quality assurance or review notes
      - Questions to be resolved
      - Clarifications needed

2. FIXTURE RESPONSIBILITY - EXTRACT ALL DETAILS:
   - Look for sections titled "OWNER FURNISHED", "BY OWNER", "FURNISHED BY OTHERS", "CONTRACTOR FURNISHED", "BY CONTRACTOR"
   - Owner/Owner-Furnished items: List ALL items explicitly stated as provided by owner (e.g., "ALL LIGHT FIXTURES", "LIGHTING CONTROL PANEL & ACC.", "OCCUPANCY SENSING LIGHT SWITCHES", "PHOTOCELLS", "BALLASTS", "SITE LIGHT POLES AND BRACKETS")
   - Contractor-Furnished items: List what contractor provides (e.g., "ALL WIRING", "BOXES", "CONDUIT", "INSTALLATION LABOR")
   - Contractor work/responsibilities: What work the electrical contractor performs (e.g., "Install and wire lighting", "Install controls", "Connect to lighting control panel")
   - Copy the EXACT wording from the drawings - do not paraphrase
   - Include all details about who provides what materials and who performs what work
   - Any specific notes about fixture responsibilities or division of work

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
        assumptions: parsed.assumptions || {
          fixtureSupply: [],
          electricalScope: [],
          lightingScheduleNotes: [],
          fixturesList: [],
          otherPages: [],
          lightingControls: [],
          fixtureCountsBasis: [],
          wasteFactors: [],
          laborRates: [],
          qaNotes: [],
          other: []
        },
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
        assumptions: {
          fixtureSupply: [],
          electricalScope: [],
          lightingScheduleNotes: [],
          fixturesList: [],
          otherPages: [],
          lightingControls: [],
          fixtureCountsBasis: [],
          wasteFactors: [],
          laborRates: [],
          qaNotes: [],
          other: []
        },
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

LIGHTING SCHEDULE EXTRACTION - CRITICAL:
- Read the ENTIRE lighting fixture schedule table from top to bottom
- Extract EVERY ROW - do not skip any fixture types
- Common fixture types include: L1, L2, L3, EM, EE, EMX, A, B, C, D, E1, E2, etc.
- COPY THE EXACT TEXT FROM THE SCHEDULE - DO NOT PARAPHRASE OR SIMPLIFY
- If the TYPE column says "L1", use "L1" not "L" or "L-1"
- If the TYPE column says "EM", use "EM" not "E1" or "EMERGENCY"
- If the TYPE column says "EE", use "EE" not "E2" or "EXIT"
- If the TYPE column says "EMX", use "EMX" not "E3" or "COMBO"
- Copy the DESCRIPTION exactly as written, word for word, including all caps
- If description says "MANUFACTURER TBD", include those exact words
- If description says "LITHONIA EU2L (WALL), ELR2 (CEILING)", include the complete text
- Look carefully at multi-line descriptions - they may span multiple lines
- Copy manufacturer names exactly as shown (Lithonia, Philips, Cooper, etc.)
- Record "TBD" or "---" or blank exactly when cells are empty
- If a cell contains "---", leave that field empty or null
- Double-check you extracted every single row before finishing
- COUNT the rows in the schedule and verify you extracted that exact number

For each page, identify:
1. Page type (lighting schedule, panel schedule, floor plan, details, notes, cover)
2. What information is actually shown
3. Key findings from that page

Extract the following information:

1. PROJECT ASSUMPTIONS (DETAILED BREAKDOWN):
   Create comprehensive assumptions similar to a professional estimator's notes. Organize into these categories:

   A. Fixture Supply & Responsibility:
      - Who provides fixtures (Owner vs Contractor)
      - Specific items provided by each party
      - Example: "All light fixtures (A-F), lighting control panel & accessories, occupancy sensors, photocells, ballasts, and site light poles furnished (AutoZone)"

   B. Electrical Contractor Scope:
      - What the contractor installs
      - Example: "Electrical Contractor scope is installation only, including conduit, wire, junction boxes, supports, and terminations"

   C. Lighting Fixture Schedule:
      - Where the schedule is located
      - Example: "The only Lighting Fixture Schedule is located on Sheet E-3 'Lighting Plans and Details'"

   D. Fixtures Listed (detailed breakdown with specs):
      - List each fixture type with full description and wattage
      - Example:
        * Type A: 2x4 LED Troffer, 30W
        * Type B: 2x4 LED Troffer, 20W
        * Type C: 8' LED Strip, 40W
        * Type D: LED Downlight, 15W
        * Type E: Exterior Wall Pack, 50W LED
        * Type F: Pole-mounted Site Fixture, 150W LED
        * Type X (emergency pack): "install battery pack in designated fixtures," not a separate fixture line

   E. Other Pages:
      - Notes about which pages contain schedules vs symbols
      - Example: "No other sheets (E-1, E-2, E-4, E-5, E-6) contain fixture schedules. They only show plan symbols and control details to be counted"

   F. Lighting Controls (Devices):
      - Detailed notes about devices, sensors, controls
      - Owner-furnished vs contractor-furnished
      - Labor units for each device type
      - Example: "M1 Occupancy Sensors are Owner-furnished and must be counted under devices/controls, not fixtures. Recommended labor unit: 0.75-1.0 hrs each for install. Photocells and control panel are also Owner-furnished; EC provides wiring and mounting"

   G. Fixture Counts Basis:
      - Where counts come from (which sheets)
      - How discrepancies will be handled
      - Example: "Counts will be based on plan symbols shown on E-1 (Lighting Plan) and E-2 (Power/Lighting Plan). Any discrepancy between schedule and plan will be flagged"

   H. Waste Factors / Labor Basis:
      - Specific waste percentages
      - Labor rates
      - Unit references
      - Example: "Wire 10%, conduit 5%, devices 2%. Labor rate: $30/hr. Labor unit references: [specify source]"

   I. Labor Rate & Unit References:
      - Specific labor rates
      - Source of labor units

   J. QA Notes:
      - Quality assurance items
      - Questions to be resolved
      - Clarifications needed
      - Items to verify in field

2. FIXTURE RESPONSIBILITY - EXTRACT ALL DETAILS:
   - Look for sections titled "OWNER FURNISHED", "BY OWNER", "FURNISHED BY OTHERS", "CONTRACTOR FURNISHED", "BY CONTRACTOR"
   - Owner/Owner-Furnished items: List ALL items explicitly stated as provided by owner (e.g., "ALL LIGHT FIXTURES", "LIGHTING CONTROL PANEL & ACC.", "OCCUPANCY SENSING LIGHT SWITCHES", "PHOTOCELLS", "BALLASTS", "SITE LIGHT POLES AND BRACKETS")
   - Contractor-Furnished items: List what contractor provides (e.g., "ALL WIRING", "BOXES", "CONDUIT", "INSTALLATION LABOR")
   - Contractor work/responsibilities: What work the electrical contractor performs (e.g., "Install and wire lighting", "Install controls", "Connect to lighting control panel")
   - Copy the EXACT wording from the drawings - do not paraphrase
   - Include all details about who provides what materials and who performs what work
   - Specific notes about fixture responsibilities or division of work from the drawings

3. LIGHTING SCHEDULE - READ EXACTLY AS WRITTEN:
   - Extract EVERY SINGLE ROW from the lighting fixture schedule table
   - Look for tables with headers like "TYPE", "DESCRIPTION", "LAMP", "VOLT", "WATT", "MANUFACTURER", "MODEL"
   - Read ALL fixture types listed (L1, L2, EM, EE, EMX, A, B, C, etc.)
   - THE TYPE MUST MATCH EXACTLY: If schedule says "EM", write "EM" not "E1"
   - THE TYPE MUST MATCH EXACTLY: If schedule says "EE", write "EE" not "E2"
   - THE TYPE MUST MATCH EXACTLY: If schedule says "EMX", write "EMX" not "E3"
   - Include: Type, Description, Manufacturer, Model, Quantity, Wattage, Voltage, Mounting
   - Copy the COMPLETE description text - do not shorten or paraphrase
   - If description spans multiple lines, include all text
   - If a cell is empty or has "---", leave that field empty/null
   - Do not add lumens, color temperatures, or specs not in the schedule
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
  "assumptions": {
    "fixtureSupply": ["All light fixtures (A-F) furnished by Owner (AutoZone)", "Lighting control panel & accessories furnished by Owner"],
    "electricalScope": ["Electrical Contractor scope is installation only, including conduit, wire, junction boxes, supports, and terminations"],
    "lightingScheduleNotes": ["The only Lighting Fixture Schedule is located on Sheet E-3 'Lighting Plans and Details'"],
    "fixturesList": ["Type A: 2x4 LED Troffer, 30W", "Type B: 2x4 LED Troffer, 20W", "Type C: 8' LED Strip, 40W", "Type D: LED Downlight, 15W"],
    "otherPages": ["No other sheets (E-1, E-2, E-4, E-5, E-6) contain fixture schedules", "They only show plan symbols and control details to be counted"],
    "lightingControls": ["M1 Occupancy Sensors are Owner-furnished and must be counted under devices/controls, not fixtures", "Recommended labor unit: 0.75-1.0 hrs each for install", "Photocells and control panel are also Owner-furnished; EC provides wiring and mounting"],
    "fixtureCountsBasis": ["Counts will be based on plan symbols shown on E-1 (Lighting Plan) and E-2 (Power/Lighting Plan)", "Any discrepancy between schedule and plan will be flagged"],
    "wasteFactors": ["Wire 10%, conduit 5%, devices 2%"],
    "laborRates": ["Labor rate: $30/hr", "Labor unit references: NECA Manual of Labor Units"],
    "qaNotes": ["Verify all fixture types with Owner before ordering", "Confirm control sequence with electrical engineer"],
    "other": []
  },
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
      assumptions: parsed.assumptions || {
        fixtureSupply: [],
        electricalScope: [],
        lightingScheduleNotes: [],
        fixturesList: [],
        otherPages: [],
        lightingControls: [],
        fixtureCountsBasis: [],
        wasteFactors: [],
        laborRates: [],
        qaNotes: [],
        other: []
      },
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