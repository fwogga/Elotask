# Teste de falha do backend: corre a partir de qualquer pasta
Set-Location (Join-Path $PSScriptRoot "..")
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "logs") | Out-Null
Start-Transcript -Path (Join-Path $PSScriptRoot "logs\testar_falha.log") -Force | Out-Null
$compose = Join-Path (Get-Location) "docker-compose.yml"
$url = "http://localhost:8081/api/health"
function Pedido {
    try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $url; return "$($r.Headers['X-Servidor'])" } catch { return $null }
}
$id = (docker compose ps -q servidor).Trim()
$ipDocker = (docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" $id).Trim()
function Nome($s) { if ($s -like "*$ipDocker*") { "contentor servidor ($s)" } elseif ($s) { "servidor do PC ($s)" } else { "FALHOU" } }

Write-Host "===== ANTES =====" -ForegroundColor Cyan
docker compose ps --format "table {{.Service}}`t{{.Status}}`t{{.Ports}}"
Write-Host "Pedido respondido por: $(Nome (Pedido))"

Write-Host ""
Write-Host "===== FALHA: docker compose kill servidor (com pedidos a correr) =====" -ForegroundColor Yellow
$job = Start-Job -ArgumentList $compose { param($f) Start-Sleep -Milliseconds 1000; docker compose -f $f kill servidor 2>$null | Out-Null }
$ok = 0; $falhas = 0; $servidores = @{}
for ($i = 0; $i -lt 120; $i++) {
    $s = Pedido
    if ($s) { $ok++; $n = Nome $s; $servidores[$n] = 1 + [int]$servidores[$n] } else { $falhas++ }
    Start-Sleep -Milliseconds 50
}
Receive-Job $job -Wait -ErrorAction SilentlyContinue 2>$null | Out-Null
Write-Host "Pedidos: $($ok + $falhas)  ok: $ok  falhados: $falhas"
$servidores.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Value) respondidos por $($_.Key)" }
docker compose ps -a --format "table {{.Service}}`t{{.Status}}" servidor

Write-Host ""
Write-Host "===== RECUPERACAO: docker compose start servidor =====" -ForegroundColor Green
$t0 = Get-Date
docker compose start servidor 2>$null | Out-Null
do {
    Start-Sleep -Milliseconds 100
    docker exec $id node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>$null
} until ($LASTEXITCODE -eq 0 -or ((Get-Date) - $t0).TotalSeconds -gt 60)
Write-Host "Contentor servidor a responder outra vez em $([math]::Round(((Get-Date) - $t0).TotalSeconds, 1)) s"

Write-Host ""
Write-Host "===== DEPOIS =====" -ForegroundColor Cyan
docker compose ps --format "table {{.Service}}`t{{.Status}}`t{{.Ports}}"
Write-Host ""
docker compose logs servidor --tail 3 --no-log-prefix
Stop-Transcript | Out-Null
