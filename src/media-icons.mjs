// Simple outline controls, consistent with the bundled icon set.
const svg=path=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const mediaIcons={camera:svg('<rect x="3" y="5" width="12" height="14" rx="2"/><path d="m15 10 6-4v12l-6-4z"/>'),screen:svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M12 13V7m-3 3 3-3 3 3"/>')};

Object.assign(mediaIcons,{
 volume:svg('<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'),
 volumeOff:svg('<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>'),
 stop:svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m9 8 6 5m0-5-6 5M8 21h8m-4-4v4"/>'),
 more:svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
 fullscreen:svg('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'),
 fullscreenExit:svg('<path d="M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5"/>'),
 pip:svg('<rect x="2" y="3" width="20" height="18" rx="2"/><rect x="11" y="11" width="8" height="7" rx="1"/>'),
 hangup:svg('<path d="M3 16v-4c5-5 13-5 18 0v4h-5v-4M8 12v4H3"/>')
});
