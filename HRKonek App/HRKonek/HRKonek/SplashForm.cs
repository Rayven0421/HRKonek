using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

namespace HRKonek;

/// <summary>
/// Ultra-smooth splash screen.
///
/// Design philosophy: kill the lag by killing the work.
///   • The entire background, icon, title, and tagline are painted ONCE
///     into _staticBmp at construction — never touched again.
///   • Per frame: blit static bmp + two DrawArc + one DrawString.
///     That is literally four GDI calls per frame.
///   • No PathGradientBrush, no per-frame brush/pen/font allocation,
///     no glow pulse — removed entirely.
///   • Timer at 33 ms (~30 fps) — smooth for a splash, half the CPU of 60fps.
///   • WS_EX_COMPOSITED lets the OS double-buffer the window natively.
/// </summary>
internal sealed class SplashForm : Form
{
    // ── Config ──────────────────────────────────────────────────────────
    private const string IconPath =
        @"C:\Users\rayve\Desktop\HRKonek\hrkonek\public\hrkonek-icon.png";

    private const int W = 400;
    private const int H = 280;
    private const int Radius = 18;
    private const int CX = W / 2;

    // ── Palette ─────────────────────────────────────────────────────────
    private static readonly Color BgTop = Color.FromArgb(11, 17, 38);
    private static readonly Color BgBot = Color.FromArgb(17, 27, 60);
    private static readonly Color AccentA = Color.FromArgb(59, 130, 246);
    private static readonly Color AccentB = Color.FromArgb(99, 102, 241);
    private static readonly Color TextSub = Color.FromArgb(148, 163, 184);
    private static readonly Color BorderClr = Color.FromArgb(45, 65, 130);

    // ── Animation state ──────────────────────────────────────────────────
    private float _spinAngle;
    private int _dotTick;
    private int _dotPhase;   // 0, 1, 2

    // ── Static backing bitmap ────────────────────────────────────────────
    private readonly Bitmap _staticBmp;

    // ── Cached per-frame resources (allocated once) ──────────────────────
    private readonly Font _statusFont;
    private readonly SolidBrush _statusBrush;
    private readonly Pen _arcPen;
    private readonly Pen _arcTrailPen;
    private static readonly Rectangle ArcRect = new(CX - 13, 210 - 13, 26, 26);

    // ── Timer ───────────────────────────────────────────────────────────
    private readonly System.Windows.Forms.Timer _timer;

    // ── Constructor ─────────────────────────────────────────────────────
    public SplashForm()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(W, H);
        DoubleBuffered = true;
        TransparencyKey = Color.Magenta;
        BackColor = Color.Magenta;

        // Pre-allocate per-frame resources
        _statusFont = new Font("Segoe UI", 10.5f, FontStyle.Regular);
        _statusBrush = new SolidBrush(TextSub);
        _arcPen = new Pen(AccentA, 2.5f)
        { StartCap = LineCap.Round, EndCap = LineCap.Round };
        _arcTrailPen = new Pen(Color.FromArgb(110, AccentB), 2.5f)
        { StartCap = LineCap.Round, EndCap = LineCap.Round };

        // Bake static layer once
        _staticBmp = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        BakeStaticLayer();

        // Timer ~30 fps
        _timer = new System.Windows.Forms.Timer { Interval = 33 };
        _timer.Tick += OnTick;
        _timer.Start();
    }

    // ── OS-level compositing ─────────────────────────────────────────────
    protected override CreateParams CreateParams
    {
        get
        {
            const int WS_EX_COMPOSITED = 0x02000000;
            var cp = base.CreateParams;
            cp.ExStyle |= WS_EX_COMPOSITED;
            return cp;
        }
    }

    // ── Bake static layer ────────────────────────────────────────────────
    private void BakeStaticLayer()
    {
        using var g = Graphics.FromImage(_staticBmp);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        var bounds = new Rectangle(0, 0, W, H);
        using var path = RoundedRect(bounds, Radius);

        // Background gradient
        using var bgBrush = new LinearGradientBrush(
            bounds, BgTop, BgBot, LinearGradientMode.Vertical);
        g.FillPath(bgBrush, path);

        // Subtle static centre glow (baked, zero runtime cost)
        using var glowBrush = new SolidBrush(Color.FromArgb(16, AccentA));
        g.FillEllipse(glowBrush, CX - 120, 10, 240, 190);

        // Border rim
        using var borderPen = new Pen(Color.FromArgb(55, BorderClr), 1f);
        g.DrawPath(borderPen, path);

        // Top accent stripe
        using var stripeBrush = new LinearGradientBrush(
            new Rectangle(0, 0, W, 2), AccentA, AccentB,
            LinearGradientMode.Horizontal);
        using var stripeClip = RoundedRect(new Rectangle(0, 0, W, Radius + 2), Radius);
        g.SetClip(stripeClip);
        g.FillRectangle(stripeBrush, 0, 0, W, 2);
        g.ResetClip();

        // Icon
        const int iconSize = 64;
        const int iconY = 34;
        int iconX = CX - iconSize / 2;

        using var ringPen = new Pen(Color.FromArgb(50, AccentA), 1.5f);
        g.DrawEllipse(ringPen, iconX - 6, iconY - 6, iconSize + 12, iconSize + 12);

        Bitmap? icon = null;
        try
        {
            if (File.Exists(IconPath))
                using (var raw = new Bitmap(IconPath))
                    icon = MakeCircular(raw, iconSize);
        }
        catch { }

        if (icon is not null)
        {
            g.DrawImage(icon, iconX, iconY, iconSize, iconSize);
            icon.Dispose();
        }
        else
        {
            using var fb = new SolidBrush(Color.FromArgb(30, 58, 138));
            g.FillEllipse(fb, iconX, iconY, iconSize, iconSize);
            using var fnt = new Font("Segoe UI", 20f, FontStyle.Bold);
            var isz = g.MeasureString("HR", fnt);
            g.DrawString("HR", fnt, Brushes.White,
                CX - isz.Width / 2f, iconY + iconSize / 2f - isz.Height / 2f);
        }

        // Title
        using var titleFont = new Font("Segoe UI", 22f, FontStyle.Bold);
        var tsz = g.MeasureString("HRKonek", titleFont);
        g.DrawString("HRKonek", titleFont, Brushes.White,
            CX - tsz.Width / 2f, 108f);

        // Tagline
        using var tagFont = new Font("Segoe UI", 8.5f, FontStyle.Regular);
        using var tagBrush = new SolidBrush(Color.FromArgb(95, TextSub));
        var tgsz = g.MeasureString("Human Resource Information System", tagFont);
        g.DrawString("Human Resource Information System", tagFont, tagBrush,
            CX - tgsz.Width / 2f, 138f);

        // Arc track ring (static)
        using var trackPen = new Pen(Color.FromArgb(28, TextSub), 2.5f);
        g.DrawEllipse(trackPen, ArcRect);
    }

    // ── Timer tick ──────────────────────────────────────────────────────
    private void OnTick(object? sender, EventArgs e)
    {
        _spinAngle = (_spinAngle + 6f) % 360f;

        _dotTick++;
        if (_dotTick >= 14)
        {
            _dotTick = 0;
            _dotPhase = (_dotPhase + 1) % 3;
        }

        Invalidate();
    }

    // ── Paint — just a blit + 3 GDI calls ───────────────────────────────
    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        // 1. Blit static layer
        g.DrawImageUnscaled(_staticBmp, 0, 0);

        // 2. Spinning arc
        g.DrawArc(_arcPen, ArcRect, _spinAngle, 110f);
        g.DrawArc(_arcTrailPen, ArcRect, _spinAngle + 110f, 55f);

        // 3. Status text
        string status = _dotPhase switch
        {
            0 => "Starting server.",
            1 => "Starting server..",
            _ => "Starting server..."
        };
        var sz = g.MeasureString(status, _statusFont);
        g.DrawString(status, _statusFont, _statusBrush,
            CX - sz.Width / 2f, 233f);
    }

    // ── Region ──────────────────────────────────────────────────────────
    protected override void OnResize(EventArgs e) { base.OnResize(e); ApplyRegion(); }
    protected override void OnLoad(EventArgs e) { base.OnLoad(e); ApplyRegion(); }
    private void ApplyRegion() =>
        Region = new Region(RoundedRect(new Rectangle(0, 0, W, H), Radius));

    // ── Helpers ─────────────────────────────────────────────────────────
    private static GraphicsPath RoundedRect(Rectangle r, int rad)
    {
        int d = rad * 2;
        var gp = new GraphicsPath();
        gp.AddArc(r.X, r.Y, d, d, 180, 90);
        gp.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        gp.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        gp.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        gp.CloseFigure();
        return gp;
    }

    private static Bitmap MakeCircular(Bitmap src, int size)
    {
        var bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using var g = Graphics.FromImage(bmp);
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        using var clip = new GraphicsPath();
        clip.AddEllipse(0, 0, size, size);
        g.SetClip(clip);
        g.DrawImage(src, 0, 0, size, size);
        return bmp;
    }

    // ── Cleanup ─────────────────────────────────────────────────────────
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _timer.Stop();
            _timer.Dispose();
            _staticBmp.Dispose();
            _statusFont.Dispose();
            _statusBrush.Dispose();
            _arcPen.Dispose();
            _arcTrailPen.Dispose();
        }
        base.Dispose(disposing);
    }
}