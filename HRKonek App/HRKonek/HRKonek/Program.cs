using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Text;

namespace HRKonek;

internal static class Program
{
    // ── Entry Point ───────────────────────────────────────────────────
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();

        // ── Pre-flight: Node.js in PATH? ─────────────────────────────
        if (!IsNodeJsAvailable())
        {
            MessageBox.Show(
                "Node.js not found. Please install Node.js from https://nodejs.org",
                "HRKonek",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        // ── Pre-flight: Port 3000 free? ──────────────────────────────
        if (IsPortInUse(3000))
        {
            MessageBox.Show(
                "Port 3000 is already in use. Close any running Node.js processes and try again.",
                "HRKonek",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        // ── Show splash screen ───────────────────────────────────────
        var splash = new SplashForm();
        splash.Show();
        splash.Update(); // force an immediate paint

        // ── Start `npm run dev` ──────────────────────────────────────
        var npmOutput = new StringBuilder();
        Process? npmProcess = StartNpmDev(npmOutput);

        if (npmProcess is null)
        {
            splash.Close();
            splash.Dispose();
            MessageBox.Show(
                "Failed to start the development server.",
                "HRKonek",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        // ── Synchronous poll — keeps the UI message pump alive ───────
        bool ready = false;
        string failReason = "timeout";
        var stopwatch = Stopwatch.StartNew();

        while (stopwatch.Elapsed.TotalSeconds < 60)
        {
            // Pump all pending WinForms messages (paint, timers, input…)
            Application.DoEvents();

            // Did the npm process die?
            if (npmProcess.HasExited)
            {
                failReason = "process_exited";
                break;
            }

            // Check buffered output for EADDRINUSE
            string snapshot;
            lock (npmOutput) { snapshot = npmOutput.ToString(); }

            if (snapshot.Contains("EADDRINUSE", StringComparison.OrdinalIgnoreCase))
            {
                failReason = "port_in_use";
                break;
            }

            // Synchronous HTTP GET — avoids async/SyncContext issues
            if (IsServerReady())
            {
                ready = true;
                break;
            }

            // Wait ~500 ms while still pumping UI messages
            PumpFor(500);
        }

        splash.Close();
        splash.Dispose();

        if (!ready)
        {
            KillProcessTree(npmProcess);
            string message = failReason switch
            {
                "port_in_use"
                    => "Port 3000 is already in use. Close any running Node.js processes and try again.",
                "process_exited"
                    => "The development server process exited unexpectedly.",
                _ => "The development server timed out after 60 seconds."
            };
            MessageBox.Show(message, "HRKonek", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        // ── Launch main window ───────────────────────────────────────
        var mainForm = new MainForm(npmProcess, npmOutput);
        Application.Run(mainForm);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Synchronous HTTP GET to localhost:3000.
    /// Any response (including error pages) means the server is alive.
    /// Only connection-refused / timeout are treated as "not ready".
    /// </summary>
    private static bool IsServerReady()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create("http://localhost:3000");
            request.Timeout = 2000;
            request.Method = "GET";
            using var response = (HttpWebResponse)request.GetResponse();
            return true;
        }
        catch (WebException ex) when (ex.Response is HttpWebResponse)
        {
            // Got a response (4xx / 5xx) — server is alive
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Blocks for <paramref name="ms"/> milliseconds while pumping
    /// WinForms messages every ~10 ms so the splash stays responsive.
    /// Uses <see cref="Stopwatch"/> to avoid Environment.TickCount overflow.
    /// </summary>
    private static void PumpFor(int ms)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < ms)
        {
            Application.DoEvents();
            Thread.Sleep(10);
        }
    }

    /// <summary>Returns true if <c>node --version</c> succeeds.</summary>
    private static bool IsNodeJsAvailable()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var process = Process.Start(psi);
            if (process is null) return false;
            process.WaitForExit(5000);
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>Returns true if the given TCP port is already listening.</summary>
    private static bool IsPortInUse(int port)
    {
        try
        {
            var properties = IPGlobalProperties.GetIPGlobalProperties();
            return properties.GetActiveTcpListeners().Any(l => l.Port == port);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Spawns <c>cmd.exe /c npm run dev</c> with stdout/stderr piped
    /// into <paramref name="output"/>.  No console window is shown.
    /// </summary>
    private static Process? StartNpmDev(StringBuilder output)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm run dev",
                WorkingDirectory = @"C:\Users\rayve\Desktop\HRKonek\hrkonek",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var process = Process.Start(psi);
            if (process is null) return null;

            process.OutputDataReceived += (_, e) =>
            {
                if (e.Data is not null)
                    lock (output) { output.AppendLine(e.Data); }
            };
            process.ErrorDataReceived += (_, e) =>
            {
                if (e.Data is not null)
                    lock (output) { output.AppendLine(e.Data); }
            };

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            return process;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Kills a process and its entire tree via <c>taskkill /F /T</c>
    /// so no orphaned Node.js processes remain.
    /// </summary>
    private static void KillProcessTree(Process process)
    {
        if (process.HasExited) return;
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "taskkill",
                Arguments = $"/F /T /PID {process.Id}",
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }
        catch
        {
            // Best-effort kill — swallow exceptions
        }
    }
}
