function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

export function labelStyle(color = '#6366f1') {
  const { r, g, b } = hexToRgb(color)
  return {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    color,
    border: `1px solid rgba(${r},${g},${b},0.3)`,
  }
}
