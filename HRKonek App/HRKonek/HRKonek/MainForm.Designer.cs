#nullable enable
using Microsoft.Web.WebView2.WinForms;

namespace HRKonek
{
    partial class MainForm
    {
        private WebView2 _webView = null!;
        private System.ComponentModel.IContainer?
            components = null;

        protected override void Dispose(
            bool disposing)
        {
            if (disposing && components != null)
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            _webView = new WebView2();
            ((System.ComponentModel.ISupportInitialize)
                _webView).BeginInit();
            SuspendLayout();

            // ── WebView2 ─────────────────────────
            _webView.Dock = DockStyle.Fill;
            _webView.Anchor = AnchorStyles.Top |
                AnchorStyles.Bottom |
                AnchorStyles.Left |
                AnchorStyles.Right;
            _webView.Name = "_webView";
            _webView.ZoomFactor = 1.0;

            // ── Form ─────────────────────────────
            Name = "MainForm";
            Text = "HRKonek";
            AutoScroll = false;
            AutoSize = false;
            ClientSize = new Size(1280, 800);
            MinimumSize = new Size(900, 600);
            StartPosition =
                FormStartPosition.CenterScreen;

            // Borderless — titlebar is in Next.js
            FormBorderStyle = FormBorderStyle.None;

            // Icon
            // this.Icon = new Icon("icon.ico");

            Controls.Add(_webView);

            this.SizeChanged += (s, e) => {
                if (_webView != null)
                {
                    _webView.Size = ClientSize;
                    _webView.Location = Point.Empty;
                }
            };

            ((System.ComponentModel.ISupportInitialize)
                _webView).EndInit();
            ResumeLayout(false);
        }
    }
}