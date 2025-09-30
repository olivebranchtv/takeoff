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
  if (code.startsWith('L') || category.includes('light')) {
    if (code === 'L1' || code === 'A1') return 'light-troffer-2x2-led';
    if (code.match(/^L\d+$/) || code === 'A') return 'light-troffer-2x4-led';
    if (code.includes('2X4')) return 'light-troffer-2x4-led';
    if (code.includes('2X2')) return 'light-troffer-2x2-led';
    if (code.includes('DN') || code.includes('DOWN')) return 'light-downlight-6in';
    if (code.includes('HB') || code.includes('HIGHBAY')) return 'light-highbay-led';
    return 'light-troffer-2x4-led'; // default light
  }

  // ===== EMERGENCY & EXIT =====
  if (code === 'EM' || code.includes('EMER') || category.includes('emergency')) {
    return 'light-emergency-led';
  }
  if (code === 'EX' || code.includes('EXIT')) {
    return 'light-exit-sign';
  }
  if (code === 'EXC') {
    return 'light-exit-sign'; // exit/emergency combo
  }

  // ===== RECEPTACLES =====
  if (code.includes('REC') || code === 'EE' || category.includes('recept')) {
    if (code.includes('GFCI') || code.includes('GFI')) {
      if (code.includes('WP') || code.includes('WEATHER')) {
        return 'recep-wp-20a';
      }
      return 'recep-gfci-20a';
    }
    if (code.includes('IG') || code.includes('ISO')) {
      return 'recep-iso-gnd-20a';
    }
    if (code.includes('FLOOR')) {
      return 'recep-floor-20a';
    }
    if (code.includes('20A') || code.includes('20')) {
      return 'recep-20a-std';
    }
    if (code.includes('15A') || code.includes('15')) {
      return 'recep-15a-std';
    }
    return 'recep-20a-std'; // default receptacle
  }

  // Special case for EE (Equipment/Electrical - usually receptacles)
  if (code === 'EE') {
    return 'recep-20a-std';
  }

  // ===== SWITCHES =====
  if (code.includes('SW') || code.includes('SP') || category.includes('switch')) {
    if (code.includes('3W') || code.includes('3WAY')) {
      return 'switch-3way';
    }
    if (code.includes('4W') || code.includes('4WAY')) {
      return 'switch-4way';
    }
    if (code.includes('DIM') || code.includes('DIMMER')) {
      return 'switch-dim-led';
    }
    if (code.includes('OCC') || code.includes('SENSOR')) {
      return 'switch-occ-ceiling';
    }
    return 'switch-sp-20a'; // default single pole
  }

  // ===== DATA / LOW VOLTAGE =====
  if (code.includes('DATA') || code.includes('CAT') || code.includes('JA')) {
    return 'data-cat6-jack';
  }

  // ===== PANELS & GEAR =====
  if (code.includes('PNL') || code.includes('PANEL')) {
    if (code.includes('42')) return 'panel-mlo-42ckt';
    if (code.includes('30')) return 'panel-mlo-30ckt';
    return 'panel-mlo-42ckt';
  }

  // Default: no assembly assigned
  // Note: Conduit (EMT, etc.) is measured using the measure tool, not count tags
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
