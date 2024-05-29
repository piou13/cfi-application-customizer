$sites = @(
    "https://opiusolutions.sharepoint.com/sites/IFC",
    "https://opiusolutions.sharepoint.com/sites/IFCIT",
    "https://opiusolutions.sharepoint.com/sites/IFCITCOLLAB"
)
$AppName = "intranet-application-customizer"
$sites | ForEach-Object {
    $connection = Connect-PnPOnline -Url $_ -Interactive -ReturnConnection
    $App = Get-PnPApp -Scope Site -Connection $connection | Where-Object { $_.Title -eq $AppName }
    $AppId = $App.Id
    Add-PnPApp -Path .\sharepoint\solution\$AppName.sppkg -Scope Site -Overwrite -Publish -Connection $connection
    $NewApp = Get-PnPApp -Identity $AppId -Scope Site -Connection $connection -ErrorAction SilentlyContinue
    if ($NewApp.CanUpgrade) {
        Write-Host "Update App on site $($_)" -ForegroundColor Green
        Update-PnPApp -Identity $AppId -Scope Site -Connection $connection
    }
}