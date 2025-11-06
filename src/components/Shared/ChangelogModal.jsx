import { X, Sparkles, Zap, Bug, Palette } from "lucide-react";

// Define version and updates here
const CURRENT_VERSION = "1.3.0";

const UPDATES = [
  {
    version: "1.3.0",
    date: "November 6, 2025",
    changes: [
      {
        type: "feature",
        icon: Sparkles,
        text: "Todo editing: Double-click any todo to edit inline",
      },
      {
        type: "feature",
        icon: Zap,
        text: "Changelog system: See what's new when app updates",
      },
    ],
  },
  {
    version: "1.2.5",
    date: "November 5, 2025",
    changes: [
      {
        type: "fix",
        icon: Bug,
        text: "Fixed music player error handling",
      },
      {
        type: "improvement",
        icon: Palette,
        text: "Improved mobile header design",
      },
    ],
  },
];

export default function ChangelogModal({ darkMode, onClose }) {
  const getTypeColor = (type) => {
    switch (type) {
      case "feature":
        return darkMode
          ? "bg-green-900/30 text-green-400 border-green-800"
          : "bg-green-50 text-green-700 border-green-200";
      case "fix":
        return darkMode
          ? "bg-red-900/30 text-red-400 border-red-800"
          : "bg-red-50 text-red-700 border-red-200";
      case "improvement":
        return darkMode
          ? "bg-blue-900/30 text-blue-400 border-blue-800"
          : "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return darkMode
          ? "bg-neutral-800 text-neutral-400 border-neutral-700"
          : "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "feature":
        return "New";
      case "fix":
        return "Fix";
      case "improvement":
        return "Improved";
      default:
        return "Update";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`${darkMode ? "bg-dark-card border-dark-border/30" : "bg-white border-neutral-200"} border rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-scaleIn`}
        style={{ touchAction: "auto" }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b ${darkMode ? "border-dark-border/30" : "border-neutral-200"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${darkMode ? "bg-neutral-700" : "bg-neutral-100"}`}
            >
              <Sparkles
                size={20}
                className={darkMode ? "text-yellow-400" : "text-yellow-600"}
              />
            </div>
            <div>
              <h3
                className={`text-lg font-medium ${darkMode ? "text-dark-text" : "text-neutral-900"}`}
              >
                What's New
              </h3>
              <p
                className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"}`}
              >
                Version {CURRENT_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? "hover:bg-neutral-700" : "hover:bg-neutral-100"} rounded-full transition-colors`}
          >
            <X
              size={20}
              className={darkMode ? "text-dark-muted" : "text-neutral-500"}
            />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {UPDATES.map((update, idx) => (
            <div key={update.version}>
              {/* Version Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    idx === 0
                      ? darkMode
                        ? "bg-white text-neutral-900"
                        : "bg-neutral-900 text-white"
                      : darkMode
                        ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                  }`}
                >
                  {idx === 0 && <Zap size={12} />}
                  v{update.version}
                </div>
                <span
                  className={`text-xs ${darkMode ? "text-dark-muted" : "text-neutral-500"}`}
                >
                  {update.date}
                </span>
              </div>

              {/* Changes List */}
              <div className="space-y-2">
                {update.changes.map((change, changeIdx) => {
                  const Icon = change.icon;
                  return (
                    <div
                      key={changeIdx}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        darkMode
                          ? "bg-neutral-800/50 border-neutral-700/50"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md border ${getTypeColor(change.type)}`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-start gap-2 mb-1">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide ${getTypeColor(change.type)}`}
                          >
                            {getTypeBadge(change.type)}
                          </span>
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${darkMode ? "text-dark-text" : "text-neutral-700"}`}
                        >
                          {change.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider between versions */}
              {idx < UPDATES.length - 1 && (
                <div
                  className={`mt-6 border-t ${darkMode ? "border-dark-border/30" : "border-neutral-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`p-5 border-t ${darkMode ? "border-dark-border/30" : "border-neutral-200"}`}
        >
          <button
            onClick={onClose}
            className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all active:scale-95 ${
              darkMode
                ? "bg-white text-neutral-900 hover:bg-neutral-100"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// Export version for checking
export { CURRENT_VERSION };
