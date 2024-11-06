export function isPathMatch(urlPath, pattern) {
  // Normalize paths
  const normalizedPath = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;
  const normalizedPattern = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
  
  // Convert glob pattern to regex
  const regexPattern = normalizedPattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '.*?')
    .replace(/\//g, '\\/?');
  
  const regex = new RegExp(`^${regexPattern}$`);
  
  const isMatch = regex.test(normalizedPath);
  
  console.log('\n🔍 PATH MATCH TEST:');
  console.log('📍 Path:', normalizedPath);
  console.log('🎯 Pattern:', normalizedPattern);
  console.log('🔄 Regex:', regex);
  console.log('✨ Result:', isMatch ? 'MATCH' : 'NO MATCH');
  
  return isMatch;
}

export function shouldCrawlPath(urlPath, options) {
  const { includePaths, excludePaths } = options;
  
  // Normalize the input path
  const normalizedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  
  console.log('\n***** PATH FILTER CHECK *****');
  console.log('Path:', normalizedPath);
  console.log('Exclude patterns:', excludePaths);
  
  // Check excludes first
  if (excludePaths?.length > 0) {
    for (const pattern of excludePaths) {
      if (isPathMatch(normalizedPath, pattern)) {
        console.log('❌ EXCLUDED by pattern:', pattern);
        return false;
      }
    }
  }
  
  console.log('✅ PATH ALLOWED');
  return true;
} 