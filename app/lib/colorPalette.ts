// FILE: app/lib/colorPalette.ts
// Centrální paleta barev pro číselníky, štítky atd.

export type AppColor = {
  id: string
  hex: string
  label?: string
}

export const APP_COLOR_PALETTE: AppColor[] = [
  { id: 'red',        hex: '#E74C3C' },
  { id: 'pink',       hex: '#E05570' },
  { id: 'purple',     hex: '#A564AD' },
  { id: 'blue',       hex: '#3498DB' },
  { id: 'teal',       hex: '#1ABC9C' },
  { id: 'green',      hex: '#27AE60' },
  { id: 'lime',       hex: '#1E8449' },
  { id: 'light-lime', hex: '#F9F635' },
  { id: 'orange',     hex: '#F5B041' },
  { id: 'dark-orange',hex: '#E67E22' },
  { id: 'brown',      hex: '#935116' },
  { id: 'sand',       hex: '#D7CCC8' },
  { id: 'yellow',     hex: '#F4D03F', label: 'Žlutá' },
  { id: 'olive',      hex: '#95AA56' },
  { id: 'steel',      hex: '#566573' },
  { id: 'stone',      hex: '#424949' },
  { id: 'navy',       hex: '#212F3D' },
]

