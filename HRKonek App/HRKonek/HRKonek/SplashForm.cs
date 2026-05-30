using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HRKonek
{
    public partial class SplashForm : Form
    {
        private CancellationTokenSource _cts = new();
        private bool _webViewReady = false;

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(
            IntPtr hwnd, int attr,
            ref int attrValue, int attrSize);

        private const int
            DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int
            DWMWCP_ROUND = 2;

        public SplashForm()
        {
            InitializeComponent();
        }

        protected override void OnHandleCreated(
            EventArgs e)
        {
            base.OnHandleCreated(e);

            try
            {
                int preference = DWMWCP_ROUND;
                DwmSetWindowAttribute(
                    Handle,
                    DWMWA_WINDOW_CORNER_PREFERENCE,
                    ref preference,
                    sizeof(int));
            }
            catch { }

            try
            {
                var path = new GraphicsPath();
                int r = 16;
                int w = Width;
                int h = Height;

                path.AddArc(0, 0, r * 2, r * 2,
                    180, 90);
                path.AddArc(w - r * 2, 0,
                    r * 2, r * 2, 270, 90);
                path.AddArc(w - r * 2, h - r * 2,
                    r * 2, r * 2, 0, 90);
                path.AddArc(0, h - r * 2,
                    r * 2, r * 2, 90, 90);
                path.CloseFigure();

                Region = new Region(path);
            }
            catch { }
        }

        protected override async void OnLoad(
            EventArgs e)
        {
            base.OnLoad(e);
            await InitSplashWebViewAsync();
        }

        private async Task InitSplashWebViewAsync()
        {
            try
            {
                var env = await
                    CoreWebView2Environment
                    .CreateAsync(null,
                        Path.Combine(
                            Path.GetTempPath(),
                            "HRKonekSplash"));

                await _splashView
                    .EnsureCoreWebView2Async(env);

                // Disable all browser UI
                var s = _splashView
                    .CoreWebView2.Settings;
                s.AreDefaultContextMenusEnabled
                    = false;
                s.AreDevToolsEnabled = false;
                s.IsStatusBarEnabled = false;
                s.IsZoomControlEnabled = false;

                // Load the HTML splash content
                _splashView.CoreWebView2
                    .NavigateToString(
                        GetSplashHtml("Initializing..."));

                _splashView.CoreWebView2
                    .NavigationCompleted += (s, e) =>
                    {
                        _webViewReady = true;
                        _ = RunStartupAsync();
                    };
            }
            catch
            {
                // WebView2 not available,
                // start server anyway
                _webViewReady = true;
                _ = RunStartupAsync();
            }
        }

        private void UpdateStatus(
            string message, int percent)
        {
            if (!_webViewReady) return;
            if (!IsHandleCreated) return;

            BeginInvoke(new Action(async () =>
            {
                try
                {
                    string safeMsg = message
                        .Replace("'", "\\'")
                        .Replace("\"", "\\\"");

                    await _splashView.CoreWebView2
                        .ExecuteScriptAsync(
                        $"updateProgress('{safeMsg}'" +
                        $", {percent});");
                }
                catch { /* ignore */ }
            }));
        }

        private async Task RunStartupAsync()
        {
            var progress = new Progress<string>(msg =>
            {
                // Map message to rough percent
                int pct = msg.Contains("Locating")
                    ? 10
                    : msg.Contains("Checking")
                    ? 25
                    : msg.Contains("port")
                    ? 35
                    : msg.Contains("Starting")
                    ? 50
                    : msg.Contains("Waiting") ||
                      msg.Contains(".")
                    ? 70
                    : msg.Contains("ready")
                    ? 95
                    : msg.Contains("ERROR")
                    ? 100
                    : 60;

                UpdateStatus(msg, pct);
            });

            try
            {
                bool ok = await
                    ServerManager.StartAsync(
                        progress, _cts.Token);

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
                else
                {
                    BeginInvoke(new Action(() =>
                    {
                        MessageBox.Show(
                            "Failed to start server.\n\n"
                            + "Make sure:\n"
                            + "• Node.js is installed\n"
                            + "• Run npm run build first",
                            "Startup Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error);
                        Application.Exit();
                    }));
                }
            }
            catch (OperationCanceledException)
            {
                Application.Exit();
            }
            catch (Exception ex)
            {
                BeginInvoke(new Action(() =>
                {
                    MessageBox.Show(
                        "Error: " + ex.Message,
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    Application.Exit();
                }));
            }
        }

        private static string GetSplashHtml(
            string initialStatus)
        {
            string iconBase64 = "";
            try
            {
                string iconPath = Path.Combine(
                    AppDomain.CurrentDomain
                        .BaseDirectory,
                    "hrkonek-icon.png");

                if (File.Exists(iconPath))
                {
                    byte[] bytes = File.ReadAllBytes(
                        iconPath);
                    iconBase64 = Convert
                        .ToBase64String(bytes);
                }
            }
            catch { }

            string imgTag = !string.IsNullOrEmpty(
                iconBase64)
                ? $"<img src='data:image/png;" +
                  $"base64,{iconBase64}' " +
                  $"class='logo-img' />"
                : "<span class='logo-fallback'>HR</span>";

            return $@"<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
  * {{
    margin: 0; padding: 0;
    box-sizing: border-box;
  }}

  html, body {{
    width: 480px;
    height: 300px;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(
      135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }}

  .card {{
    width: 380px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    padding: 28px 24px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .logo-wrap {{
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid #1E3A8A;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 12px;
    background: #f8faff;
  }}

  .logo-img {{
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: contain;
  }}

  .logo-fallback {{
    color: #1E3A8A;
    font-size: 22px;
    font-weight: 700;
  }}

  .app-name {{
    color: #111827;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.3px;
    margin-bottom: 1px;
  }}

  .app-sub {{
    color: #9ca3af;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }}

  .progress-wrap {{
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }}

  .progress-track {{
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }}

  .progress-fill {{
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(
      90deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%
    );
    background-size: 200% 100%;
    width: 0%;
    transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
    animation: shimmer 1.8s linear infinite;
  }}

  @keyframes shimmer {{
    0%   {{ background-position: 200% 0; }}
    100% {{ background-position: -200% 0; }}
  }}

  .status-text {{
    color: #6b7280;
    font-size: 11px;
    text-align: center;
    min-height: 16px;
  }}

  .version {{
    position: absolute;
    bottom: 10px;
    right: 14px;
    color: rgba(255,255,255,0.4);
    font-size: 9px;
    letter-spacing: 0.5px;
  }}
</style>
</head>
<body>
  <div class='version'>v1.0.0</div>

  <div class='card'>
    <div class='logo-wrap'>
      {imgTag}
    </div>
    <div class='app-name'>HRKonek</div>
    <div class='app-sub'>Human Resource Information System</div>
    <div class='progress-wrap'>
      <div class='progress-track'>
        <div class='progress-fill' id='bar'></div>
      </div>
      <div class='status-text' id='status'>Initializing...</div>
    </div>
  </div>

<script>
  function updateProgress(message, percent) {{
    var bar = document.getElementById('bar');
    var status = document.getElementById('status');
    if (bar) bar.style.width = percent + '%';
    if (status) status.textContent = message;
  }}
  updateProgress('Initializing...', 5);
</script>
</body>
</html>";
        }

        protected override void OnFormClosing(
            FormClosingEventArgs e)
        {
            _cts.Cancel();
            base.OnFormClosing(e);
        }
    }
}
