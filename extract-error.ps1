$json = Get-Content 'C:\Users\zivda\.claude\projects\C--Repo-projects-ai-news-rag\04c43bfa-6791-4cf5-8273-8b9d896016bf\tool-results\mcp-n8n-mcp-n8n_executions-1767219225819.txt' -Raw | ConvertFrom-Json

$insertNode = $json.data.nodes.'Insert to Supabase'

Write-Host "=== Insert to Supabase Node Status ==="
Write-Host "Status: $($insertNode.status)"
Write-Host "Items Input: $($insertNode.itemsInput)"
Write-Host "Items Output: $($insertNode.itemsOutput)"
Write-Host ""

if ($insertNode.data.output -and $insertNode.data.output.Count -gt 0) {
    Write-Host "=== First Output Item ==="
    $insertNode.data.output[0][0] | ConvertTo-Json -Depth 5
} else {
    Write-Host "No output data"
}
