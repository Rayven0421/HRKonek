#nullable disable

namespace HRKonek;

partial class MainForm
{
    private System.ComponentModel.IContainer components = null!;

    // ── Controls ──────────────────────────────────────────────────────
    private Panel titleBarPanel = null!;
    private Label titleLabel = null!;
    private Panel btnMinimize = null!;
    private Panel btnMaximize = null!;
    private Panel btnClose = null!;
    private Microsoft.Web.WebView2.WinForms.WebView2 webView = null!;

    // ── Dispose ───────────────────────────────────────────────────────
    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            components?.Dispose();
            webView?.Dispose();
        }
        base.Dispose(disposing);
    }

    // ── Designer-generated layout ─────────────────────────────────────
    private void InitializeComponent()
    {
        // ── Title bar panel ──────────────────────────────────────────
        titleBarPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 32,
            BackColor = Color.FromArgb(30, 58, 138), // #1E3A8A
        };

        // ── Title label ──────────────────────────────────────────────
        titleLabel = new Label
        {
            Text = "HRKonek",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 13f),
            AutoSize = true,
            Location = new Point(40, 7),
            BackColor = Color.Transparent,
            Padding = new Padding(0),
            Margin = new Padding(0),
        };

        // ── Close button (rightmost) ─────────────────────────────────
        btnClose = new Panel
        {
            Size = new Size(46, 32),
            Dock = DockStyle.Right,
            BackColor = Color.Transparent,
            Cursor = Cursors.Hand,
        };

        // ── Maximize button ──────────────────────────────────────────
        btnMaximize = new Panel
        {
            Size = new Size(46, 32),
            Dock = DockStyle.Right,
            BackColor = Color.Transparent,
            Cursor = Cursors.Hand,
        };

        // ── Minimize button ──────────────────────────────────────────
        btnMinimize = new Panel
        {
            Size = new Size(46, 32),
            Dock = DockStyle.Right,
            BackColor = Color.Transparent,
            Cursor = Cursors.Hand,
        };

        // ── WebView2 ─────────────────────────────────────────────────
        webView = new Microsoft.Web.WebView2.WinForms.WebView2
        {
            Dock = DockStyle.Fill,
        };

        // ── Assemble title bar (order matters for Dock.Right) ────────
        //    Controls added first are pushed furthest right.
        //    btnClose first → rightmost, btnMinimize last → leftmost of the three.
        titleBarPanel.Controls.Add(titleLabel);
        titleBarPanel.Controls.Add(btnMinimize);
        titleBarPanel.Controls.Add(btnMaximize);
        titleBarPanel.Controls.Add(btnClose);

        // ── Assemble form ────────────────────────────────────────────
        Controls.Add(webView);
        Controls.Add(titleBarPanel);

        // ── Form defaults ────────────────────────────────────────────
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(1280, 800);
        BackColor = Color.FromArgb(15, 23, 42); // #0F172A — matches splash bg
        DoubleBuffered = true;
    }
}
