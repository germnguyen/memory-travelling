# Test infrastructure connectivity
$ports = @(
    @{ Name = "PostgreSQL (PostGIS)"; Port = 5432 },
    @{ Name = "Redis"; Port = 6379 },
    @{ Name = "MinIO API"; Port = 9000 },
    @{ Name = "MinIO Console"; Port = 9001 }
)

$failed = $false

foreach ($item in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect("127.0.0.1", $item.Port, $null, $null)
        $success = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
        if ($success -and $tcpClient.Connected) {
            $tcpClient.EndConnect($asyncResult)
            $tcpClient.Close()
            Write-Host " [PASS] $($item.Name) on port $($item.Port) is reachable." -ForegroundColor Green
        } else {
            $tcpClient.Close()
            Write-Host " [FAIL] $($item.Name) on port $($item.Port) is NOT reachable." -ForegroundColor Red
            $failed = $true
        }
    } catch {
        Write-Host " [FAIL] $($item.Name) on port $($item.Port) connection error: $_" -ForegroundColor Red
        $failed = $true
    }
}

if ($failed) {
    Write-Host "`nInfrastructure connectivity check FAILED." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAll infrastructure services are HEALTHY." -ForegroundColor Green
    exit 0
}

