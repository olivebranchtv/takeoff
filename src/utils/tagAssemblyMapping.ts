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

  // ===== OCCUPANCY SENSORS (Owner-Supplied from Lighting Schedule) =====
  // Check for M1, OS, or similar codes that indicate owner-supplied sensors
  if (code === 'M1' || code === 'OS' || code === 'M1-OS' ||
      (code.includes('M1') && (category.includes('light') || category.includes('sensor'))) ||
      (code.includes('OS') && (category.includes('light') || category.includes('sensor')))) {
    return 'light-occ-sensor-owner';
  }

  // ===== LIGHTS =====
  // ALL lighting tags get the standard installation assembly
  // This includes boxes, raceway, conductors, flex, and hardware
  if (category.includes('light')) {
    return 'light-standard-install';
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
      // Map to new Standard GFI Receptacle Assembly (database ID)
      return '836a6abd-8fc1-4a10-92fb-7273b9d12615';
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
  if (code.includes('BRK') || code === 'SPD') {
    if (code === 'SPD') return 'surge-protector-panel';
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
  if (code === 'WAP') return 'data-cat6-jack';
  if (code.includes('FIBER')) return 'data-fiber-jack';
  if (code.includes('COAX')) return 'data-coax-jack';
  if (code.includes('RACK')) {
    if (code.includes('2P') || code.includes('2-POST')) return 'data-rack-2post-7ft';
    if (code.includes('4P') || code.includes('4-POST')) return 'data-rack-4post-7ft';
  }
  if (code.includes('PATCH')) {
    if (code.includes('24')) return 'patch-panel-24port';
    if (code.includes('48')) return 'patch-panel-48port';
  }
  if (code.includes('JHOOK') || code === 'JHOOK-2') return 'jhook-2in';
  if (code.includes('LAD-RACK') || code.includes('LADDER')) {
    if (code.includes('12')) return 'ladder-rack-12in-10ft';
    if (code.includes('18')) return 'ladder-rack-18in-10ft';
  }

  // ===== WIREMOLD =====
  if (code === 'WM-3000') return 'wiremold-3000-10ft';
  if (code === 'WM-4000') return 'wiremold-4000-10ft';

  // ===== SECURITY =====
  if (code === 'CAM' || code.includes('CAMERA')) return 'security-camera-ip';
  if (code === 'CARD' || code.includes('READER')) return 'security-card-reader';
  if (code === 'DC' && category.includes('security')) return 'security-door-contact';
  if (code === 'MAG' || code.includes('MAG LOCK')) return 'security-mag-lock';
  if (code === 'NVR') return 'security-nvr-16ch';
  if (code === 'REX') return 'security-rex-button';
  if (code === 'SEC-PS') return 'security-power-supply';

  // ===== AV / SOUND =====
  if (code.includes('SPKR') || code.includes('SPEAKER')) return 'sound-speaker-70v';
  if (code.includes('PROJ') || code.includes('PROJECTOR')) return 'projector-outlet-ceiling';
  if (code.includes('DISPLAY')) return 'tv-mount-outlet';
  if (code === 'VOL') return 'av-volume-control';
  if (code === 'SCRN' || code.includes('SCREEN')) return 'av-motorized-screen';
  if (code === 'DSP-AMP' || code.includes('DSP')) return 'av-dsp-amplifier';
  if (code.includes('HDBaseT')) return 'av-hdbaset-txrx';
  if (code === 'AV-RACK') return 'av-rack-wall-12u';

  // ===== BAS / CONTROLS =====
  if (code === 'STAT' || code.includes('THERMOSTAT')) return 'bas-thermostat';
  if (code === 'TSENS') return 'bas-temp-sensor';
  if (code === 'HSENS') return 'bas-humidity-sensor';
  if (code === 'CO2') return 'bas-co2-sensor';
  if (code === 'DDC') return 'bas-ddc-controller';
  if (code === 'VAV-CTRL') return 'bas-vav-controller';
  if (code === 'BAS-PS') return 'bas-power-supply';

  // ===== SITE POWER =====
  if (code.includes('POLE') && !code.includes('HEAD')) return 'pole-light-photocell';
  if (code === 'SITE-LP-HEAD') return 'site-pole-head';
  if (code.includes('BOLLARD')) return 'bollard-light';
  if (code.includes('EVSE') || code.includes('EV')) return 'ev-charger-level2';
  if (code === 'SITE-HH') return 'site-handhole';

  // ===== DEMOLITION =====
  if (code === 'DEM-LT') return 'demo-light-fixture';
  if (code === 'DEM-SW') return 'demo-switch';
  if (code === 'DEM-PNL') return 'demo-panel';
  if (code === 'TEMP-PP') return 'temp-power-pole';

  // ===== STUB-UPS =====
  // NOTE: 'D' is excluded here because it conflicts with generic light tag 'D'
  // Use 'DATA-SU' or 'DSU' for data stub-ups instead
  if (code === 'TP' || code === 'DATA-SU' || code === 'DSU' || code === 'FSU' || (code === 'CATV' && category.includes('stub'))) {
    return 'jbox-4x4';
  }

  // ===== MISC BOXES =====
  if (code.includes('JBOX')) return 'jbox-4x4';
  if (code.includes('PULL') || code.includes('PB')) return 'jbox-pullbox-12x12';
  if (code === 'PLATE-BLK') return 'blank-plate-1g';
  if (code === 'LABEL') return 'label-nameplate';

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
