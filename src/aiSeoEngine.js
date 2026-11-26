const SHORTSPILOT_URLS = Array.from({ length: 400 }, (_, idx) => {
  const num = idx + 1;
  if (num <= 100) {
    return `https://www.shortspilot.in/shorts/clip-${String(num).padStart(3, '0')}`;
  }
  if (num <= 200) {
    return `https://www.shortspilot.in/thumbnails/preset-9x16-${String(num - 100).padStart(3, '0')}`;
  }
  if (num <= 300) {
    return `https://www.shortspilot.in/templates/viral-hook-${String(num - 200).padStart(3, '0')}`;
  }
  return `https://www.shortspilot.in/redirect/auto-post-${String(num - 300).padStart(3, '0')}`;
});

export const getShortsPilotUrlByIndex = (index = 0) =>
  SHORTSPILOT_URLS[Math.abs(Number(index) || 0) % SHORTSPILOT_URLS.length];

export const detectTopicFromFile = (fileName = '') => {
  const base = String(fileName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(
      /\b(vid|video|screen|recording|record|clip|short|shorts|final|edit|hd|fhd|4k|1080p|720p|60fps|30fps|mp4|mov|mkv)\b/gi,
      ' '
    )
    .replace(/\b\d{4,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return base.length >= 2
    ? base.replace(/\b\w/g, (ch) => ch.toUpperCase())
    : 'Insane Viral Moment';
};

export const buildClipPackage = (
  rawTopic,
  index = 0,
  partLabel = '',
  watermarkText = 'Developed by shortspilot.in',
  durationLabel = '',
  hookText = ''
) => {
  const cleanTopic = (rawTopic || 'Insane Viral Moment').trim();
  const title = partLabel ? `${cleanTopic} (${partLabel})` : cleanTopic;

  const hookLines = [
    `Watch till the end for ${cleanTopic} — this moment catches you completely off guard.`,
    `High-retention highlight from ${cleanTopic} crafted for fast Shorts & feed discovery.`,
    `Blink and you might miss what happens next in ${cleanTopic}.`,
    `Pure highlight energy from ${cleanTopic} — clipped for quick mobile viewing.`,
    `Unexpected turn in ${cleanTopic} that keeps viewers hooked till the final second.`
  ];

  const tagPools = [
    ['#Shorts', '#ViralShorts', '#TrendingNow'],
    ['#YouTubeShorts', '#MustWatch', '#ShortClip'],
    ['#ShortsFeed', '#ViralClip', '#ForYou']
  ];

  const words = cleanTopic
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 3)
    .map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);

  const hashtags = Array.from(
    new Set(['#Shorts', ...words, ...tagPools[index % tagPools.length]])
  )
    .slice(0, 5)
    .join(' ');

  const metaBits = [
    partLabel ? `Segment: ${partLabel}` : '',
    durationLabel ? `Length: ${durationLabel}` : '',
    hookText ? `Hook: ${hookText}` : ''
  ]
    .filter(Boolean)
    .join(' • ');

  const description = [
    `${title} #Shorts`,
    '',
    hookLines[index % hookLines.length],
    metaBits ? `\n${metaBits}` : '',
    '',
    hashtags,
    '',
    watermarkText
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    title,
    category: 'Shorts',
    mediaFormat: 'short',
    hashtags,
    description,
    watermarkText,
    websiteUrl: getShortsPilotUrlByIndex(index),
    hookScore: `${Math.min(99, 88 + ((index * 3) % 10))}/100`
  };
};

export const buildMasterThumbnailPrompt = ({
  clip = {},
  customStyleNote = '',
  watermarkText = 'Developed by shortspilot.in'
} = {}) => {
  const title = String(clip?.title || 'Viral Short').trim();
  const hookText = String(clip?.thumbnailHook || 'WAIT FOR END 😱').trim();
  const description = String(clip?.description || '').trim();
  const hashtags = String(clip?.hashtags || '#Shorts #ViralShorts').trim();
  const credit = String(
    watermarkText || clip?.watermarkText || 'Developed by shortspilot.in'
  ).trim();

  const extraStyle = String(customStyleNote || '').trim()
    ? `\n- Custom Style Note: ${String(customStyleNote).trim()}`
    : '';

  return [
    'Create a high-CTR 9:16 vertical YouTube Shorts thumbnail/cover graphic (1080x1920) for this Short:',
    '',
    `- Title: ${title}`,
    `- Hook Text: ${hookText}`,
    `- Description: ${description}`,
    `- Hashtags: ${hashtags}`,
    `- Credit / Watermark: ${credit}${extraStyle}`,
    '',
    'Design Instructions:',
    '1. Clean composition with a clear focal subject and no clutter.',
    '2. Bold, high-contrast hook text with strong outline/glow so it is instantly readable on mobile screens.',
    '3. Dramatic lighting, rich contrast, and energetic colors matching the title, description, and hashtags.',
    `4. Keep on-image text punchy and readable; place "${credit}" cleanly and subtly near the bottom.`,
    '5. Do not dump the full description or raw hashtag list as messy text on the image.'
  ].join('\n');
};

export const sendThumbnailPromptToAI = async ({
  clip = {},
  customStyleNote = '',
  target = 'gemini',
  watermarkText = 'Developed by shortspilot.in'
} = {}) => {
  const finalPrompt = buildMasterThumbnailPrompt({
    clip,
    customStyleNote,
    watermarkText
  });

  try {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(finalPrompt);
    }
  } catch {}

  const url =
    target === 'chatgpt'
      ? `https://chatgpt.com/?q=${encodeURIComponent(finalPrompt)}`
      : `https://gemini.google.com/app?q=${encodeURIComponent(finalPrompt)}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return finalPrompt;
};
