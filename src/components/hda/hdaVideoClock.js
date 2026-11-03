// External store: the video owns the clock. React observes presented timestamps.
export function createVideoClock(video, scheduler = globalThis) {
  let time = Number.isFinite(video?.currentTime) ? video.currentTime : 0;
  let handle = null;
  const listeners = new Set();
  const hasVideoFrames = typeof video?.requestVideoFrameCallback === "function";
  const events = ["loadedmetadata", "seeking", "seeked", "timeupdate", "play", "pause", "ended", "ratechange", "emptied"];

  function publish(next) {
    next = Number.isFinite(next) ? Math.max(0, next) : 0;
    if (time !== next) {
      time = next;
      listeners.forEach((listener) => listener());
    }
  }

  function schedule() {
    if (!video || handle !== null || !listeners.size) return;
    if (hasVideoFrames) handle = video.requestVideoFrameCallback(onFrame);
    else if (!video.paused && !video.ended) handle = scheduler.requestAnimationFrame(onFrame);
  }

  function onFrame(_now, metadata) {
    handle = null;
    publish(metadata?.mediaTime ?? video.currentTime);
    schedule();
  }

  function onEvent(event) {
    // During playback prefer presented mediaTime, rather than a potentially
    // slightly newer currentTime reported by the coarse timeupdate event.
    if (!hasVideoFrames || event.type !== "timeupdate" || video.paused || video.seeking) publish(video.currentTime);
    schedule();
  }

  return {
    getSnapshot: () => time,
    getServerSnapshot: () => 0,
    subscribe(listener) {
      if (!video) return () => {};
      if (!listeners.size) {
        events.forEach((event) => video.addEventListener(event, onEvent));
        time = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      }
      listeners.add(listener);
      schedule();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          events.forEach((event) => video.removeEventListener(event, onEvent));
          if (handle !== null) {
            if (hasVideoFrames) video.cancelVideoFrameCallback(handle);
            else scheduler.cancelAnimationFrame(handle);
            handle = null;
          }
        }
      };
    },
  };
}
