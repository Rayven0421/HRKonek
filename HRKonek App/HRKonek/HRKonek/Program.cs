using System.Diagnostics;
using System.Threading;

namespace HRKonek;

internal static class Program
{
    public static int Port => ServerManager.Port;

    [STAThread]
    static void Main()
    {
        bool createdNew;
        using var mutex = new Mutex(true, "HRKonekApp", out createdNew);

        if (!createdNew)
        {
            MessageBox.Show("HRKonek is already running.", "HRKonek",
                MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        Application.ApplicationExit += (s, e) =>
        {
            ServerManager.Stop();
        };

        AppDomain.CurrentDomain
            .ProcessExit += (s, e) =>
        {
            ServerManager.Stop();
        };

        Application.ThreadException += (s, e) =>
        {
            MessageBox.Show(
                "Unexpected error:\n" +
                e.Exception.Message,
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            ServerManager.Stop();
            Application.Exit();
        };

        ApplicationConfiguration.Initialize();

        if (!IsNodeJsAvailable())
        {
            MessageBox.Show(
                "Node.js not found. Please install Node.js from https://nodejs.org",
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
