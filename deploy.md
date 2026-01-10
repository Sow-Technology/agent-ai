pm2 start npm --name "bulk-worker" -- run worker:bulk
pm2 start npm --name "agent-ai-main" -- start -- -p 3001
