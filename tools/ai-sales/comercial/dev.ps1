# Kill any process holding port 3000 before starting
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

cmd /c "C:\Users\luan\Documents\GitHub\educacional\node_modules\.bin\next.cmd" dev --webpack
