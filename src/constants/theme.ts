// Bloomly Premium Theme — Dutch Golden Age Botanical Palette
export const THEME = {
  sky: {
    top:     '#2E6DB4',
    mid:     '#5B9FD4',
    horizon: '#A8D5BA',
  },
  ground: {
    top:  '#2D5A1B',
    deep: '#1A3A0E',
  },
  board: {
    bg:     'rgba(255,248,235,0.10)',
    border: 'rgba(212,175,55,0.40)',
    shadow: '#C8A850',
  },
  dock: {
    bg:        'rgba(80,45,15,0.85)',
    border:    'rgba(212,175,55,0.50)',
    highlight: 'rgba(255,235,140,0.35)',
    shadow:    '#8B4513',
  },
  hud: {
    bg:        'rgba(18,10,3,0.88)',
    border:    'rgba(212,175,55,0.30)',
    shadow:    '#C8A850',
    chipBg:    'rgba(30,18,3,0.72)',
    chipBorder:'rgba(212,175,55,0.50)',
    labelColor:'#C8A850',
    goldColor: '#FFD700',
  },
  booster: {
    bg:     'rgba(40,25,8,0.75)',
    border: 'rgba(200,168,80,0.35)',
    shadow: '#C8A850',
  },
  gold: '#FFD700',
};

export const PETAL_RICH: Record<string, { glow: string; highlight: string; shadow: string }> = {
  red:    { glow: '#FF3B3B', highlight: 'rgba(255,160,160,0.55)', shadow: '#CC1010' },
  pink:   { glow: '#FF5BA8', highlight: 'rgba(255,200,225,0.55)', shadow: '#C02060' },
  purple: { glow: '#9B40F0', highlight: 'rgba(215,155,255,0.55)', shadow: '#6010BB' },
  yellow: { glow: '#F5C000', highlight: 'rgba(255,248,150,0.60)', shadow: '#C08000' },
  green:  { glow: '#18B850', highlight: 'rgba(150,255,185,0.55)', shadow: '#0E7030' },
  blue:   { glow: '#2E78F0', highlight: 'rgba(135,200,255,0.55)', shadow: '#1040C0' },
};
