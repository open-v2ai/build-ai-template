docker run -d --restart=always \
  --name redis-local \
  -p 6379:6379 \
  -v $HOME/data/redis:/data \
  redis:7.2.4 redis-server \
  --requirepass 123456 --save 60 1 --loglevel warning