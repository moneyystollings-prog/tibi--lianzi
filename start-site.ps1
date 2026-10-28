param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot '启动字间.ps1') -NoBrowser:$NoBrowser
