$json = Get-Content 'C:\Users\zivda\.claude\projects\C--Repo-projects-ai-news-rag\04c43bfa-6791-4cf5-8273-8b9d896016bf\tool-results\mcp-n8n-mcp-n8n_executions-1767219225819.txt' -Raw | ConvertFrom-Json

Write-Host "=== Semantic Deduplication ===" -ForegroundColor Yellow
$dedupNode = $json.data.nodes.'Semantic Deduplication'
Write-Host "Status: $($dedupNode.status)"
Write-Host "Items Input: $($dedupNode.itemsInput)"
Write-Host "Items Output: $($dedupNode.itemsOutput)"
Write-Host ""

Write-Host "=== Rank & Classify Articles ===" -ForegroundColor Yellow
$rankNode = $json.data.nodes.'Rank & Classify Articles'
Write-Host "Status: $($rankNode.status)"
Write-Host "Items Input: $($rankNode.itemsInput)"
Write-Host "Items Output: $($rankNode.itemsOutput)"
Write-Host ""

Write-Host "=== Insert to Supabase ===" -ForegroundColor Yellow
$insertNode = $json.data.nodes.'Insert to Supabase'
Write-Host "Status: $($insertNode.status)"
Write-Host "Items Input: $($insertNode.itemsInput)"
Write-Host "Items Output: $($insertNode.itemsOutput)"
