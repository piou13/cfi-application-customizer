$sites = @(
    "https://opiusolutions.sharepoint.com/sites/IFC",
    "https://opiusolutions.sharepoint.com/sites/IFCIT",
    "https://opiusolutions.sharepoint.com/sites/IFCITCOLLAB"
)
$AppName = "intranet-application-customizer"
$sites | ForEach-Object {
    $connection = Connect-PnPOnline -Url $_ -ClientId c7a58eee-d8e0-4069-a9bb-9f25dc72760c -Thumbprint F3270EFE63C521B272A693619D90E44AB8F4E712 -Tenant 048a32cf-125e-463d-8b13-c6f0937a81ea -ReturnConnection
    $App = Get-PnPApp -Scope Site -Connection $connection | Where-Object { $_.Title -eq $AppName }
    $AppId = $App.Id
    Add-PnPApp -Path .\sharepoint\solution\$AppName.sppkg -Scope Site -Overwrite -Publish -Connection $connection
    $NewApp = Get-PnPApp -Identity $AppId -Scope Site -Connection $connection -ErrorAction SilentlyContinue
    if ($NewApp.CanUpgrade) {
        Write-Host "Update App on site $($_)" -ForegroundColor Green
        Update-PnPApp -Identity $AppId -Scope Site -Connection $connection
    }
}