param([Parameter(Mandatory=$true)][string]$Report,[Parameter(Mandatory=$true)][string]$Root,[switch]$Apply)
$ErrorActionPreference = 'Stop'
$base = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\')
$manifest = Get-Content -LiteralPath $Report -Raw -Encoding UTF8 | ConvertFrom-Json
$result = [System.Collections.Generic.List[object]]::new()
foreach ($entry in $manifest.cleanup_eligible) {
    $target = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($base, $entry.path.Replace('/', '\')))
    if (-not $target.StartsWith($base + '\', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes the authorized Drive root' }
    if ($entry.path -match '(^|/)(01_sensiveis|02_contratos_assinados|03_credenciais)(/|$)') { throw 'Protected directory in cleanup manifest' }
    if (-not $entry.storage_download_verified) { throw 'Storage recovery was not verified' }
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { $result.Add(@{path=$entry.path;status='already_absent'}); continue }
    $item = Get-Item -LiteralPath $target
    $parent = $item.Directory
    $linked = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
    while ($parent -and $parent.FullName.Length -gt $base.Length) {
        if (($parent.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { $linked=$true; break }
        $parent=$parent.Parent
    }
    if ($linked) { $result.Add(@{path=$entry.path;status='preserved_reparse_point'}); continue }
    if ($item.Length -ne $entry.source_bytes -or (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) {
        $result.Add(@{path=$entry.path;status='preserved_changed'}); continue
    }
    if ($Apply) {
        try { Remove-Item -LiteralPath $target -Force; $result.Add(@{path=$entry.path;status='deleted'}) }
        catch { $result.Add(@{path=$entry.path;status='delete_failed';error=$_.Exception.GetType().Name}) }
    } else { $result.Add(@{path=$entry.path;status='verified_ready'}) }
    $result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($Report + '.cleanup.json') -Encoding UTF8
}
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ($Report + '.cleanup.json') -Encoding UTF8
$result | Group-Object status | Select-Object Name,Count | ConvertTo-Json
