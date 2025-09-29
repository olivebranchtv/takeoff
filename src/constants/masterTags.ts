// src/constants/masterTags.ts
export type MasterTag = {
  code: string;
  name: string;
  color: string;
  category: string;
};

export const DEFAULT_MASTER_TAGS: MasterTag[] = [
  // --------------------------- LIGHTS (interior/exterior) ---------------------------
  { code: "A", name: "Lights A", color: "#F97316", category: "Lights" },
  { code: "A1", name: "Lights A1 (Night Light)", color: "#F97316", category: "Lights" },
  { code: "B", name: "Lights B", color: "#F97316", category: "Lights" },
  { code: "C", name: "Lights C", color: "#F97316", category: "Lights" },
  { code: "D", name: "Lights D", color: "#F97316", category: "Lights" },
  { code: "E", name: "Lights E", color: "#F97316", category: "Lights" },
  { code: "F", name: "Lights F", color: "#F97316", category: "Lights" },
  { code: "G", name: "Lights G", color: "#F97316", category: "Lights" },
  { code: "H", name: "Lights H", color: "#F97316", category: "Lights" },
  { code: "I", name: "Lights I", color: "#F97316", category: "Lights" },
  { code: "J", name: "Lights J", color: "#F97316", category: "Lights" },
  { code: "K", name: "Lights K", color: "#F97316", category: "Lights" },
  { code: "L", name: "Lights L", color: "#F97316", category: "Lights" },
  { code: "M", name: "Lights M", color: "#F97316", category: "Lights" },
  { code: "N", name: "Lights N", color: "#F97316", category: "Lights" },
  { code: "O", name: "Lights O", color: "#F97316", category: "Lights" },
  { code: "P", name: "Lights P", color: "#F97316", category: "Lights" },
  { code: "Q", name: "Lights Q", color: "#F97316", category: "Lights" },
  { code: "R", name: "Lights R", color: "#F97316", category: "Lights" },
  { code: "S", name: "Lights S", color: "#F97316", category: "Lights" },
  { code: "T", name: "Lights T", color: "#F97316", category: "Lights" },
  { code: "U", name: "Lights U", color: "#F97316", category: "Lights" },
  { code: "V", name: "Lights V", color: "#F97316", category: "Lights" },
  { code: "W", name: "Lights W", color: "#F97316", category: "Lights" },
  { code: "X", name: "Lights X", color: "#F97316", category: "Lights" },
  { code: "Y", name: "Lights Y", color: "#F97316", category: "Lights" },
  { code: "Z", name: "Lights Z", color: "#F97316", category: "Lights" },
  { code: "LT-2X4", name: "Fixture 2x4 LED", color: "#F97316", category: "Lights" },
  { code: "LT-2X2", name: "Fixture 2x2 LED", color: "#F97316", category: "Lights" },
  { code: "LT-1X4", name: "Fixture 1x4 LED", color: "#F97316", category: "Lights" },
  { code: "LT-DN", name: "Downlight (Round/Square)", color: "#F97316", category: "Lights" },
  { code: "LT-STRIP", name: "Strip/Wrap", color: "#F97316", category: "Lights" },
  { code: "LT-HB", name: "High Bay", color: "#F97316", category: "Lights" },
  { code: "LT-PEND", name: "Pendant/Decorative", color: "#F97316", category: "Lights" },
  { code: "LT-LINEAR", name: "Linear Slot", color: "#F97316", category: "Lights" },
  { code: "LT-TRACK", name: "Track + Head", color: "#F97316", category: "Lights" },
  { code: "LT-UC", name: "Under-Cabinet", color: "#F97316", category: "Lights" },
  { code: "LT-COVE", name: "Cove/Accent", color: "#F97316", category: "Lights" },
  { code: "EX", name: "Exit Sign", color: "#F97316", category: "Lights" },
  { code: "EXC", name: "Exit/Emergency Combo", color: "#F97316", category: "Lights" },
  { code: "EM", name: "Emergency Light (Unit)", color: "#F97316", category: "Lights" },
  { code: "EM-RH", name: "Remote Head (per head)", color: "#F97316", category: "Lights" },
  { code: "LT-WP", name: "Wallpack (Exterior)", color: "#F97316", category: "Lights" },
  { code: "LT-CANOPY", name: "Canopy Light", color: "#F97316", category: "Lights" },
  { code: "LT-STEP", name: "Step/Path Light", color: "#F97316", category: "Lights" },

  // --------------------------- RECEPTACLES ---------------------------
  { code: "REC", name: "Duplex Receptacle", color: "#3B82F6", category: "Receptacles" },
  { code: "QR", name: "Quad Receptacle", color: "#3B82F6", category: "Receptacles" },
  { code: "REC-GFCI", name: "GFCI Receptacle", color: "#1D4ED8", category: "Receptacles" },
  { code: "REC-WP-GFCI", name: "GFCI (Weatherproof)", color: "#1D4ED8", category: "Receptacles" },
  { code: "REC-IG", name: "Isolated Ground Receptacle", color: "#1E40AF", category: "Receptacles" },
  { code: "REC-USB", name: "USB Receptacle", color: "#2563EB", category: "Receptacles" },
  { code: "REC-FLR", name: "Floor Box Power", color: "#2563EB", category: "Receptacles" },
  { code: "REC-FURN", name: "Furniture Feed", color: "#2563EB", category: "Receptacles" },
  { code: "REC-208", name: "208/240V Receptacle", color: "#1E40AF", category: "Receptacles" },
  { code: "REC-TL-20", name: "Twist-Lock 20A", color: "#1E40AF", category: "Receptacles" },
  { code: "REC-TL-30", name: "Twist-Lock 30A", color: "#1E40AF", category: "Receptacles" },

  // --------------------------- SWITCHES ---------------------------
  { code: "SW", name: "Switch (SP)", color: "#60A5FA", category: "Switches" },
  { code: "SW-3W", name: "Switch (3-way)", color: "#60A5FA", category: "Switches" },
  { code: "SW-4W", name: "Switch (4-way)", color: "#60A5FA", category: "Switches" },
  { code: "KS", name: "Key Switch", color: "#60A5FA", category: "Switches" },
  { code: "SPST", name: "SPST", color: "#60A5FA", category: "Switches" },
  { code: "DPST", name: "DPST", color: "#60A5FA", category: "Switches" },

  // … (continue with Stub-Ups, Fire Alarm, Breakers, Panels, Disconnects, Raceways, Conductors, Data/Comm, Security, AV, BAS, Site Power, Demo, Miscellaneous exactly as you listed above)
];
