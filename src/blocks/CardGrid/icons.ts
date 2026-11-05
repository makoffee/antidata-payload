import {
  Blocks,
  Box,
  Code,
  Compass,
  Component,
  Gem,
  Layers,
  Lightbulb,
  Megaphone,
  MonitorSmartphone,
  Palette,
  PenTool,
  Rocket,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

// Icons editors can pick for a card. Add more from https://lucide.dev/icons by importing them
// here and adding an entry; the admin dropdown is generated from this list.
export const cardIcons = {
  compass: { label: 'Compass', Icon: Compass },
  lightbulb: { label: 'Lightbulb', Icon: Lightbulb },
  sparkles: { label: 'Sparkles (AI)', Icon: Sparkles },
  smartphone: { label: 'Smartphone', Icon: Smartphone },
  monitorSmartphone: { label: 'Devices', Icon: MonitorSmartphone },
  palette: { label: 'Palette', Icon: Palette },
  penTool: { label: 'Pen tool', Icon: PenTool },
  layers: { label: 'Layers', Icon: Layers },
  blocks: { label: 'Building blocks (design system)', Icon: Blocks },
  component: { label: 'Component', Icon: Component },
  code: { label: 'Code', Icon: Code },
  box: { label: 'Box', Icon: Box },
  gem: { label: 'Gem', Icon: Gem },
  megaphone: { label: 'Megaphone', Icon: Megaphone },
  rocket: { label: 'Rocket', Icon: Rocket },
  target: { label: 'Target', Icon: Target },
  users: { label: 'Users', Icon: Users },
  zap: { label: 'Zap', Icon: Zap },
} satisfies Record<string, { label: string; Icon: LucideIcon }>

export type CardIconName = keyof typeof cardIcons
