import { useState, useEffect, useRef } from "react";
import { Music, X, Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function MusicPlayer({ darkMode }) {
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [showWidget, setShowWidget] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const pendingVideoIdRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("musicYoutubeUrl");
    const savedVideoId = localStorage.getItem("musicVideoId");
    const savedTitle = localStorage.getItem("musicVideoTitle");
    const savedEnabled = localStorage.getItem("musicEnabled") === "true";

    if (savedUrl) setYoutubeUrl(savedUrl);
    if (savedVideoId) {
      setVideoId(savedVideoId);
      if (savedEnabled) {
        setMusicEnabled(true);
        // Show widget on load if music was enabled
        setShowWidget(true);
      }
    }
    if (savedTitle) setVideoTitle(savedTitle);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      const apiReadyHandler = () => {
        console.log("YouTube API Ready");
        setIsAPIReady(true);
      };

      window.onYouTubeIframeAPIReady = apiReadyHandler;

      // Cleanup function
      return () => {
        // Clean up the global callback reference
        if (window.onYouTubeIframeAPIReady === apiReadyHandler) {
          window.onYouTubeIframeAPIReady = null;
        }
      };
    } else {
      // YT exists but Player might not be ready yet
      const checkReady = setInterval(() => {
        if (window.YT.Player) {
          console.log("YouTube API Ready (polling)");
          setIsAPIReady(true);
          clearInterval(checkReady);
        }
      }, 100);

      // Cleanup after 5 seconds
      const cleanupTimer = setTimeout(() => clearInterval(checkReady), 5000);

      // Return cleanup function
      return () => {
        clearInterval(checkReady);
        clearTimeout(cleanupTimer);
      };
    }
  }, []);

  // Initialize player when API is ready and we have a videoId
  useEffect(() => {
    if (!isAPIReady || !videoId) return;

    console.log("Initializing player with videoId:", videoId);
    setIsPlayerReady(false);
    setLoadingTimeout(false);
    setPlayerError(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set 15-second timeout - auto cleanup on timeout
    timeoutRef.current = setTimeout(() => {
      if (!isPlayerReady && !playerError) {
        console.log("Player loading timeout after 15 seconds - removing music");
        // Auto cleanup
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (err) {
            console.log("Error destroying player on timeout:", err);
          }
        }
        setMusicEnabled(false);
        setIsPlaying(false);
        setVideoId("");
        setLoadingTimeout(true);
        localStorage.setItem("musicEnabled", "false");
      }
    }, 15000);

    const initPlayer = () => {
      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.log("Error destroying player:", err);
        }
      }

      // Create new player
      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1, // Critical for mobile iOS
            enablejsapi: 1, // Enable JS API for mobile
            origin: window.location.origin, // Required for iframe security
          },
          events: {
            onReady: (event) => {
              console.log("Player ready!");

              // Clear timeout when player is ready
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              setIsPlayerReady(true);
              setLoadingTimeout(false);
              setIsPlaying(false);

              // Get video title
              try {
                const title = event.target.getVideoData().title;
                if (title) {
                  setVideoTitle(title);
                  localStorage.setItem("musicVideoTitle", title);
                }
              } catch (err) {
                console.error("Failed to get video title:", err);
              }
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
              }
            },
            onError: (event) => {
              console.error("Player error:", event.data);

              // Clear timeout on error
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              // Auto cleanup on error
              setMusicEnabled(false);
              setIsPlaying(false);
              setVideoId("");
              setPlayerError(true);
              setLoadingTimeout(false);
              setIsPlayerReady(false);
              localStorage.setItem("musicEnabled", "false");
            },
          },
        });
      } catch (err) {
        console.error("Failed to create player:", err);
        setIsPlayerReady(false);
      }
    };

    // Delay to ensure iframe element is ready
    const timer = setTimeout(initPlayer, 200);
    return () => {
      clearTimeout(timer);
      // Cleanup timeout ref when effect re-runs or unmounts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAPIReady, videoId]);

  const extractVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const handleSubmitUrl = () => {
    const id = extractVideoId(youtubeUrl);
    if (id) {
      // Stop current player if exists
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
          playerRef.current.destroy();
        } catch (err) {
          console.log("Error stopping player:", err);
        }
      }

      setVideoId(id);
      setMusicEnabled(true);
      setIsPlaying(false);
      setErrorMessage("");
      localStorage.setItem("musicYoutubeUrl", youtubeUrl);
      localStorage.setItem("musicVideoId", id);
      localStorage.setItem("musicEnabled", "true");
      setShowModal(false);

      // Show widget immediately
      setShowWidget(true);
    } else {
      setErrorMessage("Invalid YouTube URL. Please paste a valid YouTube link.");
    }
  };

  const handleOpenModal = () => {
    if (!musicEnabled) {
      // Fresh open
      setYoutubeUrl("");
    }
    setErrorMessage("");
    setShowModal(true);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          // Mobile needs explicit play call with error handling
          playerRef.current.playVideo();
        }
      } catch (err) {
        console.error("Play/Pause error:", err);
        // On mobile, sometimes needs to re-init
        setIsPlayerReady(false);
        setTimeout(() => setIsPlayerReady(true), 100);
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleClose = () => {
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
        playerRef.current.destroy();
      } catch (err) {
        console.log("Error closing player:", err);
      }
    }
    // Clear timeout on close
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMusicEnabled(false);
    setIsPlaying(false);
    setVideoId("");
    setLoadingTimeout(false);
    setPlayerError(false);
    localStorage.setItem("musicEnabled", "false");
  };

  const handleRetry = () => {
    setLoadingTimeout(false);
    setPlayerError(false);
    setShowModal(true);
  };

  return (
    <>
      {/* Music Icon Button with Visualizer */}
      <button
        onClick={() => (musicEnabled ? setShowWidget(!showWidget) : handleOpenModal())}
        className={`p-2 ${darkMode ? "text-dark-text hover:text-white" : "text-neutral-600 hover:text-neutral-800"} transition-colors relative`}
        title="Music / Podcast"
      >
        <Music size={18} />

        {/* Animated Visualizer Bars when playing */}
        {musicEnabled && isPlaying && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className={`w-0.5 ${darkMode ? "bg-dark-text" : "bg-neutral-700"} animate-musicBarSlow1`} style={{ height: '4px' }}></div>
            <div className={`w-0.5 ${darkMode ? "bg-dark-text" : "bg-neutral-700"} animate-musicBarSlow2`} style={{ height: '6px' }}></div>
            <div className={`w-0.5 ${darkMode ? "bg-dark-text" : "bg-neutral-700"} animate-musicBarSlow3`} style={{ height: '4px' }}></div>
          </div>
        )}
      </button>

      {/* Input Modal - Improved UX with current song info */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className={`${
              darkMode
                ? "bg-dark-card border-dark-border/30"
                : "bg-white border-neutral-200"
            } border rounded-lg p-6 w-full max-w-md shadow-2xl animate-scaleIn`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-medium ${
                    darkMode ? "text-dark-text" : "text-neutral-900"
                  }`}
                >
                  Music / Podcast
                </h3>
                <p
                  className={`text-xs ${
                    darkMode ? "text-dark-muted" : "text-neutral-500"
                  } mt-1`}
                >
                  {musicEnabled && videoTitle ? "Replace current track" : "Paste YouTube URL"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 ${
                  darkMode
                    ? "text-dark-muted hover:text-dark-text"
                    : "text-neutral-400 hover:text-neutral-600"
                } transition-colors rounded-full hover:bg-black/5`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Current song info */}
            {musicEnabled && videoTitle && (
              <div className={`mb-4 p-3 rounded-lg border ${
                darkMode
                  ? "bg-neutral-800/50 border-neutral-700"
                  : "bg-neutral-50 border-neutral-200"
              }`}>
                <p className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"} mb-1`}>
                  Currently playing:
                </p>
                <p className={`text-sm font-medium truncate ${
                  darkMode ? "text-dark-text" : "text-neutral-900"
                }`}>
                  {videoTitle}
                </p>
                <button
                  onClick={handleOpenModal}
                  className={`mt-2 text-xs ${
                    darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                  } transition-colors`}
                >
                  Change to a different track
                </button>
              </div>
            )}

            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitUrl()}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-3 py-2.5 mb-2 border text-sm ${
                darkMode
                  ? "bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
                  : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"
              } rounded focus:outline-none focus:border-neutral-400 transition-all`}
              autoFocus
            />

            {/* Inline Error Message */}
            {errorMessage && (
              <div className={`mb-4 p-2.5 rounded text-xs ${
                darkMode
                  ? "bg-red-900/30 text-red-400 border border-red-800/50"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleSubmitUrl}
              className={`w-full py-2.5 text-sm font-medium ${
                darkMode
                  ? "bg-white text-neutral-900 hover:bg-neutral-100"
                  : "bg-neutral-700 text-white hover:bg-neutral-800"
              } rounded transition-colors disabled:opacity-50`}
              disabled={!youtubeUrl.trim()}
            >
              {musicEnabled && videoTitle ? "Replace & Play" : "Start Playing"}
            </button>
          </div>
        </div>
      )}

      {/* Compact Widget - Bottom Right */}
      {musicEnabled && videoId && showWidget && (
        <div className="fixed bottom-3 right-0 lg:right-[calc((100vw-672px)/2)] z-40 max-w-[672px] w-full px-4 animate-slideUp">
          <div
            className={`${
              darkMode
                ? "bg-dark-card border-dark-border/30"
                : "bg-white border-neutral-200"
            } border rounded-lg p-3 shadow-lg flex items-center gap-3`}
          >
            {/* Loading State - Skeleton, Timeout, or Error */}
            {!isPlayerReady ? (
              playerError ? (
                // Error message
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${darkMode ? "text-red-400" : "text-red-600"}`}>
                      Can't play this video
                    </p>
                    <p className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"} mt-0.5`}>
                      Video is unavailable, private, or restricted
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleRetry}
                      className={`px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-700 text-white hover:bg-neutral-800"} rounded transition-colors`}
                    >
                      Change Video
                    </button>
                    <button
                      onClick={handleClose}
                      className={`p-1.5 ${darkMode ? "hover:bg-neutral-700 text-dark-muted" : "hover:bg-neutral-100 text-neutral-400"} rounded transition-colors`}
                      title="Remove music"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : loadingTimeout ? (
                // Timeout message
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                      Music taking too long to load
                    </p>
                    <p className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"} mt-0.5`}>
                      Network might be slow. Try again?
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleRetry}
                      className={`px-3 py-1.5 text-xs font-medium ${darkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-700 text-white hover:bg-neutral-800"} rounded transition-colors`}
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className={`p-1.5 ${darkMode ? "hover:bg-neutral-700 text-dark-muted" : "hover:bg-neutral-100 text-neutral-400"} rounded transition-colors`}
                      title="Remove music"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                // Skeleton loading with progress
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-3 rounded ${darkMode ? "bg-neutral-700" : "bg-neutral-200"} animate-pulse w-3/4`}></div>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-neutral-700" : "bg-neutral-200"}`}>
                      <div
                        className={`h-full ${darkMode ? "bg-white" : "bg-neutral-700"} animate-loadingProgress`}
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                    <p className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"} mt-1.5`}>
                      Loading music...
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className={`p-1.5 ${darkMode ? "hover:bg-neutral-700 text-dark-muted" : "hover:bg-neutral-100 text-neutral-400"} rounded transition-colors flex-shrink-0`}
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </>
              )
            ) : (
              <>
                {/* Waveform Bars */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-6 flex-shrink-0">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-0.5 ${darkMode ? "bg-dark-text" : "bg-neutral-700"} rounded-full animate-waveformSlow`}
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          height: '6px'
                        }}
                      ></div>
                    ))}
                  </div>
                )}

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setShowModal(true)}
                >
                  <p
                    className={`text-xs font-medium truncate ${
                      darkMode ? "text-dark-text" : "text-neutral-900"
                    }`}
                  >
                    {videoTitle || "Loading..."}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-dark-muted" : "text-neutral-500"
                    }`}
                  >
                    {isPlaying ? "Now Playing" : "Paused"} · Click to change
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={toggleMute}
                    className={`p-1.5 ${
                      darkMode
                        ? "hover:bg-neutral-700"
                        : "hover:bg-neutral-100"
                    } rounded transition-colors`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX
                        size={14}
                        className={darkMode ? "text-dark-text" : "text-neutral-700"}
                      />
                    ) : (
                      <Volume2
                        size={14}
                        className={darkMode ? "text-dark-text" : "text-neutral-700"}
                      />
                    )}
                  </button>

                  <button
                    onClick={togglePlay}
                    className={`p-2 ${darkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-700 text-white hover:bg-neutral-800"} rounded transition-colors`}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={14} />
                    ) : (
                      <Play size={14} className="ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleClose}
                    className={`p-1.5 ${
                      darkMode
                        ? "hover:bg-neutral-700 text-dark-muted"
                        : "hover:bg-neutral-100 text-neutral-400"
                    } rounded transition-colors`}
                    title="Remove music"
                  >
                    <X size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden YouTube Player */}
      <div className="hidden">
        <div ref={iframeRef}></div>
      </div>
    </>
  );
}
