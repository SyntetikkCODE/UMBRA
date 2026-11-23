// HTML media volume stops at 1. Keep amplification in Web Audio instead.
export function splitOutputGain(value){const gain=Math.max(0,Number.isFinite(value)?value:0);return {volume:Math.min(1,gain),boost:Math.max(1,gain)};}
