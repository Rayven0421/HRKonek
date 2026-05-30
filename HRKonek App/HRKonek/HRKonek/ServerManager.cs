using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Threading;
using System.Threading.Tasks;

namespace HRKonek
{
    public static class ServerManager
    {
        // Path to your Next.js project
        public static string NextJsPath => AppPaths.Root;

        private static Process? _serverProcess;
        public static Process? ServerProcess => _serverProcess;
        public static int Port { get; private set; }
            = 3000;

        // ── Find a free port starting at 3000 ───────
        public static int FindFreePort(
            int startPort = 3000)
        {
            for (int port = startPort;
                 port < startPort + 20; port++)
            {
                if (IsPortFree(port)) return port;
            }
            return startPort;
        }

        public static bool IsPortFree(int port)
        {
            var listeners = IPGlobalProperties
                .GetIPGlobalProperties()
                .GetActiveTcpListeners();
            return listeners
                .All(ep => ep.Port != port);
        }

        // ── Kill any process already using a port ───
        public static void KillPortProcess(int port)
        {
            try
            {
                // Find PID using netstat
                var netstat = Process.Start(
                    new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments =
                            $"/c netstat -ano | " +
                            $"findstr :{port}",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    })!;

                string output = netstat
                    .StandardOutput.ReadToEnd();
                netstat.WaitForExit();

                foreach (string line in
                    output.Split('\n'))
                {
                    if (!line.Contains("LISTENING"))
                        continue;

                    string[] parts = line.Split(
                        new char[] { ' ' },
                        StringSplitOptions
                        .RemoveEmptyEntries);

                    if (parts.Length >= 5 &&
                        int.TryParse(
                            parts[^1].Trim(),
                            out int pid))
                    {
                        var proc =
                            Process.GetProcessById(pid);

                        // Only kill node processes
                        if (proc.ProcessName
                            .ToLower()
                            .Contains("node"))
                        {
                            proc.Kill(true);
                            Thread.Sleep(500);
                        }
                    }
                }
            }
            catch { /* ignore */ }
        }

        // ── Start Next.js production server ─────────
        public static async Task<bool> StartAsync(
            IProgress<string> progress,
            CancellationToken ct)
        {
            // Step 1: Resolve path
            string projectPath = Path.GetFullPath(
                NextJsPath);

            progress.Report(
                "Locating HRKonek application...");

            if (!Directory.Exists(projectPath))
            {
                progress.Report(
                    "ERROR: Project not found at: " +
                    projectPath);
                return false;
            }

            // Check .next folder exists 
            // (production build)
            string nextBuild = Path.Combine(
                projectPath, ".next");
            if (!Directory.Exists(nextBuild))
            {
                progress.Report(
                    "ERROR: No production build found." +
                    " Run 'build.bat' first.");
                return false;
            }

            progress.Report(
                "Checking port availability...");

            // Step 2: Handle port 3000
            if (!IsPortFree(3000))
            {
                progress.Report(
                    "Port 3000 in use — " +
                    "stopping existing process...");
                KillPortProcess(3000);
                await Task.Delay(1000, ct);
            }

            Port = IsPortFree(3000)
                ? 3000
                : FindFreePort(3001);

            progress.Report(
                $"Starting server on port {Port}...");

            // Step 3: Find node/npx
            string npxPath = FindNpx();
            if (string.IsNullOrEmpty(npxPath))
            {
                progress.Report(
                    "ERROR: Node.js not found. " +
                    "Please install Node.js.");
                return false;
            }

            // Step 4: Launch next start
            _serverProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = npxPath,
                    Arguments =
                        $"next start -p {Port}",
                    WorkingDirectory = projectPath,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                }
            };

            _serverProcess.Start();

            // Step 5: Wait for server to respond
            progress.Report(
                "Waiting for server to be ready...");

            bool ready = await WaitForServerAsync(
                Port, 30, progress, ct);

            if (!ready)
            {
                progress.Report(
                    "ERROR: Server failed to start.");
                return false;
            }

            progress.Report("Server ready!");
            return true;
        }

        private static async Task<bool>
            WaitForServerAsync(
            int port, int timeoutSecs,
            IProgress<string> progress,
            CancellationToken ct)
        {
            using var http = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(2)
            };

            int dots = 0;
            var deadline = DateTime.UtcNow
                .AddSeconds(timeoutSecs);

            while (DateTime.UtcNow < deadline)
            {
                ct.ThrowIfCancellationRequested();

                try
                {
                    var res = await http.GetAsync(
                        $"http://localhost:{port}",
                        ct);

                    if (res.IsSuccessStatusCode ||
                        (int)res.StatusCode < 500)
                        return true;
                }
                catch { /* not ready yet */ }

                dots = (dots % 3) + 1;
                progress.Report(
                    $"Starting server" +
                    new string('.', dots));

                await Task.Delay(800, ct);
            }
            return false;
        }

        private static string FindNpx()
        {
            // Common Node.js install locations
            string[] candidates = {
                // Windows default
                Path.Combine(
                    Environment.GetFolderPath(
                        Environment.SpecialFolder
                        .ProgramFiles),
                    @"nodejs\npx.cmd"),
                Path.Combine(
                    Environment.GetFolderPath(
                        Environment.SpecialFolder
                        .ProgramFilesX86),
                    @"nodejs\npx.cmd"),
                // nvm locations
                Path.Combine(
                    Environment.GetFolderPath(
                        Environment.SpecialFolder
                        .ApplicationData),
                    @"nvm\current\npx.cmd"),
                // Scoop
                Path.Combine(
                    Environment.GetFolderPath(
                        Environment.SpecialFolder
                        .UserProfile),
                    @"scoop\apps\nodejs\current\npx.cmd"),
            };

            foreach (string path in candidates)
                if (File.Exists(path)) return path;

            // Try PATH
            return "npx.cmd";
        }

        public static void Stop()
        {
            try
            {
                if (_serverProcess == null) return;

                KillProcessTree(_serverProcess.Id);

                _serverProcess.Kill(true);
                _serverProcess.WaitForExit(3000);
                _serverProcess.Dispose();
                _serverProcess = null;
            }
            catch { /* process may already be gone */ }
            finally
            {
                _serverProcess = null;
                try { KillPortProcess(Port); }
                catch { }
            }
        }

        private static void KillProcessTree(int pid)
        {
            try
            {
                var kill = Process.Start(
                    new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments =
                            $"/F /T /PID {pid}",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                    })!;
                kill.WaitForExit(3000);
            }
            catch { }
        }
    }
}