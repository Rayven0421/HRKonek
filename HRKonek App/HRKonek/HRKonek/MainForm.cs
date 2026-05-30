using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Web.WebView2.Core;

namespace HRKonek;

/// <summary>
/// Main borderless window with a custom title bar, WebView2 that
/// loads the Next.js app, and a Ctrl+Shift+D dev-log viewer.
/// </summary>
internal partial class MainForm : Form
{
    // ── Constants ─────────────────────────────────────────────────────
    private const string IconPath =
        @"C:\Users\rayve\Desktop\HRKonek\hrkonek\public\hrkonek-icon.png";

    private const string WebViewDataFolder =
        @"C:\Users\rayve\Desktop\HRKonek\hrkonek\HRKonek App\WebViewData";

    private const int TitleBarHeight = 32;

    // Win32 hit-test values
    private const int WM_NCHITTEST  = 0x0084;
    private const int WM_NCCALCSIZE = 0x0083;
    private const int HTCLIENT    = 1;
    private const int HTLEFT      = 10;
    private const int HTRIGHT     = 11;
    private const int HTTOP       = 12;
    private const int HTTOPLEFT   = 13;
    private const int HTTOPRIGHT  = 14;
    private const int HTBOTTOM    = 15;
    private const int HTBOTTOMLEFT  = 16;
    private const int HTBOTTOMRIGHT = 17;

    // ── Fields ────────────────────────────────────────────────────────
    private readonly Process _npmProcess;
    private readonly StringBuilder _npmOutput;
    private readonly Bitmap? _appIcon;

    private bool _hoverMinimize;
    private bool _hoverMaximize;
    private bool _hoverClose;

    private DevLogForm? _devLogForm;

    // ── Constructor ───────────────────────────────────────────────────
    public MainForm(Process npmProcess, StringBuilder npmOutput)
    {
        _npmProcess  = npmProcess;
        _npmOutput   = npmOutput;
        _appIcon     = LoadAppIcon();

        InitializeComponent();
        WireEvents();
        _ = InitializeWebViewAsync();

        // Set the window icon for the taskbar / Alt-Tab
        if (_appIcon is not null)
            Icon = Icon.FromHandle(_appIcon.GetHicon());
    }

    // ── Icon loading ──────────────────────────────────────────────────
    private static Bitmap? LoadAppIcon()
    {
        try
        {
            if (File.Exists(IconPath))
                return new Bitmap(IconPath);
        }
        catch { /* best-effort */ }
        return null;
    }

    // ── Event wiring ──────────────────────────────────────────────────
    private void WireEvents()
    {
        // Title bar
        titleBarPanel.Paint       += TitleBar_Paint;
        titleBarPanel.DoubleClick += (_, _) => ToggleMaximize();
        titleBarPanel.MouseDown   += TitleBar_MouseDown;

        // Minimize button
        btnMinimize.Paint       += BtnMinimize_Paint;
        btnMinimize.MouseEnter  += (_, _) => { _hoverMinimize = true;  btnMinimize.Invalidate(); };
        btnMinimize.MouseLeave  += (_, _) => { _hoverMinimize = false; btnMinimize.Invalidate(); };
        btnMinimize.Click       += (_, _) => WindowState = FormWindowState.Minimized;

        // Maximize / restore button
        btnMaximize.Paint       += BtnMaximize_Paint;
        btnMaximize.MouseEnter  += (_, _) => { _hoverMaximize = true;  btnMaximize.Invalidate(); };
        btnMaximize.MouseLeave  += (_, _) => { _hoverMaximize = false; btnMaximize.Invalidate(); };
        btnMaximize.Click       += (_, _) => ToggleMaximize();

        // Close button
        btnClose.Paint       += BtnClose_Paint;
        btnClose.MouseEnter  += (_, _) => { _hoverClose = true;  btnClose.Invalidate(); };
        btnClose.MouseLeave  += (_, _) => { _hoverClose = false; btnClose.Invalidate(); };
        btnClose.Click       += (_, _) => Close();

        // Form lifecycle
        FormClosing += OnFormClosing;
    }

    // ── WebView2 initialization ───────────────────────────────────────
    private async Task InitializeWebViewAsync()
    {
        try
        {
            // Ensure the persistent data folder exists
            Directory.CreateDirectory(WebViewDataFolder);

            var env = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: WebViewDataFolder,
                options: new CoreWebView2EnvironmentOptions());

            await webView.EnsureCoreWebView2Async(env);
            webView.CoreWebView2.Navigate("http://localhost:3000");
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Failed to initialize WebView2.\n\n{ex.Message}\n\n" +
                "Please ensure the WebView2 Runtime is installed.",
                "HRKonek",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
        }
    }

    // ── Custom title bar painting ─────────────────────────────────────
    private void TitleBar_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        // Icon (20×20, 12 px left padding, vertically centered)
        if (_appIcon is not null)
            g.DrawImage(_appIcon, 12, (TitleBarHeight - 20) / 2, 20, 20);

        // Title text
        using var font = new Font("Segoe UI", 13f);
        using var brush = new SolidBrush(Color.White);
        g.DrawString("HRKonek", font, brush, 40f, 7f);
    }

    // ── Button painting ───────────────────────────────────────────────
    private void BtnMinimize_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        if (_hoverMinimize)
        {
            using var bg = new SolidBrush(Color.FromArgb(0x2D, 0x4F, 0x9E));
            g.FillRectangle(bg, btnMinimize.ClientRectangle);
        }

        using var pen = new Pen(Color.White, 1.5f);
        int cx = btnMinimize.Width / 2;
        int cy = btnMinimize.Height / 2;
        g.DrawLine(pen, cx - 7, cy, cx + 7, cy);
    }

    private void BtnMaximize_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        if (_hoverMaximize)
        {
            using var bg = new SolidBrush(Color.FromArgb(0x2D, 0x4F, 0x9E));
            g.FillRectangle(bg, btnMaximize.ClientRectangle);
        }

        using var pen = new Pen(Color.White, 1.5f);
        int cx = btnMaximize.Width / 2;
        int cy = btnMaximize.Height / 2;

        if (WindowState == FormWindowState.Maximized)
        {
            // Restore icon — two overlapping rectangles
            g.DrawRectangle(pen, cx - 7, cy - 3, 10, 10);
            g.DrawRectangle(pen, cx - 3, cy - 7, 10, 10);
        }
        else
        {
            // Maximize icon — single rectangle
            g.DrawRectangle(pen, cx - 6, cy - 6, 12, 12);
        }
    }

    private void BtnClose_Paint(object? sender, PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        if (_hoverClose)
        {
            using var bg = new SolidBrush(Color.FromArgb(0xE8, 0x11, 0x23));
            g.FillRectangle(bg, btnClose.ClientRectangle);
        }

        using var pen = new Pen(Color.White, 1.5f);
        int cx = btnClose.Width / 2;
        int cy = btnClose.Height / 2;
        g.DrawLine(pen, cx - 5, cy - 5, cx + 5, cy + 5);
        g.DrawLine(pen, cx + 5, cy - 5, cx - 5, cy + 5);
    }

    // ── Title bar drag / double-click ─────────────────────────────────
    private void TitleBar_MouseDown(object? sender, MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Left) return;

        // Release capture then send WM_NCLBUTTONDOWN with HTCAPTION
        // so the OS handles window dragging natively.
        NativeMethods.ReleaseCapture();
        NativeMethods.SendMessage(Handle, 0x00A1 /* WM_NCLBUTTONDOWN */, 2 /* HTCAPTION */, 0);
    }

    private void ToggleMaximize()
    {
        WindowState = WindowState == FormWindowState.Maximized
            ? FormWindowState.Normal
            : FormWindowState.Maximized;
    }

    // ── Repaint maximize button when window state changes ─────────────
    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        btnMaximize.Invalidate();
    }

    // ── Borderless window: CreateParams ───────────────────────────────
    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.Style |= 0x00040000; // WS_THICKFRAME  — enables resize borders
            cp.Style |= 0x00020000; // WS_MINIMIZEBOX — allows minimize from taskbar
            cp.Style |= 0x00010000; // WS_MAXIMIZEBOX — allows maximize
            return cp;
        }
    }

    // ── Borderless window: WndProc ────────────────────────────────────
    protected override void WndProc(ref Message m)
    {
        // ── Hit-test: resize edges ───────────────────────────────────
        if (m.Msg == WM_NCHITTEST)
        {
            var pos = PointToClient(new Point(m.LParam.ToInt32()));
            int margin = 8;

            bool atLeft   = pos.X < margin;
            bool atRight  = pos.X > Width - margin;
            bool atTop    = pos.Y < margin;
            bool atBottom = pos.Y > Height - margin;

            if (atTop && atLeft)     { m.Result = (IntPtr)HTTOPLEFT;     return; }
            if (atTop && atRight)    { m.Result = (IntPtr)HTTOPRIGHT;    return; }
            if (atBottom && atLeft)  { m.Result = (IntPtr)HTBOTTOMLEFT;  return; }
            if (atBottom && atRight) { m.Result = (IntPtr)HTBOTTOMRIGHT; return; }
            if (atLeft)   { m.Result = (IntPtr)HTLEFT;   return; }
            if (atRight)  { m.Result = (IntPtr)HTRIGHT;  return; }
            if (atTop)    { m.Result = (IntPtr)HTTOP;    return; }
            if (atBottom) { m.Result = (IntPtr)HTBOTTOM; return; }

            m.Result = (IntPtr)HTCLIENT;
            return;
        }

        // ── Non-client size calc: make maximize respect the taskbar ──
        if (m.Msg == WM_NCCALCSIZE && m.WParam.ToInt32() == 1)
        {
            if (WindowState == FormWindowState.Maximized)
            {
                var nccsp = Marshal.PtrToStructure<NativeMethods.NCCALCSIZE_PARAMS>(m.LParam);
                IntPtr monitor = NativeMethods.MonitorFromWindow(
                    Handle, NativeMethods.MONITOR_DEFAULTTONEAREST);

                var monitorInfo = new NativeMethods.MONITORINFO
                {
                    cbSize = Marshal.SizeOf<NativeMethods.MONITORINFO>()
                };

                if (NativeMethods.GetMonitorInfo(monitor, ref monitorInfo))
                {
                    nccsp.rgrc[0] = monitorInfo.rcWork;
                    Marshal.StructureToPtr(nccsp, m.LParam, true);
                }

                m.Result = IntPtr.Zero;
                return;
            }

            // Non-maximized: just strip the non-client area
            var nccspDefault = Marshal.PtrToStructure<NativeMethods.NCCALCSIZE_PARAMS>(m.LParam);
            nccspDefault.rgrc[0] = nccspDefault.rgrc[1];
            Marshal.StructureToPtr(nccspDefault, m.LParam, true);
            m.Result = IntPtr.Zero;
            return;
        }

        base.WndProc(ref m);
    }

    // ── Keyboard shortcut: Ctrl+Shift+D → DevLog ─────────────────────
    protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
    {
        if (keyData == (Keys.Control | Keys.Shift | Keys.D))
        {
            ToggleDevLog();
            return true;
        }
        return base.ProcessCmdKey(ref msg, keyData);
    }

    private void ToggleDevLog()
    {
        if (_devLogForm is null || _devLogForm.IsDisposed)
        {
            _devLogForm = new DevLogForm(_npmOutput);
            _devLogForm.Show(this);
        }
        else
        {
            _devLogForm.Visible = !_devLogForm.Visible;
            if (_devLogForm.Visible)
                _devLogForm.BringToFront();
        }
    }

    // ── Form closing: kill npm process tree ───────────────────────────
    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        try
        {
            if (_npmProcess is { HasExited: false })
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "taskkill",
                    Arguments = $"/F /T /PID {_npmProcess.Id}",
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
            }
        }
        catch { /* best-effort cleanup */ }

        _devLogForm?.Close();
        _devLogForm?.Dispose();
    }

    // ═════════════════════════════════════════════════════════════════
    //  Nested: DevLogForm — small resizable window showing npm output
    // ═════════════════════════════════════════════════════════════════
    internal sealed class DevLogForm : Form
    {
        private readonly TextBox _textBox;
        private readonly System.Windows.Forms.Timer _timer;
        private readonly StringBuilder _output;
        private int _lastLen;

        public DevLogForm(StringBuilder output)
        {
            _output = output;

            Text       = "HRKonek — Dev Log";
            Size       = new Size(650, 420);
            MinimumSize = new Size(400, 200);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor  = Color.FromArgb(30, 30, 30);

            _textBox = new TextBox
            {
                Dock      = DockStyle.Fill,
                Multiline = true,
                ReadOnly  = true,
                ScrollBars = ScrollBars.Vertical,
                BackColor  = Color.FromArgb(30, 30, 30),
                ForeColor  = Color.FromArgb(212, 212, 212),
                Font       = new Font("Consolas", 9f),
                BorderStyle = BorderStyle.None,
                WordWrap   = false,
            };
            Controls.Add(_textBox);

            _timer = new System.Windows.Forms.Timer { Interval = 500 };
            _timer.Tick += (_, _) =>
            {
                string snapshot;
                lock (_output) { snapshot = _output.ToString(); }

                if (snapshot.Length <= _lastLen) return;

                _textBox.AppendText(snapshot.Substring(_lastLen));
                _lastLen = snapshot.Length;
                _textBox.SelectionStart = _textBox.TextLength;
                _textBox.ScrollToCaret();
            };
            _timer.Start();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _timer.Stop();
                _timer.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    // ═════════════════════════════════════════════════════════════════
    //  P/Invoke helpers
    // ═════════════════════════════════════════════════════════════════
    private static class NativeMethods
    {
        public const uint MONITOR_DEFAULTTONEAREST = 2;

        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        public static extern IntPtr SendMessage(IntPtr hWnd, int msg, int wParam, int lParam);

        [DllImport("user32.dll")]
        public static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

        [DllImport("user32.dll")]
        public static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int Left, Top, Right, Bottom;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct POINT
        {
            public int X, Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct NCCALCSIZE_PARAMS
        {
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 3)]
            public RECT[] rgrc;
            public IntPtr lppos;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct MONITORINFO
        {
            public int   cbSize;
            public RECT  rcMonitor;
            public RECT  rcWork;
            public uint  dwFlags;
        }
    }
}
