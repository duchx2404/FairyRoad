param([string]$Remote = 'origin')
$ErrorActionPreference = 'Stop'
$repoPath = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $repoPath 'dist'
if (!(Test-Path -LiteralPath (Join-Path $distPath 'index.html'))) { throw 'Run npm run build first.' }
$gitPath = Join-Path $repoPath '.git'
$taskIndex = Join-Path ([IO.Path]::GetTempPath()) ('fairyroad-pages-' + [guid]::NewGuid().ToString('N'))
$previousIndex = $env:GIT_INDEX_FILE
function GitChecked {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$GitArgs)
  $result = & git @GitArgs
  if ($LASTEXITCODE -ne 0) { throw "git failed: $($GitArgs[0])" }
  return $result
}
try {
  $remoteHead = GitChecked -C $repoPath ls-remote --heads $Remote gh-pages
  $parentArgs = @()
  if ($remoteHead) {
    GitChecked -C $repoPath fetch $Remote gh-pages | Out-Null
    $parentArgs = @('-p', (GitChecked -C $repoPath rev-parse FETCH_HEAD))
  }
  $env:GIT_INDEX_FILE = $taskIndex
  GitChecked --git-dir=$gitPath read-tree --empty | Out-Null
  Set-Content -LiteralPath (Join-Path $distPath '.nojekyll') -Value '' -NoNewline
  GitChecked -C $distPath --git-dir=$gitPath --work-tree=$distPath add --all --force . | Out-Null
  $tree = GitChecked --git-dir=$gitPath write-tree
  $commit = GitChecked --git-dir=$gitPath commit-tree $tree @parentArgs -m 'Publish FairyRoad browser build'
  GitChecked -C $repoPath push $Remote "${commit}:refs/heads/gh-pages"
  Write-Output "Published build commit: $commit"
} finally {
  $env:GIT_INDEX_FILE = $previousIndex
  if (Test-Path -LiteralPath $taskIndex) { Remove-Item -LiteralPath $taskIndex }
}
