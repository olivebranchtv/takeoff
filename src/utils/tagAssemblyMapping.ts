/**
 * Tag to Assembly Auto-Mapping System
 * Maps common tag codes to appropriate assemblies for automatic pricing
 */

/**
 * Returns the best assembly ID for a given tag code
 * This enables automatic pricing lookup in the BOM
 */
export function getAssemblyIdForTag(tagCode: string, tagCategory?: string): string | undefined {
  const code = tagCode.toUpperCase().trim();
  const category = (tagCategory || '').toLowerCase();

  // ===== LIGHTS =====
  if (category.includes('light')) {
    // Specific fixture types
    if (code.includes('2X4') || code === 'LT-2X4') return 'light-troffer-2x4-led';
    if (code.includes('2X2') || code === 'LT-2X2') return 'light-troffer-2x2-led';
    if (code.includes('1X4') || code === 'LT-1X4') return 'light-troffer-2x4-led';
    if (code.includes('DN') || code.includes('DOWN') || code === 'LT-DN') return 'light-downlight-6in';
    if (code.includes('HB') || code.includes('HIGHBAY') || code === 'LT-HB') return 'light-highbay-led';
    if (code.includes('STRIP') || code === 'LT-STRIP') return 'light-troffer-2x4-led';
    if (code.includes('PEND') || code === 'LT-PEND') return 'light-troffer-2x4-led';
    if (code.includes('LINEAR') || code === 'LT-LINEAR') return 'light-troffer-2x4-led';
    if (code.includes('TRACK') || code === 'LT-TRACK') return 'light-troffer-2x4-led';
    if (code.includes('UC') || code === 'LT-UC') return 'light-troffer-2x4-led';
    if (code.includes('COVE') || code === 'LT-COVE') return 'light-troffer-2x4-led';
    if (code.includes('WP') || code === 'LT-WP') return 'light-troffer-2x4-led';
    if (code.includes('CANOPY') || code === 'LT-CANOPY') return 'light-troffer-2x4-led';
    if (code.includes('STEP') || code === 'LT-STEP') return 'bollard-light';

    // Letter codes A-Z for lights
    if (code.match(/^[A-Z]$/) || code.match(/^[A-Z]\d+$/)) return 'light-troffer-2x4-led';

    // Default light
    return 'light-troffer-2x4-led';
  }

  // ===== EMERGENCY & EXIT =====
  if (code === 'EM' || code.includes('EMER')) return 'light-emergency-led';
  if (code === 'EM-RH') return 'light-emergency-led'; // remote head
  if (code === 'EX' || code.includes('EXIT')) return 'light-exit-sign';
  if (code === 'EXC') return 'light-exit-sign'; // exit/emergency combo
  if (code === 'EE' && category.includes('light')) return 'light-emergency-led';

  // ===== RECEPTACLES =====
  if (code.includes('REC') || category.includes('recept')) {
    if (code.includes('GFCI') || code.includes('GFI')) {
      if (code.includes('WP') || code.includes('WEATHER')) return 'recep-wp-20a';
      return 'recep-gfci-20a';
    }
    if (code.includes('IG') || code.includes('ISO')) return 'recep-iso-gnd-20a';
    if (code.includes('FLOOR') || code.includes('FLR')) return 'recep-floor-20a';
    if (code.includes('USB')) return 'recep-usb-combo';
    if (code.includes('FURN')) return 'recep-20a-std';
    if (code.includes('208') || code.includes('240')) return 'recep-208v-20a';
    if (code.includes('TL') || code.includes('TWIST')) {
      if (code.includes('30')) return 'recep-twist-lock-30a';
      return 'recep-twist-lock-30a';
    }
    if (code.includes('20') || code === 'REC') return 'recep-20a-std';
    if (code.includes('15')) return 'recep-15a-std';
    return 'recep-20a-std'; // default
  }

  // Quad receptacle
  if (code === 'QR') return 'recep-20a-std';

  // ===== SWITCHES =====
  if (category.includes('switch')) {
    if (code.includes('3W') || code.includes('3WAY') || code === 'SW-3W') return 'switch-3way-20a';
    if (code.includes('4W') || code.includes('4WAY') || code === 'SW-4W') return 'switch-4way-20a';
    if (code.includes('OCC') || code.includes('SENSOR')) return 'switch-occ-sensor';
    if (code.includes('TIMER')) return 'switch-timer';
    if (code.includes('KEY') || code === 'KS') return 'switch-sp-20a';
    if (code === 'SPST' || code === 'DPST') return 'switch-sp-20a';
    return 'switch-sp-20a'; // default single pole
  }

  // ===== DIMMERS =====
  if (code.includes('DIM')) {
    if (code.includes('3W')) return 'dimmer-3w-600w';
    if (code.includes('4W')) return 'dimmer-4w-600w';
    if (code.includes('1000')) return 'dimmer-1000w';
    if (code.includes('1500')) return 'dimmer-1500w';
    if (code.includes('2000')) return 'dimmer-2000w';
    if (code.includes('WC') || code.includes('WALL')) return 'dimmer-wc';
    if (code.includes('ML') || code.includes('MULTI')) return 'dimmer-ml';
    return 'dimmer-sp-600w'; // default
  }

  // ===== FIRE ALARM =====
  if (category.includes('fire') || category.includes('alarm')) {
    if (code === 'SD' || code.includes('SMOKE')) return 'fa-smoke-detector';
    if (code === 'HD' || code.includes('HEAT')) return 'fa-smoke-detector';
    if (code === 'DD' || code.includes('DUCT')) return 'fa-smoke-detector';
    if (code === 'HS' || code === 'H' || code.includes('HORN') || code.includes('STROBE')) return 'fa-horn-strobe';
    if (code === 'PS' || code === 'MS' || code.includes('PULL')) return 'fa-pull-station';
    if (code.includes('RIL') || code.includes('INDICATOR')) return 'fa-horn-strobe';
    // Panels and modules don't have assemblies (custom gear)
    return undefined;
  }

  // ===== PANELS & GEAR =====
  if (code.includes('LP') || code.includes('PP') || code.includes('SP')) {
    // Panel sizing based on code
    if (code.includes('100') || code.includes('125')) return 'panel-100a';
    if (code.includes('200') || code.includes('225')) return 'panel-200a';
    if (code.includes('400')) return 'panel-400a';
    if (code.includes('600')) return 'panel-600a-mlo-3p';
    if (code.includes('800')) return 'panel-800a';
    return 'panel-200a'; // default
  }

  // ===== BREAKERS =====
  if (code.includes('BRK')) {
    if (code.includes('20/1')) return 'breaker-1p-20a';
    if (code.includes('20/2') || code.includes('20/3')) return 'breaker-2p-30a';
    if (code.includes('30')) return 'breaker-2p-30a';
    if (code.includes('100') || code.includes('125') || code.includes('150')) return 'breaker-3p-100a';
    return 'breaker-2p-30a'; // default
  }

  // ===== DISCONNECTS =====
  if (code.includes('DISC') || (code.includes('/') && code.match(/^\d+\/\d+/))) {
    if (code.includes('30')) return 'disc-30a-3p';
    if (code.includes('60')) return 'disc-60a-3p';
    if (code.includes('100')) return 'disc-100a-3p';
    if (code.includes('200')) return 'disconnect-100a-f';
    return 'disc-60a-3p'; // default
  }

  // ===== TRANSFORMERS =====
  if (code.includes('XFMR')) {
    // Custom equipment - no assembly
    return undefined;
  }

  // ===== DATA / COMMUNICATIONS =====
  if (code.includes('DATA') || code.includes('JACK')) {
    if (code.includes('6A')) return 'data-cat6a-jack';
    return 'data-cat6-jack';
  }
  if (code === 'WAP') return 'data-cat6-jack'; // WAP needs data jack + power
  if (code.includes('FIBER')) return 'data-fiber-jack';
  if (code.includes('COAX') || code === 'CATV') return 'data-coax-jack';

  // ===== SECURITY =====
  if (code === 'CAM' || code.includes('CAMERA')) return 'security-camera-ip';
  if (code === 'CARD' || code.includes('READER')) return 'security-card-reader';
  if (code === 'DC' || code.includes('DOOR CONTACT')) return 'security-door-contact';
  if (code === 'MAG' || code.includes('MAG LOCK')) return 'security-mag-lock';

  // ===== AV / SOUND =====
  if (code.includes('SPKR') || code.includes('SPEAKER')) return 'sound-speaker-70v';
  if (code.includes('PROJ') || code.includes('PROJECTOR')) return 'projector-outlet-ceiling';
  if (code.includes('DISPLAY')) return 'tv-mount-outlet';
  if (code.includes('VOL')) return 'switch-sp-20a'; // volume control

  // ===== SITE POWER =====
  if (code.includes('POLE')) return 'pole-light-photocell';
  if (code.includes('BOLLARD')) return 'bollard-light';
  if (code.includes('EVSE') || code.includes('EV')) return 'ev-charger-level2';

  // ===== STUB-UPS =====
  if (code === 'TP' || code === 'D' || code === 'FSU' || code === 'CATV') {
    return 'jbox-4x4'; // stub-up box
  }

  // ===== MISC BOXES =====
  if (code.includes('JBOX')) return 'jbox-4x4';
  if (code.includes('PULL') || code.includes('PB')) return 'jbox-pullbox-12x12';

  // Default: no assembly assigned
  return undefined;
}

/**
 * Apply auto-assembly mapping to a tag
 */
export function autoAssignAssembly(tag: { code: string; category?: string; assemblyId?: string }) {
  if (tag.assemblyId) return tag; // already has assembly

  const assemblyId = getAssemblyIdForTag(tag.code, tag.category);
  return { ...tag, assemblyId };
}
