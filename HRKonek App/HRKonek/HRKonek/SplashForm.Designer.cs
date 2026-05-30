#nullable enable
using Microsoft.Web.WebView2.WinForms;

namespace HRKonek
{
    partial class SplashForm
    {
        private System.ComponentModel.IContainer?
            components = null;
        private WebView2 _splashView = null!;

        protected override void Dispose(
            bool disposing)
        {
            if (disposing && components != null)
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            _splashView = new WebView2();
            ((System.ComponentModel.ISupportInitialize)
                _splashView).BeginInit();
            SuspendLayout();

            _splashView.Dock = DockStyle.Fill;

            Name            = "SplashForm";
            Text            = "HRKonek";
            ClientSize      = new Size(480, 300);
            FormBorderStyle = FormBorderStyle.None;
            StartPosition   =
                FormStartPosition.CenterScreen;
            BackColor       =
                Color.FromArgb(15, 23, 42);

            Controls.Add(_splashView);

            ((System.ComponentModel.ISupportInitialize)
                _splashView).EndInit();
            ResumeLayout(false);
        }
    }
}
