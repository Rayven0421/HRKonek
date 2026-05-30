using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HRKonek
{
    public partial class MainForm : Form
    {
        private bool _isMaximized = false;

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        private static extern int SendMessage(
            IntPtr hWnd, int Msg,
            int wParam, int lParam);

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(
            IntPtr hwnd, int attr,
            ref int attrValue, int attrSize);

        private const int
            DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int
            DWMWCP_ROUND = 2;
        private const int
            DWMWCP_DONOTROUND = 1;

        private const int WM_NCHITTEST = 0x84;
        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int WM_SIZE = 0x0005;
        private const int WM_EXITSIZEMOVE = 0x0232;
        private const int SIZE_RESTORED = 0;
        private const int SIZE_MAXIMIZED = 2;

        private Rectangle _maxBounds;

        public MainForm()
        {
            InitializeComponent();

            SetStyle(
                ControlStyles.OptimizedDoubleBuffer |
                ControlStyles.AllPaintingInWmPaint,
                true);

            ResizeBegin += (s, e) =>
                SuspendLayout();

            ResizeEnd += (s, e) =>
            {
                ResumeLayout(true);
                ForceWebViewResize();
            };
        }

        protected override async void OnLoad(
            EventArgs e)
        {
            base.OnLoad(e);

            // Center on screen
            var screen = Screen.GetWorkingArea(this);
            Location = new Point(
                (screen.Width - Width) / 2 + screen.Left,
                (screen.Height - Height) / 2 + screen.Top);

            _maxBounds = screen;

            await InitWebViewAsync();
        }

        protected override void OnHandleCreated(
            EventArgs e)
        {
            base.OnHandleCreated(e);
            ApplyRoundedCorners();
        }

        private void ApplyRoundedCorners()
        {
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
        }

        private void RemoveRoundedCorners()
        {
            try
            {
                int preference = DWMWCP_DONOTROUND;
                DwmSetWindowAttribute(
                    Handle,
                    DWMWA_WINDOW_CORNER_PREFERENCE,
                    ref preference,
                    sizeof(int));
            }
            catch { }
        }

        private void ForceWebViewResize()
        {
            if (_webView == null) return;

            _webView.SuspendLayout();
            _webView.Location = Point.Empty;
            _webView.Size = ClientSize;
            _webView.ResumeLayout(true);
            _webView.Invalidate();
            _webView.Update();
        }

        private const int
            HTCLIENT = 1,
            HTCAPTION = 2,
            HTLEFT = 10,
            HTRIGHT = 11,
            HTTOP = 12,
            HTTOPLEFT = 13,
            HTTOPRIGHT = 14,
            HTBOTTOM = 15,
            HTBOTTOMLEFT = 16,
            HTBOTTOMRIGHT = 17;

        private const int RESIZE_BORDER = 6;

        protected override void WndProc(
            ref Message m)
        {
            if (m.Msg == WM_NCHITTEST)
            {
                int lParam = m.LParam.ToInt32();
                int scrX = (short)(lParam & 0xFFFF);
                int scrY = (short)((lParam >> 16) & 0xFFFF);
                var pt = PointToClient(
                    new Point(scrX, scrY));
                int x = pt.X, y = pt.Y,
                    w = Width, h = Height;
                int g = RESIZE_BORDER;

                // Resize corners
                if (y <= g && x <= g)
                    { m.Result = (IntPtr)HTTOPLEFT; return; }
                if (y <= g && x >= w - g)
                    { m.Result = (IntPtr)HTTOPRIGHT; return; }
                if (y >= h - g && x <= g)
                    { m.Result = (IntPtr)HTBOTTOMLEFT; return; }
                if (y >= h - g && x >= w - g)
                    { m.Result = (IntPtr)HTBOTTOMRIGHT; return; }
                // Resize edges
                if (y <= g)
                    { m.Result = (IntPtr)HTTOP; return; }
                if (y >= h - g)
                    { m.Result = (IntPtr)HTBOTTOM; return; }
                if (x <= g)
                    { m.Result = (IntPtr)HTLEFT; return; }
                if (x >= w - g)
                    { m.Result = (IntPtr)HTRIGHT; return; }

                // Titlebar drag — top 40px, buttons on right 160px excluded
                if (y >= 0 && y < 40 && x < w - 160)
                    { m.Result = (IntPtr)HTCAPTION; return; }

                // Let default handle everything else
                base.WndProc(ref m);
                return;
            }

            base.WndProc(ref m);

            switch (m.Msg)
            {
                case WM_EXITSIZEMOVE:
                    BeginInvoke(new Action(
                        ForceWebViewResize));
                    break;

                case WM_SIZE:
                    int type = m.WParam.ToInt32();
                    if (type == SIZE_RESTORED ||
                        type == SIZE_MAXIMIZED)
                    {
                        _isMaximized =
                            type == SIZE_MAXIMIZED;
                        BeginInvoke(new Action(
                            ForceWebViewResize));

                        if (_webView?.CoreWebView2
                            != null)
                        {
                            try
                            {
                                _webView.CoreWebView2
                                    .PostWebMessageAsString(
                                    _isMaximized
                                        ? "maximized"
                                        : "restored");
                            }
                            catch { }
                        }
                    }
                    break;
            }
        }

        protected override void OnResize(
            EventArgs e)
        {
            base.OnResize(e);

            if (WindowState ==
                FormWindowState.Maximized)
            {
                MaximizedBounds =
                    Screen.GetWorkingArea(this);
                RemoveRoundedCorners();
            }
            else if (WindowState ==
                FormWindowState.Normal)
            {
                ApplyRoundedCorners();
            }
        }

        private async Task InitWebViewAsync()
        {
            try
            {
                var env = await
                    CoreWebView2Environment
                    .CreateAsync(null,
                        Path.Combine(
                            Path.GetTempPath(),
                            "HRKonekWebView"));

                await _webView
                    .EnsureCoreWebView2Async(env);

                var settings =
                    _webView.CoreWebView2.Settings;
                settings
                    .AreDefaultContextMenusEnabled
                    = false;
                settings.AreDevToolsEnabled = false;
                settings.IsZoomControlEnabled
                    = false;
                settings.IsStatusBarEnabled = false;

                _webView.CoreWebView2
                    .NavigationCompleted +=
                    async (s, e) =>
                    {
                        await InjectScrollbarCSS();
                        ForceWebViewResize();
                    };

                _webView.CoreWebView2
                    .WebMessageReceived +=
                    HandleWebMessage;

                _webView.Source = new Uri(
                    $"http://localhost:" +
                    $"{Program.Port}");
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "WebView2 error:\n" +
                    ex.Message + "\n\n" +
                    "Install WebView2 Runtime from " +
                    "Microsoft.",
                    "WebView2 Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                Application.Exit();
            }
        }

        private async Task InjectScrollbarCSS()
        {
            try
            {
                await _webView.CoreWebView2
                    .ExecuteScriptAsync(@"
                    (function() {
                        const id =
                            'hrkonek-no-scrollbar';
                        if (document
                            .getElementById(id))
                            return;
                        const s = document
                            .createElement('style');
                        s.id = id;
                        s.textContent = `
                            ::-webkit-scrollbar {
                                display: none !important;
                                width: 0 !important;
                                height: 0 !important;
                            }
                            * {
                                scrollbar-width: none
                                    !important;
                                -ms-overflow-style: none
                                    !important;
                            }
                        `;
                        document.head.appendChild(s);
                    })();
                    ");
            }
            catch { }
        }

        private void HandleWebMessage(
            object? sender,
            CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string msg = e
                    .TryGetWebMessageAsString();

                switch (msg)
                {
                    case "drag":
                        // Synchronous — must happen while mouse is down
                        BeginInvoke(new Action(() =>
                        {
                            ReleaseCapture();
                            SendMessage(Handle,
                                WM_NCLBUTTONDOWN,
                                HTCAPTION, 0);
                        }));
                        break;

                    case "minimize":
                        BeginInvoke(new Action(() =>
                            WindowState =
                            FormWindowState
                            .Minimized));
                        break;

                    case "maximize":
                        BeginInvoke(new Action(() =>
                        {
                            if (_isMaximized)
                            {
                                WindowState =
                                    FormWindowState
                                    .Normal;
                                _isMaximized = false;
                            }
                            else
                            {
                                MaximizedBounds =
                                    Screen
                                    .GetWorkingArea(
                                        this);
                                WindowState =
                                    FormWindowState
                                    .Maximized;
                                _isMaximized = true;
                            }

                            Task.Delay(50)
                                .ContinueWith(_ =>
                                BeginInvoke(
                                    new Action(
                                    ForceWebViewResize
                                )));
                        }));
                        break;

                    case "close":
                        BeginInvoke(new Action(() =>
                        {
                            var r = MessageBox.Show(
                                "Exit HRKonek?",
                                "Confirm Exit",
                                MessageBoxButtons
                                    .YesNo,
                                MessageBoxIcon
                                    .Question);
                            if (r == DialogResult.Yes)
                            {
                                ServerManager.Stop();
                                Application.Exit();
                            }
                        }));
                        break;
                }
            }
            catch { }
        }

        protected override void OnFormClosing(
            FormClosingEventArgs e)
        {
            ServerManager.Stop();
            base.OnFormClosing(e);
        }
    }
}
