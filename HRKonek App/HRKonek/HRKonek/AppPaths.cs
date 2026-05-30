namespace HRKonek;

internal static class AppPaths
{
    private static string? _root;

    /// <summary>
    /// Locates the HRKonek Next.js project root by walking up from the
    /// executable directory until it finds package.json + next.config.ts.
    /// </summary>
    internal static string Root
    {
        get
        {
            if (_root is not null) return _root;

            var dir = AppDomain.CurrentDomain.BaseDirectory;
            for (int i = 0; i < 12; i++)
            {
                if (File.Exists(Path.Combine(dir, "package.json"))
                    && File.Exists(Path.Combine(dir, "next.config.ts")))
                {
                    _root = dir;
                    return _root;
                }
                var parent = Directory.GetParent(dir);
                if (parent is null) break;
                dir = parent.FullName;
            }

            // Fallback: if running from the .csproj directory during development
            dir = AppDomain.CurrentDomain.BaseDirectory;
            for (int i = 0; i < 8; i++)
            {
                if (File.Exists(Path.Combine(dir, "HRKonek.csproj")))
                {
                    // Go up from project to solution to app root
                    var maybe = Directory.GetParent(dir);
                    if (maybe is not null) maybe = Directory.GetParent(maybe.FullName);
                    if (maybe is not null) maybe = Directory.GetParent(maybe.FullName);
                    if (maybe is not null)
                    {
                        var test = maybe.FullName;
                        if (File.Exists(Path.Combine(test, "package.json")))
                        {
                            _root = test;
                            return _root;
                        }
                    }
                }
                var p = Directory.GetParent(dir);
                if (p is null) break;
                dir = p.FullName;
            }

            throw new DirectoryNotFoundException(
                "Could not locate HRKonek project root. " +
                "Ensure this executable is inside the HRKonek project folder.");
        }
    }

    /// <summary>Path to the public/hrkonek-icon.png</summary>
    internal static string IconFile =>
        Path.Combine(Root, "public", "hrkonek-icon.png");

    /// <summary>Path to .next/BUILD_ID</summary>
    internal static string BuildIdFile =>
        Path.Combine(Root, ".next", "BUILD_ID");

    /// <summary>Path to WebView2 user data folder (stored alongside the project)</summary>
    internal static string WebViewDataFolder =>
        Path.Combine(Root, "HRKonek App", "WebViewData");
}