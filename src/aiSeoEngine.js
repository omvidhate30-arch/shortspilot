export const DEFAULT_CUSTOM_AI_PROMPT = `Act as my Personal Viral Video SEO Expert, YouTube Shorts Growth Strategist and Short-Form Content Specialist.
YOUR TASK:
I will send you a video. You must carefully analyze the actual video context first. Then generate all titles, captions, hashtags and SEO content based ONLY on that specific video.
IMPORTANT: Never give generic or random content. Every output must match the actual video.
FOR EVERY VIDEO, GENERATE:
1. BEST VIRAL TITLE (Create 3 catchy curiosity-driven titles and select the strongest as BEST TITLE)
2. VIRAL CAPTION (Hook + natural call to action)
3. TRENDING HASHTAGS (Mix niche-specific, popular and trending hashtags)
4. SEO KEYWORDS (10-15 relevant searchable keywords)
5. VIDEO DESCRIPTION (SEO-optimized YouTube Shorts description)
6. BEST THUMBNAIL TEXT (3 short powerful options)
7. VIRAL POTENTIAL ANALYSIS (Score 1 to 10 + retention analysis)`;

export const inspectVideoProperties = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof Blob)) {
      return resolve({ duration: 15, width: 1080, height: 1920, isVerticalOrSquare: true, isAlreadyShort: false });
    }
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    vid.onloadedmetadata = () => {
      const duration = vid.duration || 15;
      const width = vid.videoWidth || 1080;
      const height = vid.videoHeight || 1920;
      const isVerticalOrSquare = height >= width;
      URL.revokeObjectURL(url);
      resolve({ duration, width, height, isVerticalOrSquare, isAlreadyShort: isVerticalOrSquare && duration <= 185 });
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 15, width: 1080, height: 1920, isVerticalOrSquare: true, isAlreadyShort: false });
    };
  });

export const buildUniqueDynamicMetadata = ({
  rawName,
  clipIndex = 0,
  country = 'IN',
  selectedNiche = 'Gaming (Free Fire / BGMI / GTA)',
  selectedCtaStyle = 'Comment Your Reaction 👇',
  usedTitlesSet
}) => {
  const isIndia = country === 'IN';
  let topic = (rawName || '')
    .replace(/^(vid|img|pxl|screen|recording|whatsapp|video|clip|short|movie|edit|new)[\s_-]*/i, '')
    .replace(/\b\d{5,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!topic || topic.length < 3) {
    if (selectedNiche.includes('Gaming')) topic = 'Impossible 1v4 Clutch Moment';
    else if (selectedNiche.includes('Facts')) topic = '99% Log Ye Amazing Fact Nahi Jante';
    else if (selectedNiche.includes('Motivation')) topic = 'Ye 15 Second Aapki Soch Badal Denge';
    else topic = isIndia ? 'Aakhir Mein Jo Hua Shock Ho Jaoge' : 'Wait Until The Final Second';
  }

  const hookAngles = isIndia
    ? [
        `${topic} 😱 Wait For End!`,
        `99% Log Ye Nahi Jante 🔥 ${topic}`,
        `${topic} 🤯 Last Tak Dekho!`,
        `Impossible Moment ⚡ ${topic}`,
        `Kya Aapne Ye Notice Kiya? 👀 ${topic}`,
        `${topic} 🎯 Pure Goosebumps!`
      ]
    : [
        `Wait Until The End 😱 ${topic}`,
        `99% Of People Missed This 🔥 ${topic}`,
        `What Happens Next Is Insane 🤯 ${topic}`,
        `Unbelievable Moment ⚡ ${topic}`
      ];

  const seed = (clipIndex + Math.floor(Math.random() * hookAngles.length)) % hookAngles.length;
  let chosenTitle = hookAngles[seed];
  if (usedTitlesSet && usedTitlesSet.has(chosenTitle.toLowerCase())) {
    chosenTitle = `${hookAngles[(seed + 1) % hookAngles.length]}`;
  }
  if (usedTitlesSet) usedTitlesSet.add(chosenTitle.toLowerCase());

  const nicheTags = selectedNiche.includes('Gaming')
    ? ['#Shorts', '#GamingShorts', '#FreeFire', '#BGMI', '#ViralGaming']
    : selectedNiche.includes('Facts')
    ? ['#Shorts', '#AmazingFacts', '#FactsInHindi', '#DidYouKnow', '#TrendingShorts']
    : ['#Shorts', '#YouTubeShorts', '#ViralShorts', '#TrendingIndia', '#ExplorePage'];

  const combinedTags = nicheTags.join(' ');

  const fallbackReport = `BEST TITLE: ${chosenTitle}
VIRAL CAPTION: ${chosenTitle} — ${selectedCtaStyle}
YOUTUBE SHORTS HASHTAGS: ${combinedTags}
SEO KEYWORDS: ${topic}, ${selectedNiche}, YouTube Shorts India, Viral Shorts, Trending Shorts Feed
VIDEO DESCRIPTION: ${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}
THUMBNAIL TEXT: 1) WAIT FOR END 😱  2) IMPOSSIBLE 🔥  3) WATCH TILL LAST 🤯
VIRAL POTENTIAL SCORE: 9.8/10`;

  return {
    title: chosenTitle.slice(0, 78),
    hashtags: combinedTags,
    description: `${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}`,
    keywords: [topic, 'Shorts', 'YouTubeShorts', 'ViralShorts', 'TrendingIndia'],
    hookScore: '9.8/10',
    fullSeoReport: fallbackReport
  };
};

export const renderVertical916Video = async ({
  file,
  clipId,
  startRatio = 0,
  maxClipSec = 12,
  preserveFullShort = false,
  tier = 'free',
  watermarkText = 'Made with ShortsPilot',
  onProgress
}) => {
  if (!(file instanceof Blob)) {
    return { croppedUrl: '', clipLength: Math.round(maxClipSec), blob: null, hasAudio: false };
  }
  const videoUrl = URL.createObjectURL(file);

  if (preserveFullShort) {
    return { croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.muted = false;
    video.volume = 0.05;

    const safetyTimer = setTimeout(() => {
      resolve({ croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true });
    }, 95000);

    video.onloadedmetadata = () => {
      const duration = video.duration || 12;
      const startOffset = preserveFullShort ? 0 : Math.min(duration * startRatio, Math.max(0, duration - 5));
      const clipLength = preserveFullShort ? duration : Math.min(maxClipSec, Math.max(3, duration - startOffset));

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 854;
      const ctx = canvas.getContext('2d');

      let supportedMime = '';
      if (window.MediaRecorder) {
        const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
        supportedMime = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      }

      if (!window.MediaRecorder || !canvas.captureStream || !supportedMime) {
        clearTimeout(safetyTimer);
        resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: true });
        return;
      }

      try {
        const canvasStream = canvas.captureStream(24);
        let combinedTracks = [...canvasStream.getVideoTracks()];
        let audioCaptured = false;

        try {
          const vidStream = video.captureStream ? video.captureStream() : video.mozCaptureStream ? video.mozCaptureStream() : null;
          if (vidStream && vidStream.getAudioTracks().length > 0) {
            combinedTracks = [...combinedTracks, ...vidStream.getAudioTracks()];
            audioCaptured = true;
          }
        } catch {}

        const finalStream = new MediaStream(combinedTracks);
        const chunks = [];
        const recorder = new MediaRecorder(finalStream, { mimeType: supportedMime });

        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
          clearTimeout(safetyTimer);
          const croppedBlob = new Blob(chunks, { type: supportedMime });
          resolve({
            croppedUrl: URL.createObjectURL(croppedBlob),
            clipLength: Math.round(clipLength),
            blob: croppedBlob,
            hasAudio: audioCaptured
          });
        };

        video.currentTime = startOffset;
        video.onseeked = () => {
          recorder.start();
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {
              clearTimeout(safetyTimer);
              resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: false });
            });
          });

          const drawFrame = () => {
            if (video.paused || video.ended || (!preserveFullShort && video.currentTime >= startOffset + clipLength)) {
              video.pause();
              if (recorder.state !== 'inactive') recorder.stop();
              return;
            }
            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const targetAspect = 9 / 16;
            const sourceAspect = vw / vh;
            let sx = 0, sy = 0, sWidth = vw, sHeight = vh;
            if (sourceAspect > targetAspect) {
              sWidth = vh * targetAspect;
              sx = (vw - sWidth) / 2;
            } else {
              sHeight = vw / targetAspect;
              sy = (vh - sHeight) / 2;
            }
            ctx.fillStyle = '#06080d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            if (tier !== 'pro' && watermarkText) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
              ctx.fillRect(canvas.width - 185, 24, 165, 28);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText(watermarkText.slice(0, 24), canvas.width - 175, 43);
            }

            const elapsed = video.currentTime - startOffset;
            const pct = Math.min(95, Math.round(25 + (elapsed / clipLength) * 70));
            if (pct % 5 === 0 && video._lastPct !== pct) {
              video._lastPct = pct;
              if (onProgress) onProgress(clipId, pct);
            }
            requestAnimationFrame(drawFrame);
          };
          drawFrame();
        };
      } catch {
        clearTimeout(safetyTimer);
        resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: true });
      }
    };

    video.onerror = () => {
      clearTimeout(safetyTimer);
      resolve({ croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true });
    };
  });
};
