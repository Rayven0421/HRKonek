# HRKonek C# Code Snippets

## 1. Application Entry Point — `Program.cs`

Handles single-instance enforcement, global error handling, and Node.js availability check.

```csharp
using System.Diagnostics;
using System.Threading;

namespace HRKonek;

internal static class Program
{
    public static int Port => ServerManager.Port;

    [STAThread]
    static void Main()
    {
        // Prevent multiple instances
        bool createdNew;
        using var mutex = new Mutex(true, "HRKonekApp", out createdNew);
        if (!createdNew)
        {
            MessageBox.Show("HRKonek is already running.", "HRKonek",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        // Ensure server stops on exit
        Application.ApplicationExit += (s, e) => ServerManager.Stop();
        AppDomain.CurrentDomain.ProcessExit += (s, e) => ServerManager.Stop();

        // Global thread exception handler
        Application.ThreadException += (s, e) =>
        {
            MessageBox.Show("Unexpected error:\n" + e.Exception.Message,
                "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            ServerManager.Stop();
            Application.Exit();
        };

        ApplicationConfiguration.Initialize();

        // Verify Node.js is installed before launching
        if (!IsNodeJsAvailable())
        {
            MessageBox.Show("Node.js not found. Please install Node.js from https://nodejs.org",
                "HRKonek", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        var splash = new SplashForm();
        splash.Show();
        Application.Run();
    }

    private static bool IsNodeJsAvailable()
    {
        try
        {
            using var p = Process.Start(new ProcessStartInfo
            {
                FileName = "node",
                Arguments = "--version",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            });
            if (p is null) return false;
            p.WaitForExit(5000);
            return p.ExitCode == 0;
        }
        catch { return false; }
    }
}
```

---

## 2. WebView2 Main Window — `MainForm.cs`

Hosts the Next.js frontend inside a WebView2 control with custom title bar drag, window resize via `WndProc`, and rounded corners via DWM API.

```csharp
using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HRKonek
{
    public partial class MainForm : Form
    {
        private bool _isMaximized = false;

        // ── Win32 P/Invoke ──────────────────────────────
        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int DWMWCP_ROUND = 2;
        private const int WM_NCHITTEST = 0x84;
        private const int WM_NCLBUTTONDOWN = 0xA1;

        // ── Custom window procedure for resize + title bar drag ──
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_NCHITTEST)
            {
                // Map cursor position to resize handles
                int lParam = m.LParam.ToInt32();
                int scrX = (short)(lParam & 0xFFFF);
                int scrY = (short)((lParam >> 16) & 0xFFFF);
                var pt = PointToClient(new Point(scrX, scrY));
                int x = pt.X, y = pt.Y, w = Width, h = Height;
                int g = 6; // resize border thickness

                // Corners
                if (y <= g && x <= g)      { m.Result = (IntPtr)13; return; } // HTTOPLEFT
                if (y <= g && x >= w - g)  { m.Result = (IntPtr)14; return; } // HTTOPRIGHT
                if (y >= h - g && x <= g)  { m.Result = (IntPtr)16; return; } // HTBOTTOMLEFT
                if (y >= h - g && x >= w - g){ m.Result = (IntPtr)17; return; } // HTBOTTOMRIGHT
                // Edges
                if (y <= g)                { m.Result = (IntPtr)12; return; } // HTTOP
                if (y >= h - g)            { m.Result = (IntPtr)15; return; } // HTBOTTOM
                if (x <= g)                { m.Result = (IntPtr)10; return; } // HTLEFT
                if (x >= w - g)            { m.Result = (IntPtr)11; return; } // HTRIGHT

                // Title bar drag (top 40px, exclude right 160px for window buttons)
                if (y >= 0 && y < 40 && x < w - 160)
                    { m.Result = (IntPtr)2; return; } // HTCAPTION

                base.WndProc(ref m);
                return;
            }
            base.WndProc(ref m);
        }

        // ── Initialize WebView2 pointing to Next.js ──────
        private async Task InitWebViewAsync()
        {
            var env = await CoreWebView2Environment.CreateAsync(null,
                Path.Combine(Path.GetTempPath(), "HRKonekWebView"));

            await _webView.EnsureCoreWebView2Async(env);

            var settings = _webView.CoreWebView2.Settings;
            settings.AreDefaultContextMenusEnabled = false;
            settings.AreDevToolsEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.IsStatusBarEnabled = false;

            _webView.CoreWebView2.NavigationCompleted += async (s, e) =>
            {
                await InjectScrollbarCSS();
                ForceWebViewResize();
            };

            _webView.CoreWebView2.WebMessageReceived += HandleWebMessage;
            _webView.Source = new Uri($"http://localhost:{Program.Port}");
        }

        // ── Handle messages from JavaScript ──────────────
        private void HandleWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string msg = e.TryGetWebMessageAsString();
            switch (msg)
            {
                case "drag":
                    ReleaseCapture();
                    SendMessage(Handle, WM_NCLBUTTONDOWN, 2, 0);
                    break;
                case "minimize":
                    WindowState = FormWindowState.Minimized;
                    break;
                case "maximize":
                    // Toggle normal/maximized
                    break;
                case "close":
                    // Confirm exit dialog
                    break;
            }
        }
    }
}
```

---

## 3. Splash Screen — `SplashForm.cs`

Displays an animated splash screen using WebView2 with a gradient background, logo, and real-time progress updates during server startup.

```csharp
using System.Drawing.Drawing2D;

namespace HRKonek
{
    public partial class SplashForm : Form
    {
        private CancellationTokenSource _cts = new();
        private bool _webViewReady = false;

        // ── Rounded corners via DWM ─────────────────────
        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            int preference = 2; // DWMWCP_ROUND
            DwmSetWindowAttribute(Handle, 33, ref preference, sizeof(int));

            // Custom round rectangle region
            var path = new GraphicsPath();
            int r = 16, w = Width, h = Height;
            path.AddArc(0, 0, r * 2, r * 2, 180, 90);
            path.AddArc(w - r * 2, 0, r * 2, r * 2, 270, 90);
            path.AddArc(w - r * 2, h - r * 2, r * 2, r * 2, 0, 90);
            path.AddArc(0, h - r * 2, r * 2, r * 2, 90, 90);
            path.CloseFigure();
            Region = new Region(path);
        }

        // ── Load splash HTML into WebView2 ──────────────
        private async Task InitSplashWebViewAsync()
        {
            var env = await CoreWebView2Environment.CreateAsync(null,
                Path.Combine(Path.GetTempPath(), "HRKonekSplash"));

            await _splashView.EnsureCoreWebView2Async(env);

            var s = _splashView.CoreWebView2.Settings;
            s.AreDefaultContextMenusEnabled = false;
            s.AreDevToolsEnabled = false;
            s.IsStatusBarEnabled = false;
            s.IsZoomControlEnabled = false;

            _splashView.CoreWebView2.NavigateToString(GetSplashHtml("Initializing..."));
            _splashView.CoreWebView2.NavigationCompleted += (s, e) =>
            {
                _webViewReady = true;
                _ = RunStartupAsync();
            };
        }

        // ── Update progress bar from JavaScript ─────────
        private void UpdateStatus(string message, int percent)
        {
            if (!_webViewReady || !IsHandleCreated) return;
            BeginInvoke(new Action(async () =>
            {
                string safeMsg = message.Replace("'", "\\'").Replace("\"", "\\\"");
                await _splashView.CoreWebView2.ExecuteScriptAsync(
                    $"updateProgress('{safeMsg}', {percent});");
            }));
        }

        // ── Startup sequence with progress ──────────────
        private async Task RunStartupAsync()
        {
            var progress = new Progress<string>(msg =>
            {
                int pct = msg.Contains("Locating") ? 10
                    : msg.Contains("Checking") ? 25
                    : msg.Contains("port") ? 35
                    : msg.Contains("Starting") ? 50
                    : msg.Contains(".") ? 70
                    : msg.Contains("ready") ? 95
                    : msg.Contains("ERROR") ? 100
                    : 60;
                UpdateStatus(msg, pct);
            });

            bool ok = await ServerManager.StartAsync(progress, _cts.Token);
            if (ok)
            {
                UpdateStatus("Launching...", 100);
                await Task.Delay(600);
                BeginInvoke(new Action(() =>
                {
                    var main = new MainForm();
                    main.Show();
                    Close();
                }));
            }
        }

        // ── Inline HTML with CSS loading animation ──────
        private static string GetSplashHtml(string initialStatus)
        {
            // Returns full HTML document with:
            // - Gradient background
            // - Logo image (base64-encoded)
            // - Animated progress bar with shimmer effect
            // - Status text
        }
    }
}
```

---

## 4. Server Manager — `ServerManager.cs`

Manages the Next.js production server lifecycle: port discovery, process spawning, health checks, and cleanup.

```csharp
using System.Net.NetworkInformation;
using System.Net.Http;

namespace HRKonek
{
    public static class ServerManager
    {
        public static int Port { get; private set; } = 3000;
        private static Process? _serverProcess;

        // ── Port management ─────────────────────────────
        public static int FindFreePort(int startPort = 3000)
        {
            for (int port = startPort; port < startPort + 20; port++)
                if (IsPortFree(port)) return port;
            return startPort;
        }

        public static bool IsPortFree(int port)
        {
            var listeners = IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners();
            return listeners.All(ep => ep.Port != port);
        }

        // ── Kill processes occupying the port ───────────
        public static void KillPortProcess(int port)
        {
            var netstat = Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c netstat -ano | findstr :{port}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            })!;

            string output = netstat.StandardOutput.ReadToEnd();
            netstat.WaitForExit();

            foreach (string line in output.Split('\n'))
            {
                if (!line.Contains("LISTENING")) continue;
                string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 5 && int.TryParse(parts[^1].Trim(), out int pid))
                {
                    var proc = Process.GetProcessById(pid);
                    if (proc.ProcessName.ToLower().Contains("node"))
                        proc.Kill(true);
                }
            }
        }

        // ── Start Next.js production server ─────────────
        public static async Task<bool> StartAsync(IProgress<string> progress, CancellationToken ct)
        {
            string projectPath = Path.GetFullPath(NextJsPath);
            progress.Report("Locating HRKonek application...");

            if (!Directory.Exists(projectPath)) { /* error */ return false; }
            if (!Directory.Exists(Path.Combine(projectPath, ".next"))) { /* error */ return false; }

            // Ensure port 3000 is free
            if (!IsPortFree(3000)) KillPortProcess(3000);
            Port = IsPortFree(3000) ? 3000 : FindFreePort(3001);

            // Find npx and start the server
            _serverProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = FindNpx(),
                    Arguments = $"next start -p {Port}",
                    WorkingDirectory = projectPath,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };
            _serverProcess.Start();

            // Poll until server responds
            bool ready = await WaitForServerAsync(Port, 30, progress, ct);
            return ready;
        }

        // ── Health-check polling ────────────────────────
        private static async Task<bool> WaitForServerAsync(int port, int timeoutSecs,
            IProgress<string> progress, CancellationToken ct)
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            var deadline = DateTime.UtcNow.AddSeconds(timeoutSecs);

            while (DateTime.UtcNow < deadline)
            {
                ct.ThrowIfCancellationRequested();
                try
                {
                    var res = await http.GetAsync($"http://localhost:{port}", ct);
                    if (res.IsSuccessStatusCode || (int)res.StatusCode < 500)
                        return true;
                }
                catch { /* server not ready yet */ }
                await Task.Delay(800, ct);
            }
            return false;
        }

        // ── Graceful shutdown ───────────────────────────
        public static void Stop()
        {
            if (_serverProcess == null) return;
            KillProcessTree(_serverProcess.Id);
            _serverProcess.Kill(true);
            _serverProcess.WaitForExit(3000);
            _serverProcess.Dispose();
            _serverProcess = null;
            KillPortProcess(Port);
        }

        private static void KillProcessTree(int pid)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "taskkill",
                Arguments = $"/F /T /PID {pid}",
                UseShellExecute = false,
                CreateNoWindow = true,
            })?.WaitForExit(3000);
        }
    }
}
```

---

## 5. Path Resolution — `AppPaths.cs`

Walks up the directory tree to locate the Next.js project root, supporting both published and development environments.

```csharp
namespace HRKonek;

internal static class AppPaths
{
    private static string? _root;

    internal static string Root
    {
        get
        {
            if (_root is not null) return _root;

            // Walk up from executable directory looking for package.json + next.config.ts
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

            // Fallback: running from .csproj directory during development
            dir = AppDomain.CurrentDomain.BaseDirectory;
            for (int i = 0; i < 8; i++)
            {
                if (File.Exists(Path.Combine(dir, "HRKonek.csproj")))
                {
                    var maybe = Directory.GetParent(dir);
                    if (maybe is not null) maybe = maybe.Parent;
                    if (maybe is not null) maybe = maybe.Parent;
                    if (maybe is not null && File.Exists(Path.Combine(maybe.FullName, "package.json")))
                    {
                        _root = maybe.FullName;
                        return _root;
                    }
                }
                var p = Directory.GetParent(dir);
                if (p is null) break;
                dir = p.FullName;
            }

            throw new DirectoryNotFoundException(
                "Could not locate HRKonek project root.");
        }
    }
}
```

---

## Architecture Overview

```
HRKonek.exe  (WinForms + WebView2)
    │
    ├── Program.cs          Entry point, single-instance mutex,
    │                       error handling, Node.js check
    │
    ├── SplashForm.cs       Animated splash screen (WebView2),
    │                       shows startup progress
    │
    ├── MainForm.cs         Main window hosting Next.js UI in
    │                       WebView2, custom title bar + resize
    │
    ├── ServerManager.cs    Manages Next.js server lifecycle:
    │                       port discovery, start, health checks,
    │                       kill on exit
    │
    └── AppPaths.cs         Walks directory tree to find
                            Next.js project root
```

The C# desktop app acts as a **native shell** that:
1. Validates prerequisites (Node.js, build artifacts)
2. Launches a Next.js dev/production server
3. Displays the web app inside a frameless, resizable WebView2 window
4. Handles window chrome (drag, minimize/maximize/close) via JavaScript ↔ C# messaging
